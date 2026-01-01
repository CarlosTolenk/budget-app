import { BankAdapter } from "./bank-adapter";
import { EmailMessage } from "../types/email-message";
import { detectMerchantBucket } from "./utils/bucket-detector";

const currencySymbolMap: Record<string, string> = {
  "RD$": "DOP",
  "US$": "USD",
  "EUR$": "EUR",
  "$": "DOP",
};

export class BancoSantaCruzAdapter implements BankAdapter {
  readonly name = "banco-santa-cruz";

  matches(message: EmailMessage): boolean {
    const from = message.from.email.toLowerCase();
    const subject = message.subject.toLowerCase();
    const body = message.body.toLowerCase();
    return (
      from.includes("bsc.com.do") ||
      subject.includes("banco santa cruz") ||
      body.includes("banco santa cruz")
    );
  }

  parse(message: EmailMessage) {
    const plainBody = message.body.replace(/\r/g, "");
    const amountMatch = plainBody.match(/Monto:\s*(RD\$|US\$|EUR\$|\$)?\s*([\d.,]+)/i);
    if (!amountMatch) {
      return null;
    }

    const amount = this.parseAmount(amountMatch[2]);
    if (amount === null) {
      return null;
    }
    const currency = this.detectCurrency(amountMatch[1], plainBody);

    const merchantMatch = plainBody.match(/Lugar de transacci[óo]n:\s*(.+)/i);
    const merchant = merchantMatch ? merchantMatch[1].split(/\n/)[0].trim() : "Banco Santa Cruz";

    const dateMatch = plainBody.match(/Fecha y hora:\s*(.+)/i);
    const parsedDate = this.parseDate(dateMatch ? dateMatch[1] : undefined) ?? message.receivedAt;

    return {
      amount,
      currency,
      merchant,
      date: parsedDate,
      bucket: detectMerchantBucket(merchant),
      source: "EMAIL" as const,
      emailMessageId: message.id,
      rawPayload: {
        snippet: message.snippet,
        subject: message.subject,
      },
    };
  }

  private parseAmount(value: string): number | null {
    const normalized = value.replace(/\./g, "").replace(/,/g, ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private detectCurrency(symbol?: string, body?: string): string {
    if (symbol) {
      const trimmed = symbol.trim().toUpperCase();
      if (currencySymbolMap[trimmed]) {
        return currencySymbolMap[trimmed];
      }
    }

    if (body) {
      if (/USD|d[oó]lar/i.test(body)) {
        return "USD";
      }
      if (/EUR|euro/i.test(body)) {
        return "EUR";
      }
    }

    return "DOP";
  }

  private parseDate(source?: string): Date | null {
    if (!source) {
      return null;
    }

    const match = source.match(
      /(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/,
    );
    if (!match) {
      return null;
    }

    const [, dayStr, monthStr, yearStr, hourStr, minuteStr, secondStr] = match;
    const day = Number(dayStr);
    const month = Number(monthStr);
    const year = yearStr.length === 2 ? Number(`20${yearStr}`) : Number(yearStr);
    const hours = hourStr ? Number(hourStr) : 0;
    const minutes = minuteStr ? Number(minuteStr) : 0;
    const seconds = secondStr ? Number(secondStr) : 0;

    const parsed = new Date(year, month - 1, day, hours, minutes, seconds);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
}
