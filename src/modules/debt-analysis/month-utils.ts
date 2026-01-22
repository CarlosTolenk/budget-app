const MONTH_REGEX = /^\d{4}-\d{2}$/;

export function assertMonthId(monthId: string): void {
  if (!MONTH_REGEX.test(monthId)) {
    throw new Error(`Invalid month id: ${monthId}`);
  }
}

export function parseMonthId(monthId: string): { year: number; month: number } {
  assertMonthId(monthId);
  const [year, month] = monthId.split("-").map(Number);
  return { year, month };
}

export function formatMonthId(year: number, month: number): string {
  const safeMonth = Math.max(1, Math.min(12, month));
  return `${year}-${String(safeMonth).padStart(2, "0")}`;
}

export function addMonths(monthId: string, offset: number): string {
  const { year, month } = parseMonthId(monthId);
  const total = year * 12 + (month - 1) + offset;
  const nextYear = Math.floor(total / 12);
  const nextMonth = (total % 12) + 1;
  return formatMonthId(nextYear, nextMonth);
}

export function diffMonths(startMonthId: string, endMonthId: string): number {
  const start = parseMonthId(startMonthId);
  const end = parseMonthId(endMonthId);
  return end.year * 12 + (end.month - 1) - (start.year * 12 + (start.month - 1));
}

export function compareMonthId(a: string, b: string): number {
  return diffMonths(b, a);
}
