// 開支分攤的金額計算。金額最多至小數第二位，內部一律以「分」（cents）為單位的整數運算，
// 避免浮點誤差；對外輸出元（number，最多兩位小數）或字串（存入 Decimal 欄位用）。

/** 將元轉為分。輸入須最多兩位小數，否則丟出錯誤。 */
export function toCents(amount: number): number {
  const cents = Math.round(amount * 100);
  if (!Number.isFinite(cents) || Math.abs(amount * 100 - cents) > 1e-6) {
    throw new Error("金額最多至小數第二位");
  }
  return cents;
}

/** 將分轉回元（number，最多兩位小數）。 */
export function fromCents(cents: number): number {
  return cents / 100;
}

/** 將分轉為兩位小數字串（存入 Decimal 欄位用，例如 "333.34"）。 */
export function centsToDecimalString(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Feature: 新增開支
 * Rule: 均分時金額平均分配至小數第二位，尾差以 0.01 依參與者加入旅程的先後順序分配給前幾位參與者
 * 對應規格：spec/features/新增開支.feature
 *
 * 依參與者人數均分金額（單位：分），回傳與傳入順序對齊的分攤金額陣列。
 * 呼叫端必須以「參與者加入旅程的先後順序」排序後傳入人數對應的順位。
 * 不變條件：回傳陣列總和 = totalCents（對應 spec/erm.dbml：所有 expense_splits 的 amount 總和 = expenses.amount）。
 */
export function splitEvenlyCents(totalCents: number, count: number): number[] {
  if (!Number.isInteger(totalCents) || totalCents <= 0) {
    throw new Error("金額必須為大於 0 的分為單位整數");
  }
  if (!Number.isInteger(count) || count < 1) {
    throw new Error("參與分攤的團員至少一人");
  }

  const base = Math.floor(totalCents / count);
  const remainder = totalCents - base * count;

  // 尾差以 0.01（1 分）依序分配給前 remainder 位參與者
  return Array.from({ length: count }, (_, i) => (i < remainder ? base + 1 : base));
}

/** splitEvenlyCents 的元版本：輸入元（最多兩位小數），回傳元的分攤金額陣列。 */
export function splitEvenly(amount: number, count: number): number[] {
  return splitEvenlyCents(toCents(amount), count).map(fromCents);
}
