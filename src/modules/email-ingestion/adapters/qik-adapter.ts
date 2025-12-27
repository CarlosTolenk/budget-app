import { BankAdapter } from "./bank-adapter";
import { EmailMessage } from "../types/email-message";
import { detectMerchantBucket } from "./utils/bucket-detector";

const currencySymbolMap: Record<string, string> = {
  "RD$": "DOP",
  "US$": "USD",
  "EUR$": "EUR",
  "$": "DOP",
};

export class QikAdapter implements BankAdapter {
  readonly name = "qik";

  matches(message: EmailMessage): boolean {
    const subject = message.subject.toLowerCase();
    const from = message.from.email.toLowerCase();
    const body = message.body.toLowerCase();
    return (
      subject.includes("qik") ||
      from.includes("@qik.") ||
      body.includes("notificaciones@qik.do") ||
      body.includes("tarjeta de crédito qik") ||
      body.includes("tarjeta credito qik")
    );
  }

  parse(message: EmailMessage) {
    const sanitized = this.sanitize(message.body);

    const amountMatch =
      sanitized.match(/transacci[óo]n de\s*(RD\$|US\$|EUR\$|\$)?\s*([\d.,]+)/i) ??
      sanitized.match(/Monto\s*(RD\$|US\$|EUR\$|\$)?\s*([\d.,]+)/i);
    if (!amountMatch) {
      return null;
    }

    const amount = this.parseAmount(amountMatch[2]);
    if (amount === null) {
      return null;
    }

    const currency = this.detectCurrency(amountMatch[1], sanitized);
    const merchant = this.extractMerchant(sanitized) ?? message.from.name ?? "Qik";
    const date = this.extractDate(sanitized) ?? message.receivedAt;

    return {
      amount,
      currency,
      merchant,
      date,
      bucket: detectMerchantBucket(merchant),
      source: "EMAIL" as const,
      emailMessageId: message.id,
      rawPayload: {
        snippet: message.snippet,
        subject: message.subject,
      },
    };
  }

  private sanitize(body: string): string {
    return body.replace(/\r/g, " ").replace(/\*/g, " ").replace(/\s+/g, " ").trim();
  }

  private parseAmount(token: string): number | null {
    const normalized = token.replace(/,/g, "");
    const value = Number(normalized);
    return Number.isFinite(value) ? value : null;
  }

  private detectCurrency(symbol?: string, source?: string): string {
    if (symbol) {
      const trimmed = symbol.trim().toUpperCase();
      if (currencySymbolMap[trimmed]) {
        return currencySymbolMap[trimmed];
      }
    }

    if (source) {
      const lower = source.toLowerCase();
      if (lower.includes("usd") || lower.includes("dólar") || lower.includes("dolar")) {
        return "USD";
      }
      if (lower.includes("eur") || lower.includes("euro")) {
        return "EUR";
      }
    }

    return "DOP";
  }

  private extractMerchant(text: string): string | null {
    const inlineMatch = text.match(
      /transacci[óo]n de\s*(?:RD\$|US\$|EUR\$|\$)?\s*[\d.,]+\s+en\s+([A-Za-z0-9 .,'-]+?)(?=\s+con\b)/i,
    );
    if (inlineMatch) {
      return inlineMatch[1].trim();
    }

    const localityMatch = text.match(/Localidad\s+([A-Za-z0-9 .,'-]+?)(?=\s+(?:Fecha|Monto|Balance)\b)/i);
    if (localityMatch) {
      return localityMatch[1].trim();
    }

    return null;
  }

  private extractDate(text: string): Date | null {
    const match = text.match(
      /Fecha y hora\s+(\d{2})[-/](\d{2})[-/](\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)(?:\s*\([A-Z]+\))?/i,
    );
    if (!match) {
      return null;
    }

    const [, month, day, year, hourPart, minutePart, meridian] = match;
    let hours = Number(hourPart) % 12;
    if (meridian.toUpperCase() === "PM") {
      hours += 12;
    }
    const minutes = Number(minutePart);
    const parsed = new Date(Number(year), Number(month) - 1, Number(day), hours, minutes, 0);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
}
