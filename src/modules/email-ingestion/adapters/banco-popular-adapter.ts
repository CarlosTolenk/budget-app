import { BankAdapter } from "./bank-adapter";
import { EmailMessage } from "../types/email-message";
import { parseTabularTransaction } from "./utils/tabular-transaction-parser";
import { detectMerchantBucket } from "./utils/bucket-detector";

export class BancoPopularAdapter implements BankAdapter {
  readonly name = "banco-popular";

  matches(message: EmailMessage): boolean {
    const from = message.from.email.toLowerCase();
    return from.includes("popularenlinea.com") || /notificación de consumo/i.test(message.subject);
  }

  parse(message: EmailMessage) {
    const parsed = parseTabularTransaction(message, { merchantFallback: "Banco Popular" });
    if (!parsed) {
      return null;
    }

    return {
      amount: parsed.amount,
      currency: parsed.currency,
      merchant: parsed.merchant,
      date: parsed.date,
      bucket: detectMerchantBucket(parsed.merchant),
      source: "EMAIL" as const,
      emailMessageId: message.id,
      rawPayload: {
        snippet: message.snippet,
        subject: message.subject,
      },
    };
  }

}
