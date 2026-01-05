import { EmailMessage } from "../../types/email-message";

export interface ParsedTabularTransaction {
  amount: number;
  currency: string;
  merchant: string;
  date: Date;
}

interface ParseOptions {
  merchantFallback?: string;
  defaultCurrency?: string;
}

const AMOUNT_REGEX = /(RD\$|US\$|EUR\$|\$)\s*[\d.,]+/i;
const DATE_REGEX = /\d{2}\/\d{2}\/\d{4}/;
const TIME_REGEX = /\b\d{1,2}:\d{2}(?::\d{1,2})?\b/;
const STATUS_KEYWORDS = [
  "aprobada",
  "aprobado",
  "rechazada",
  "rechazado",
  "procesada",
  "procesado",
  "denegada",
  "denegado",
  "anulada",
  "confirmada",
  "realizada",
];

const currencySymbolMap: Record<string, string> = {
  "RD$": "DOP",
  "US$": "USD",
  "EUR$": "EUR",
  "$": "DOP",
};

const currencyDescriptors = new Set([
  "peso",
  "pesos",
  "dominicano",
  "dominicanos",
  "moneda",
  "dolar",
  "dolares",
  "dólar",
  "dólares",
  "usd",
  "eur",
  "euro",
  "euros",
  "rd",
  "rd$",
  "us$",
  "eu$",
]);

const MAX_COMBINED_LINES = 6;

export function parseTabularTransaction(
  message: EmailMessage,
  options: ParseOptions = {},
): ParsedTabularTransaction | null {
  const line = findDataLine(message.body);
  if (!line) {
    return null;
  }

  const tokens = tokenize(line);
  const amountIdx = tokens.findIndex((token) => AMOUNT_REGEX.test(token));
  if (amountIdx === -1) {
    return null;
  }

  const amount = parseAmount(tokens[amountIdx]);
  if (amount === null) {
    return null;
  }

  const dateIdx = tokens.findIndex((token) => DATE_REGEX.test(token));
  if (dateIdx === -1) {
    return null;
  }

  const timeIdx = dateIdx + 1 < tokens.length && TIME_REGEX.test(tokens[dateIdx + 1]) ? dateIdx + 1 : undefined;
  const statusIdx = findStatusIndex(tokens, dateIdx);

  const descriptorTokens = tokens.slice(amountIdx + 1, Math.max(amountIdx + 4, dateIdx));
  const currency = detectCurrency(tokens[amountIdx], descriptorTokens, options.defaultCurrency ?? "DOP");
  const merchant =
    extractMerchant(tokens, amountIdx, dateIdx, statusIdx, timeIdx) ||
    options.merchantFallback ||
    message.from.name ||
    message.from.email;
  const transactionDate =
    parseDate(tokens[dateIdx], timeIdx ? tokens[timeIdx] : undefined) ?? new Date(message.receivedAt);

  return {
    amount,
    currency,
    merchant,
    date: transactionDate,
  };
}

function findDataLine(body: string): string | null {
  const normalized = body.replace(/\r/g, "\n").replace(/\u00a0/g, " ");
  const cleanedLines = normalized
    .split(/\n+/)
    .map((line) => line.replace(/\t+/g, " ").trim())
    .filter(Boolean)
    .filter((line) => !isForwardHeader(line));

  for (let i = 0; i < cleanedLines.length; i++) {
    let combined = "";
    for (let offset = 0; offset < MAX_COMBINED_LINES && i + offset < cleanedLines.length; offset++) {
      combined = combined ? `${combined} ${cleanedLines[i + offset]}` : cleanedLines[i + offset];
      if (AMOUNT_REGEX.test(combined) && DATE_REGEX.test(combined)) {
        return combined;
      }
    }
  }

  const flattened = cleanedLines.join(" ");
  return AMOUNT_REGEX.test(flattened) && DATE_REGEX.test(flattened) ? flattened : null;
}

function tokenize(line: string): string[] {
  return line
    .replace(/\*/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

function isForwardHeader(line: string): boolean {
  const lower = line.toLowerCase();
  return (
    lower.startsWith("from:") ||
    lower.startsWith("de:") ||
    lower.startsWith("date:") ||
    lower.startsWith("fecha:") ||
    lower.startsWith("subject:") ||
    lower.startsWith("asunto:") ||
    lower.startsWith("to:") ||
    lower.startsWith("para:") ||
    lower.startsWith("cc:") ||
    lower.startsWith("bcc:") ||
    lower.includes("forwarded message") ||
    lower.includes("mensaje reenviado") ||
    /^-+$/.test(line)
  );
}

function parseAmount(token: string): number | null {
  const match = token.match(/(RD\$|US\$|EUR\$|\$)?\s*([\d.,]+)/i);
  if (!match) {
    return null;
  }
  const numeric = match[2].replace(/,/g, "");
  const value = Number(numeric);
  return Number.isFinite(value) ? value : null;
}

function detectCurrency(amountToken: string, descriptorTokens: string[], defaultCurrency: string): string {
  for (const symbol of Object.keys(currencySymbolMap)) {
    if (amountToken.includes(symbol)) {
      return currencySymbolMap[symbol];
    }
  }

  const descriptor = descriptorTokens.join(" ").toLowerCase();
  if (descriptor.includes("peso")) return "DOP";
  if (descriptor.includes("dólar") || descriptor.includes("dolar")) return "USD";
  if (descriptor.includes("euro")) return "EUR";

  return defaultCurrency;
}

function parseDate(dateToken: string, timeToken?: string): Date | null {
  const match = dateToken.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) {
    return null;
  }

  const [, day, month, year] = match;
  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  if (timeToken) {
    const timeMatch = timeToken.match(/(\d{1,2}):(\d{2})(?::(\d{1,2}))?/);
    if (timeMatch) {
      hours = Number(timeMatch[1]);
      minutes = Number(timeMatch[2]);
      seconds = Number(timeMatch[3] ?? 0);

      if (hours > 23 || minutes > 59 || seconds > 59) {
        hours = 0;
        minutes = 0;
        seconds = 0;
      }
    }
  }

  const parsed = new Date(Number(year), Number(month) - 1, Number(day), hours, minutes, seconds);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function findStatusIndex(tokens: string[], dateIdx: number): number {
  for (let i = dateIdx + 1; i < tokens.length; i++) {
    const normalized = normalizeToken(tokens[i]);
    if (normalized && STATUS_KEYWORDS.includes(normalized)) {
      return i;
    }
  }
  return tokens.length;
}

function extractMerchant(
  tokens: string[],
  amountIdx: number,
  dateIdx: number,
  statusIdx: number,
  timeIdx?: number,
): string {
  let merchantTokens = tokens.slice(amountIdx + 1, dateIdx).filter((token) => !isCurrencyDescriptor(token));

  if (merchantTokens.length === 0) {
    const start = timeIdx && timeIdx < statusIdx ? timeIdx + 1 : dateIdx + 1;
    const end = statusIdx > start ? statusIdx : tokens.length;
    merchantTokens = tokens.slice(start, end);
  }

  return merchantTokens.join(" ").trim();
}

function isCurrencyDescriptor(token: string): boolean {
  const normalized = normalizeToken(token);
  return normalized.length > 0 && currencyDescriptors.has(normalized);
}

function normalizeToken(token: string): string {
  return token
    .toLowerCase()
    .replace(/[^a-záéíóúüñ]/g, "")
    .trim();
}
