import {
    CategoryRepository,
    RuleRepository,
    TransactionRepository,
    TransactionDraftRepository,
    UserBucketRepository,
} from "@/domain/repositories";
import { CreateDraftInput } from "@/domain/transaction-drafts/transaction-draft";
import { EmailProvider } from "../providers/email-provider";
import { BankAdapter } from "../adapters/bank-adapter";
import { EmailMessage } from "../types/email-message";
import { toAppUtc } from "@/lib/dates/timezone";
import { PresetBucketKey } from "@/domain/user-buckets/user-bucket";

export interface EmailIngestionResult {
    imported: number;
    skipped: number;
    errors: { messageId: string; reason: EmailIngestionSkipReason; subject?: string }[];
}

export type EmailIngestionSkipReason =
    | "already-imported"
    | "already-draft"
    | "adapter-missing"
    | "parse-failed";

export class EmailIngestionService {
    constructor(
        private readonly adapters: BankAdapter[],
        private readonly transactionRepository: TransactionRepository,
        private readonly draftRepository: TransactionDraftRepository,
        private readonly categoryRepository: CategoryRepository,
        private readonly ruleRepository: RuleRepository,
        private readonly userBucketRepository: UserBucketRepository,
    ) {
    }

    async run(userId: string, provider: EmailProvider): Promise<EmailIngestionResult> {
        const [messages, categories, rules] = await Promise.all([
            provider.listMessages(),
            this.categoryRepository.listAll(userId),
            this.ruleRepository.listAll(userId),
        ]);

        const errors: EmailIngestionResult["errors"] = [];
        const bucketCache = new Map<PresetBucketKey, string>();
        const toPersist: CreateDraftInput[] = [];

        for (const message of messages) {
            const recordSkip = (reason: EmailIngestionSkipReason) =>
                errors.push({messageId: message.id, reason, subject: message.subject});

            const exists = await this.transactionRepository.findByEmailMessageId(message.id, userId);
            if (exists) {
                recordSkip("already-imported");
                continue;
            }

            const existingDraft = message.id ? await this.draftRepository.findByEmailMessageId(message.id, userId) : null;
            if (existingDraft) {
                recordSkip("already-draft");
                continue;
            }

            const adapter = this.adapters.find((candidate) => candidate.matches(message));
            if (!adapter) {
                recordSkip("adapter-missing");
                continue;
            }

            const parsed = adapter.parse(message);
            if (!parsed) {
                recordSkip("parse-failed");
                continue;
            }

            const categoryId = this.mapCategory(message, rules, categories);
            const category = categoryId ? categories.find((entry) => entry.id === categoryId) : undefined;
            const presetBucket = category?.bucket ?? parsed.bucket;
            let userBucketId: string | undefined = category?.userBucketId;
            if (!userBucketId && presetBucket) {
                userBucketId = await this.ensurePresetBucket(userId, presetBucket, bucketCache);
            }
            if (!userBucketId) {
                recordSkip("parse-failed");
                continue;
            }

            const enrichedPayload = {
                ...(parsed.rawPayload ?? {}),
                messageSubject: message.subject,
                messageSnippet: message.snippet,
                forwardedBy: message.from,
                recipients: message.to,
                gmailLabels: message.labels,
                receivedAt: message.receivedAt,
                adapter: adapter.name,
            };

            toPersist.push({
                ...parsed,
                date: toAppUtc(parsed.date),
                userId,
                categoryId,
                userBucketId,
                rawPayload: enrichedPayload,
            });
        }

        for (const draft of toPersist) {
            await this.draftRepository.create(draft);
        }

        return {
            imported: toPersist.length,
            skipped: messages.length - toPersist.length,
            errors,
        };
    }

    private async ensurePresetBucket(
        userId: string,
        presetKey: PresetBucketKey,
        cache: Map<PresetBucketKey, string>,
    ): Promise<string> {
        const cached = cache.get(presetKey);
        if (cached) {
            return cached;
        }
        const existing = await this.userBucketRepository.findByPresetKey(userId, presetKey);
        if (existing) {
            cache.set(presetKey, existing.id);
            return existing.id;
        }
        const created = await this.userBucketRepository.createPreset(userId, presetKey);
        cache.set(presetKey, created.id);
        return created.id;
    }

    private mapCategory(
        message: EmailMessage,
        rules: Awaited<ReturnType<RuleRepository["listAll"]>>,
        categories: Awaited<ReturnType<CategoryRepository["listAll"]>>,
    ): string | undefined {
        const orderedRules = [...rules].sort((a, b) => b.priority - a.priority);
        const target = `${message.subject} ${message.body}`;
        for (const rule of orderedRules) {
            const regex = new RegExp(rule.pattern, "i");
            if (regex.test(target)) {
                return rule.categoryId;
            }
        }

        return categories.find((category) => category.name.toLowerCase() === (message.from.name ?? "").toLowerCase())?.id;
    }
}
