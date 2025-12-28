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
    return body
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\r|\n|\*/g, " ")
      .replace(/\s+/g, " ")
      .trim();
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
    const merchantPattern = "([A-Za-z0-9 .,'/&-]+?)";
    const inlineMatch = text.match(
      new RegExp(
        `transacci[óo]n de\\s*(?:RD\\$|US\\$|EUR\\$|\\$)?\\s*[\\d.,]+\\s+en\\s+${merchantPattern}(?=\\s+con\\b)`,
        "i",
      ),
    );
    if (inlineMatch) {
      return inlineMatch[1].trim();
    }

    const labelMatch = text.match(
      new RegExp(
        `(?:Localidad|Comercio|Establecimiento)\\s*(?::\\s*)?\\s+${merchantPattern}(?=\\s+(?:Fecha|Monto|Balance|Disponible|Tarjeta|Si\\b))`,
        "i",
      ),
    );
    if (labelMatch) {
      return labelMatch[1].trim();
    }

    return null;
  }

  private extractDate(text: string): Date | null {
    const match = text.match(
      /Fecha(?: y hora)?\s+(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:\s+(\d{1,2}):(\d{2})\s*(AM|PM)?(?:\s*\([A-Z]+\))?)?/i,
    );
    if (!match) {
      return null;
    }

    const [, first, second, year, hourPart, minutePart, meridian] = match;
    const { month, day } = this.resolveDateOrder(Number(first), Number(second));
    if (month === null || day === null) {
      return null;
    }

    let hours = hourPart ? Number(hourPart) : 0;
    let minutes = minutePart ? Number(minutePart) : 0;
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
      hours = 0;
      minutes = 0;
    }

    if (meridian) {
      const normalizedMeridian = meridian.toUpperCase();
      hours = hours % 12;
      if (normalizedMeridian === "PM") {
        hours += 12;
      }
    }

    const parsed = new Date(Number(year), month - 1, day, hours, minutes, 0);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private resolveDateOrder(first: number, second: number): { month: number | null; day: number | null } {
    const isFirstValidMonth = first >= 1 && first <= 12;
    const isSecondValidMonth = second >= 1 && second <= 12;
    const isFirstValidDay = first >= 1 && first <= 31;
    const isSecondValidDay = second >= 1 && second <= 31;

    if (first > 12 && second > 12) {
      return { month: null, day: null };
    }

    if (first > 12 && isSecondValidMonth && isFirstValidDay) {
      return { month: second, day: first };
    }

    if (second > 12 && isFirstValidMonth && isSecondValidDay) {
      return { month: first, day: second };
    }

    if (isFirstValidMonth && isSecondValidDay) {
      return { month: first, day: second };
    }

    if (isSecondValidMonth && isFirstValidDay) {
      return { month: second, day: first };
    }

    return { month: null, day: null };
  }
}
