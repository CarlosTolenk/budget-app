import { BankAdapter } from "./bank-adapter";
import { EmailMessage } from "../types/email-message";
import { parseTabularTransaction } from "./utils/tabular-transaction-parser";
import { detectMerchantBucket } from "./utils/bucket-detector";

export class AsociacionCibaoAdapter implements BankAdapter {
  readonly name = "asociacion-cibao";

  matches(message: EmailMessage): boolean {
    const subject = message.subject.toLowerCase();
    const body = message.body.toLowerCase();
    return (
      subject.includes("alertas de transacciones") ||
      body.includes("alertacibao@cibao.com.do") ||
      body.includes("asociación cibao") ||
      body.includes("asociacion cibao")
    );
  }

  parse(message: EmailMessage) {
    const parsed = parseTabularTransaction(message, { merchantFallback: "Asociación Cibao" });
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
