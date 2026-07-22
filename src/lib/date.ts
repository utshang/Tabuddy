// Date -> "yyyy-MM-dd"（以本機時區為準，避免 toISOString 因轉 UTC 造成日期偏移）
export function formatDateValue(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

// "yyyy-MM-dd" -> Date（以本機時區解析，避免 `new Date(string)` 依 ISO 規則當成 UTC 午夜）
export function parseDateValue(value: string): Date | undefined {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

// 以使用者裝置時區為準的當天日期
export function localToday() {
  return formatDateValue(new Date());
}
