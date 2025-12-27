import { BankAdapter } from "./bank-adapter";
import { EmailMessage } from "../types/email-message";
import { Bucket } from "@/domain/value-objects/bucket";

const bucketKeywordMap: Record<Bucket, RegExp[]> = {
  NEEDS: [/supermarket/i, /rent/i, /utilities/i],
  WANTS: [/spotify/i, /uber/i, /delivery/i],
  SAVINGS: [/transfer/i, /investment/i],
};

export class GenericBankAdapter implements BankAdapter {
  readonly name = "generic";

  matches(message: EmailMessage): boolean {
    return /compra|purchase|transaction/i.test(message.subject);
  }

  parse(message: EmailMessage) {
    const amountMatch = message.body.match(/(-?\d+[\.,]\d{2})/);
    const currencyMatch = message.body.match(/(USD|EUR|MXN|COP|ARS|CLP|PEN)/i);
    const merchantMatch = message.body.match(/en\s+([A-Za-z0-9\s]+)/i);

    if (!amountMatch) {
      return null;
    }

    const amount = Number(amountMatch[1].replace(",", "."));
    const currency = currencyMatch ? currencyMatch[1].toUpperCase() : "DOP";
    const merchant = merchantMatch ? merchantMatch[1].trim() : message.from.name ?? message.from.email;

    return {
      amount,
      currency,
      merchant,
      date: message.receivedAt,
      bucket: this.detectBucket(message, merchant),
      source: "EMAIL" as const,
      emailMessageId: message.id,
      rawPayload: { snippet: message.snippet },
    };
  }

  private detectBucket(message: EmailMessage, merchant?: string): Bucket {
    for (const bucket of Object.keys(bucketKeywordMap) as Bucket[]) {
      const keywords = bucketKeywordMap[bucket];
      if (keywords.some((regex) => regex.test(message.subject) || (merchant && regex.test(merchant)))) {
        return bucket;
      }
    }
    return "NEEDS";
  }
}
