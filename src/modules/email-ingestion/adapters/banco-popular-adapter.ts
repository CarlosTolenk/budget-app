import { BankAdapter } from "./bank-adapter";
import { EmailMessage } from "../types/email-message";
import { parseTabularTransaction } from "./utils/tabular-transaction-parser";
import { detectMerchantBucket } from "./utils/bucket-detector";

export class BancoPopularAdapter implements BankAdapter {
  readonly name = "banco-popular";

  matches(message: EmailMessage): boolean {
    const from = normalizeText(message.from.email);
    const subject = normalizeText(message.subject);
    const snippet = normalizeText(message.snippet ?? "");
    const body = normalizeText(message.body);

    if (from.includes("popularenlinea.com")) {
      return true;
    }

    if (subject.includes("notificacion de consumo")) {
      return true;
    }

    const forwardedIndicator = [snippet, body].some((text) =>
      POPULAR_BODY_KEYWORDS.some((keyword) => text.includes(keyword)),
    );

    return forwardedIndicator;
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

const RAW_POPULAR_BODY_KEYWORDS = [
  "notificaciones@popularenlinea.com",
  "banco popular dominicano",
  "tarjeta visa debito",
  "tarjeta visa débito",
  "gracias por utilizar su tarjeta",
];

const POPULAR_BODY_KEYWORDS = RAW_POPULAR_BODY_KEYWORDS.map((keyword) => normalizeText(keyword));

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
