export const APP_TIMEZONE = "America/Santo_Domingo";
export const APP_TIMEZONE_OFFSET_MINUTES = 4 * 60; // UTC-4

export function toAppUtc(date: Date): Date {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new Error("Invalid date provided to toAppUtc");
  }
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();
  const milliseconds = date.getUTCMilliseconds();
  const offsetMs = APP_TIMEZONE_OFFSET_MINUTES * 60 * 1000;
  const utcMs = Date.UTC(year, month, day, hours, minutes, seconds, milliseconds) + offsetMs;
  return new Date(utcMs);
}

export function toAppLocal(date: Date): Date {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new Error("Invalid date provided to toAppLocal");
  }
  const offsetMs = APP_TIMEZONE_OFFSET_MINUTES * 60 * 1000;
  return new Date(date.getTime() - offsetMs);
}

export function formatInAppTimezone(
  date: Date,
  options: Intl.DateTimeFormatOptions,
  locale = "es-DO",
): string {
  return new Intl.DateTimeFormat(locale, { timeZone: APP_TIMEZONE, ...options }).format(date);
}

export function formatAppDateInput(date: Date): string {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new Error("Invalid date provided to formatAppDateInput");
  }
  return formatInAppTimezone(date, { year: "numeric", month: "2-digit", day: "2-digit" }, "en-CA");
}

export function getAppDateRange(dateString: string): { startUtc: Date; endUtc: Date } {
  const [yearString, monthString, dayString] = dateString.split("-");
  const year = Number(yearString);
  const monthIndex = Number(monthString) - 1;
  const day = Number(dayString);
  if (![year, monthIndex, day].every((value) => Number.isFinite(value))) {
    throw new Error(`Invalid date string: ${dateString}`);
  }
  const offsetMs = APP_TIMEZONE_OFFSET_MINUTES * 60 * 1000;
  const startUtc = new Date(Date.UTC(year, monthIndex, day) + offsetMs);
  const endUtc = new Date(Date.UTC(year, monthIndex, day + 1) + offsetMs);
  return { startUtc, endUtc };
}
