import {
  CategoryRepository,
  RuleRepository,
  TransactionRepository,
  TransactionDraftRepository,
} from "@/domain/repositories";
import { CreateDraftInput } from "@/domain/transaction-drafts/transaction-draft";
import { EmailProvider } from "../providers/email-provider";
import { BankAdapter } from "../adapters/bank-adapter";
import { EmailMessage } from "../types/email-message";

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
  ) {}

  async run(userId: string, provider: EmailProvider): Promise<EmailIngestionResult> {
    const [messages, categories, rules] = await Promise.all([
      provider.listMessages(),
      this.categoryRepository.listAll(userId),
      this.ruleRepository.listAll(userId),
    ]);

    const errors: EmailIngestionResult["errors"] = [];
    const toPersist: CreateDraftInput[] = [];

    for (const message of messages) {
      const recordSkip = (reason: EmailIngestionSkipReason) =>
        errors.push({ messageId: message.id, reason, subject: message.subject });

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
      const bucket = categoryId
        ? categories.find((category) => category.id === categoryId)?.bucket ?? parsed.bucket
        : parsed.bucket;

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

      toPersist.push({ ...parsed, userId, categoryId, bucket, rawPayload: enrichedPayload });
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
