import { APP_TIMEZONE_OFFSET_MINUTES } from "@/lib/dates/timezone";

export function getMonthUtcRange(monthId: string): { startUtc: Date; endUtc: Date } {
  const [yearString, monthString] = monthId.split("-");
  const year = Number(yearString);
  const monthIndex = Number(monthString) - 1;

  if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) {
    throw new Error(`Invalid month identifier: ${monthId}`);
  }

  const offsetMs = APP_TIMEZONE_OFFSET_MINUTES * 60 * 1000;

  const startUtc = new Date(Date.UTC(year, monthIndex, 1) + offsetMs);
  const endUtc = new Date(Date.UTC(year, monthIndex + 1, 1) + offsetMs);

  return { startUtc, endUtc };
}
