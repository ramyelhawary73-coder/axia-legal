// Presentation only. Stored timestamps and authorization stay server-authoritative.
export function formatControlDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "غير محدد";
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "long", timeStyle: "short" }).format(date);
}
