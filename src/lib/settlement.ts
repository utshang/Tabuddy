// 查看結算的純函式計算（CLAUDE.md：settlement 演算法寫成純函式 + 完整單元測試）。
// 金額一律以「分」（cents）為單位的整數運算（同 expense-split.ts），避免浮點誤差；
// 結算結果為即時計算的衍生資料，不持久化（spec/features/查看結算.feature）。

/** 一筆開支的結算輸入：付款人與各參與者的分攤金額（分）。 */
export type SettlementExpense = {
  payerId: string;
  amountCents: number;
  splits: ReadonlyArray<{ userId: string; amountCents: number }>;
};

/** 單一團員的餘額：付出、被分攤與淨額（分）。 */
export type MemberBalance = {
  userId: string;
  paidCents: number;
  shareCents: number;
  netCents: number;
};

/** 結清清單中的一筆轉帳（分）。 */
export type Transfer = {
  fromUserId: string;
  toUserId: string;
  amountCents: number;
};

/**
 * Feature: 查看結算
 * Rule: 每位團員的淨額 = 他付出的總金額 − 他被分攤的總金額
 * Rule: 餘額清單列出旅程所有團員，含淨額為 0 者
 * Rule: 所有團員的淨額總和為 0
 * 對應規格：spec/features/查看結算.feature
 *
 * 計算每位團員的餘額。memberIds 必須以「加入旅程的先後順序」排序傳入，
 * 回傳陣列保持相同順序（後續貪婪配對的同額 tie-break 依據）。
 * 未參與任何開支的團員照列（付出 0、被分攤 0、淨額 0）。
 * 不變條件：只要每筆開支的分攤總和 = 開支金額（資料庫 CHECK 保證），所有淨額總和必為 0。
 */
export function computeBalancesCents(
  memberIds: ReadonlyArray<string>,
  expenses: ReadonlyArray<SettlementExpense>,
): MemberBalance[] {
  const paid = new Map<string, number>();
  const share = new Map<string, number>();

  for (const expense of expenses) {
    paid.set(
      expense.payerId,
      (paid.get(expense.payerId) ?? 0) + expense.amountCents,
    );
    for (const split of expense.splits) {
      share.set(
        split.userId,
        (share.get(split.userId) ?? 0) + split.amountCents,
      );
    }
  }

  return memberIds.map((userId) => {
    const paidCents = paid.get(userId) ?? 0;
    const shareCents = share.get(userId) ?? 0;
    return { userId, paidCents, shareCents, netCents: paidCents - shareCents };
  });
}

/**
 * Feature: 查看結算
 * Rule: 系統以貪婪配對計算結清清單（每輪由淨額最低者轉帳給淨額最高者），轉帳筆數至多為團員數 − 1
 * Rule: 淨額相同時依團員加入旅程的先後順序優先配對，結清清單依轉帳產生順序排列
 * Rule: 無任何開支或所有團員淨額為 0 時，結清清單為空
 * Rule: 套用結清清單後所有團員淨額為 0（演算法不變條件，非使用者操作）
 * 對應規格：spec/features/查看結算.feature
 *
 * balances 必須以「加入旅程的先後順序」排序傳入（computeBalancesCents 的輸出即符合）；
 * 掃描時以嚴格比較取最大／最小值，同額時自然保留順位在前（較早加入）者。
 * 每輪轉帳金額 = min(最大債權, 最大債務)，至少歸零一人，故轉帳筆數至多為團員數 − 1。
 * 
 * 這是 settlement.ts:88-99 貪婪結算演算法裡每一輪要配對的兩個角色：

creditor（債權人）：淨額 net > 0 的人——他付出的錢比被分攤的多，別人欠他錢，所以是收錢方。掃描時取淨額最大的那位（被欠最多的人）。
debtor（債務人）：淨額 net < 0 的人——他被分攤的比付出的多,欠別人錢，所以是付錢方。掃描時取淨額最小（負最多）的那位（欠最多的人）。
每一輪的流程（對應 settlement.ts:101-108）：

找出最大債權人和最大債務人
轉帳金額取兩者較小值：min(creditor.net, -debtor.net)
產生一筆轉帳：debtor → creditor（所以 fromUserId 是 debtor、toUserId 是 creditor）
兩人淨額各自沖銷，至少一人歸零，然後進下一輪
舉例:A 付了 900 但只該分攤 300(淨額 +600,creditor),B 沒付錢但該分攤 600(淨額 −600,debtor),那這輪就產生「B 轉 600 給 A」,兩人同時歸零。

當找不到任何 creditor 或 debtor（所有人淨額為 0）時迴圈結束。因為每輪至少歸零一人，轉帳筆數最多為團員數 − 1，這就是「最少轉帳次數」的來源。
 */

export function settleGreedyCents(
  balances: ReadonlyArray<MemberBalance>,
): Transfer[] {
  const nets = balances.map((balance) => ({
    userId: balance.userId,
    net: balance.netCents,
  }));

  const transfers: Transfer[] = [];

  for (;;) {
    let creditor: (typeof nets)[number] | null = null;
    let debtor: (typeof nets)[number] | null = null;
    for (const entry of nets) {
      if (entry.net > 0 && (creditor === null || entry.net > creditor.net)) {
        creditor = entry;
      }
      if (entry.net < 0 && (debtor === null || entry.net < debtor.net)) {
        debtor = entry;
      }
    }
    if (creditor === null || debtor === null) break;

    const amountCents = Math.min(creditor.net, -debtor.net);
    transfers.push({
      fromUserId: debtor.userId,
      toUserId: creditor.userId,
      amountCents,
    });
    creditor.net -= amountCents;
    debtor.net += amountCents;
  }

  return transfers;
}

/**
 * Feature: 查看結算
 * Rule: 套用結清清單後所有團員淨額為 0（演算法不變條件，非使用者操作）
 * 對應規格：spec/features/查看結算.feature
 *
 * 驗證用純函式：將結清清單套用回餘額，回傳套用後各團員淨額（分）。
 * 僅作為演算法不變條件的驗證（單元測試用），無對應的使用者操作。
 */
export function applyTransfersCents(
  balances: ReadonlyArray<MemberBalance>,
  transfers: ReadonlyArray<Transfer>,
): Array<{ userId: string; netCents: number }> {
  const nets = new Map(
    balances.map((balance) => [balance.userId, balance.netCents]),
  );
  for (const transfer of transfers) {
    nets.set(
      transfer.fromUserId,
      (nets.get(transfer.fromUserId) ?? 0) + transfer.amountCents,
    );
    nets.set(
      transfer.toUserId,
      (nets.get(transfer.toUserId) ?? 0) - transfer.amountCents,
    );
  }
  return balances.map((balance) => ({
    userId: balance.userId,
    netCents: nets.get(balance.userId) ?? 0,
  }));
}
