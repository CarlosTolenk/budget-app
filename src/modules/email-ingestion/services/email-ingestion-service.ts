import { CategoryRepository, RuleRepository, TransactionRepository, TransactionDraftRepository } from "@/domain/repositories";
import { CreateDraftInput } from "@/domain/transaction-drafts/transaction-draft";
import { EmailProvider } from "../providers/email-provider";
import { BankAdapter } from "../adapters/bank-adapter";
import { EmailMessage } from "../types/email-message";

export interface EmailIngestionResult {
  imported: number;
  skipped: number;
  errors: { messageId: string; reason: string }[];
}

export class EmailIngestionService {
  constructor(
    private readonly provider: EmailProvider,
    private readonly adapters: BankAdapter[],
    private readonly transactionRepository: TransactionRepository,
    private readonly draftRepository: TransactionDraftRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly ruleRepository: RuleRepository,
    private readonly label?: string,
  ) {}

  async run(): Promise<EmailIngestionResult> {
    const [messages, categories, rules] = await Promise.all([
      this.provider.listMessages({ label: this.label }),
      this.categoryRepository.listAll(),
      this.ruleRepository.listAll(),
    ]);

    console.log(`Found ${messages.length} messages`);
    console.log(messages);
    console.log(categories);

    const errors: EmailIngestionResult["errors"] = [];
    const toPersist: CreateDraftInput[] = [];

    for (const message of messages) {
      const exists = await this.transactionRepository.findByEmailMessageId(message.id);
      if (exists) {
        continue;
      }

      const existingDraft = message.id ? await this.draftRepository.findByEmailMessageId(message.id) : null;
      if (existingDraft) {
        continue;
      }

      const adapter = this.adapters.find((candidate) => candidate.matches(message));
      if (!adapter) {
        errors.push({ messageId: message.id, reason: "No adapter" });
        continue;
      }

      const parsed = adapter.parse(message);
      if (!parsed) {
        errors.push({ messageId: message.id, reason: "Unable to parse" });
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

      toPersist.push({ ...parsed, categoryId, bucket, rawPayload: enrichedPayload });
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

  private mapCategory(message: EmailMessage, rules: Awaited<ReturnType<RuleRepository["listAll"]>>, categories: Awaited<ReturnType<CategoryRepository["listAll"]>>): string | undefined {
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
