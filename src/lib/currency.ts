// 金額顯示格式：日幣符號 + 千分位；有小數時最多顯示兩位（spec.md：所有金額為日幣）
export function formatYen(amount: number): string {
  return `¥${amount.toLocaleString("zh-TW", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

// 開支日期分組標題格式：YYYY-MM-DD → YYYY年M月D日（對照 doc/design-refs/expense.jpg）
export function formatExpenseDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${year}年${Number(month)}月${Number(day)}日`;
}
