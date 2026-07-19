import { describe, expect, it } from "vitest";
import {
  applyTransfersCents,
  computeBalancesCents,
  settleGreedyCents,
  type SettlementExpense,
} from "@/lib/settlement";
import { splitEvenlyCents, toCents } from "@/lib/expense-split";

// 對應 spec/features/查看結算.feature 的共用情境：
// 旅程有團員 A、B、C（依加入順序），開支為
// 住宿 3000（A 付、均分 A:1000, B:1000, C:1000）、吃喝 1200（B 付、均分 A:400, B:400, C:400）
const MEMBERS = ["A", "B", "C"];
const EXPENSES: SettlementExpense[] = [
  {
    payerId: "A",
    amountCents: toCents(3000),
    splits: [
      { userId: "A", amountCents: toCents(1000) },
      { userId: "B", amountCents: toCents(1000) },
      { userId: "C", amountCents: toCents(1000) },
    ],
  },
  {
    payerId: "B",
    amountCents: toCents(1200),
    splits: [
      { userId: "A", amountCents: toCents(400) },
      { userId: "B", amountCents: toCents(400) },
      { userId: "C", amountCents: toCents(400) },
    ],
  },
];

describe("computeBalancesCents", () => {
  // Rule: 每位團員的淨額 = 他付出的總金額 − 他被分攤的總金額
  it("三人旅程各自淨額計算（A:1600、B:-200、C:-1400）", () => {
    expect(computeBalancesCents(MEMBERS, EXPENSES)).toEqual([
      { userId: "A", paidCents: 300000, shareCents: 140000, netCents: 160000 },
      { userId: "B", paidCents: 120000, shareCents: 140000, netCents: -20000 },
      { userId: "C", paidCents: 0, shareCents: 140000, netCents: -140000 },
    ]);
  });

  // Rule: 所有團員的淨額總和為 0
  it("三人旅程淨額總和為 0", () => {
    const sum = computeBalancesCents(MEMBERS, EXPENSES).reduce(
      (acc, balance) => acc + balance.netCents,
      0,
    );
    expect(sum).toBe(0);
  });

  // Rule: 餘額清單列出旅程所有團員，含淨額為 0 者
  it("未參與任何開支的團員淨額為 0 且列於餘額清單", () => {
    const balances = computeBalancesCents(
      ["A", "B", "C", "D"],
      [
        {
          payerId: "A",
          amountCents: toCents(3000),
          splits: [
            { userId: "A", amountCents: toCents(1000) },
            { userId: "B", amountCents: toCents(1000) },
            { userId: "C", amountCents: toCents(1000) },
          ],
        },
      ],
    );
    expect(balances).toEqual([
      { userId: "A", paidCents: 300000, shareCents: 100000, netCents: 200000 },
      { userId: "B", paidCents: 0, shareCents: 100000, netCents: -100000 },
      { userId: "C", paidCents: 0, shareCents: 100000, netCents: -100000 },
      { userId: "D", paidCents: 0, shareCents: 0, netCents: 0 },
    ]);
  });

  // 均分尾差情境下淨額總和仍為 0（1000 由 3 人均分 → 333.34、333.33、333.33）
  it("含尾差的均分開支淨額總和仍為 0", () => {
    const [a, b, c] = splitEvenlyCents(toCents(1000), 3);
    const balances = computeBalancesCents(MEMBERS, [
      {
        payerId: "A",
        amountCents: toCents(1000),
        splits: [
          { userId: "A", amountCents: a },
          { userId: "B", amountCents: b },
          { userId: "C", amountCents: c },
        ],
      },
    ]);
    expect(balances.reduce((acc, x) => acc + x.netCents, 0)).toBe(0);
  });
});

describe("settleGreedyCents", () => {
  // Rule: 系統以貪婪配對計算結清清單（每輪由淨額最低者轉帳給淨額最高者），轉帳筆數至多為團員數 − 1
  it("三人情境結算為 2 筆轉帳（C→A 1400、B→A 200）", () => {
    const transfers = settleGreedyCents(computeBalancesCents(MEMBERS, EXPENSES));
    expect(transfers).toEqual([
      { fromUserId: "C", toUserId: "A", amountCents: 140000 },
      { fromUserId: "B", toUserId: "A", amountCents: 20000 },
    ]);
  });

  // Rule: 淨額相同時依團員加入旅程的先後順序優先配對，結清清單依轉帳產生順序排列
  it("兩位團員同額欠款時依加入順序先後轉帳（A→C 200、B→C 200）", () => {
    const transfers = settleGreedyCents(
      computeBalancesCents(MEMBERS, [
        {
          payerId: "C",
          amountCents: toCents(400),
          splits: [
            { userId: "A", amountCents: toCents(200) },
            { userId: "B", amountCents: toCents(200) },
          ],
        },
      ]),
    );
    expect(transfers).toEqual([
      { fromUserId: "A", toUserId: "C", amountCents: 20000 },
      { fromUserId: "B", toUserId: "C", amountCents: 20000 },
    ]);
  });

  // Rule: 無任何開支或所有團員淨額為 0 時，結清清單為空
  it("旅程無任何開支時結清清單為空", () => {
    expect(settleGreedyCents(computeBalancesCents(MEMBERS, []))).toEqual([]);
  });

  it("所有團員淨額互相抵銷時結清清單為空", () => {
    const transfers = settleGreedyCents(
      computeBalancesCents(
        ["A", "B"],
        [
          {
            payerId: "A",
            amountCents: toCents(1000),
            splits: [{ userId: "B", amountCents: toCents(1000) }],
          },
          {
            payerId: "B",
            amountCents: toCents(1000),
            splits: [{ userId: "A", amountCents: toCents(1000) }],
          },
        ],
      ),
    );
    expect(transfers).toEqual([]);
  });

  // Rule: 套用結清清單後所有團員淨額為 0（演算法不變條件，非使用者操作）
  it("三人情境套用結清清單後各人淨額歸零", () => {
    const balances = computeBalancesCents(MEMBERS, EXPENSES);
    const transfers = settleGreedyCents(balances);
    expect(applyTransfersCents(balances, transfers)).toEqual([
      { userId: "A", netCents: 0 },
      { userId: "B", netCents: 0 },
      { userId: "C", netCents: 0 },
    ]);
  });

  // 不變條件：轉帳筆數至多為團員數 − 1、套用後全員歸零（含尾差與多人情境）
  it("多人含尾差情境：筆數 ≤ 團員數 − 1 且套用後全員歸零", () => {
    const members = ["A", "B", "C", "D", "E"];
    const [a, b, c, d, e] = splitEvenlyCents(toCents(10000.01), 5);
    const balances = computeBalancesCents(members, [
      {
        payerId: "A",
        amountCents: toCents(10000.01),
        splits: [
          { userId: "A", amountCents: a },
          { userId: "B", amountCents: b },
          { userId: "C", amountCents: c },
          { userId: "D", amountCents: d },
          { userId: "E", amountCents: e },
        ],
      },
      {
        payerId: "C",
        amountCents: toCents(333.33),
        splits: [
          { userId: "B", amountCents: toCents(111.11) },
          { userId: "D", amountCents: toCents(111.11) },
          { userId: "E", amountCents: toCents(111.11) },
        ],
      },
    ]);
    const transfers = settleGreedyCents(balances);
    expect(transfers.length).toBeLessThanOrEqual(members.length - 1);
    for (const transfer of transfers) {
      expect(transfer.amountCents).toBeGreaterThan(0);
    }
    expect(
      applyTransfersCents(balances, transfers).every((x) => x.netCents === 0),
    ).toBe(true);
  });
});
