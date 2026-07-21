import { describe, expect, it } from "vitest";
import {
  centsToDecimalString,
  splitEvenly,
  splitEvenlyCents,
  toCents,
} from "@/lib/expense-split";

describe("splitEvenly", () => {
  // Rule: 均分時金額平均分配至小數第二位，尾差以 0.01 依參與者加入旅程的先後順序分配給前幾位參與者
  it("1000 元由 3 人均分 → 333.34、333.33、333.33", () => {
    expect(splitEvenly(1000, 3)).toEqual([333.34, 333.33, 333.33]);
  });

  // Rule: 分攤金額可為 0（極小金額均分時，後位參與者可分得 0）
  it("0.02 元由 3 人均分 → 0.01、0.01、0.00", () => {
    expect(splitEvenly(0.02, 3)).toEqual([0.01, 0.01, 0]);
  });

  it("整除時每人分得相同金額", () => {
    expect(splitEvenly(900, 3)).toEqual([300, 300, 300]);
  });

  it("含小數的金額均分（100.01 元由 2 人均分 → 50.01、50.00）", () => {
    expect(splitEvenly(100.01, 2)).toEqual([50.01, 50]);
  });

  it("僅一人參與時分得全額", () => {
    expect(splitEvenly(999.99, 1)).toEqual([999.99]);
  });

  // 不變條件：所有參與者的分攤金額總和 = 該筆開支金額
  it("分攤總和恆等於開支金額", () => {
    const cases: Array<[number, number]> = [
      [1000, 3],
      [0.02, 3],
      [100.01, 7],
      [3000, 4],
      [0.01, 2],
    ];
    for (const [amount, count] of cases) {
      const sumCents = splitEvenlyCents(toCents(amount), count).reduce(
        (a, b) => a + b,
        0,
      );
      expect(sumCents).toBe(toCents(amount));
    }
  });

  // Rule: 金額為必填且必須大於 0
  it("金額為 0 時丟出錯誤", () => {
    expect(() => splitEvenly(0, 2)).toThrow();
  });

  // Rule: 參與分攤的團員至少一人
  it("參與人數為 0 時丟出錯誤", () => {
    expect(() => splitEvenly(1000, 0)).toThrow();
  });
});

describe("toCents", () => {
  it("兩位小數的金額正確轉為分", () => {
    expect(toCents(333.34)).toBe(33334);
    expect(toCents(0.01)).toBe(1);
  });

  it("超過兩位小數時丟出錯誤", () => {
    expect(() => toCents(1.005)).toThrow();
  });
});

describe("centsToDecimalString", () => {
  it("轉為兩位小數字串", () => {
    expect(centsToDecimalString(33334)).toBe("333.34");
    expect(centsToDecimalString(0)).toBe("0.00");
  });
});
