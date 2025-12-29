export function formatCurrency(value: number, currency = "DOP") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
}

export function formatPercent(value: number) {
  return new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 0 }).format(value);
}

export function formatMonthLabel(monthId: string, locale = "es-ES"): string {
  const match = /^(\d{4})-(\d{2})$/.exec(monthId);
  if (!match) {
    return monthId;
  }
  const [, year, month] = match;
  const date = new Date(Number(year), Number(month) - 1, 1);
  const monthName = new Intl.DateTimeFormat(locale, { month: "long" }).format(date);
  const capitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  return `${capitalized} ${date.getFullYear()}`;
}
