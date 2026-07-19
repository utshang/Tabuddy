import { formatYen } from "@/lib/currency";
import { LedgerRealtimeRefresher } from "@/components/trips/ledger-realtime-refresher";

export type SettlementMember = {
  id: string;
  name: string;
  isMe: boolean;
  /** 他付出的總金額（元） */
  paid: number;
  /** 他被分攤的總金額（元） */
  share: number;
  /** 淨額 = 付出 − 被分攤（元） */
  net: number;
};

export type SettlementTransfer = {
  fromName: string;
  fromIsMe: boolean;
  toName: string;
  toIsMe: boolean;
  amount: number;
};

function memberLabel(name: string, isMe: boolean) {
  return isMe ? `${name} (我)` : name;
}

// 淨額的正負著色與符號（對照 doc/design-refs/expense-split.jpg：正綠、負紅）
function netDisplay(net: number) {
  if (net > 0) {
    return { text: `+${formatYen(net)}`, className: "text-emerald-600" };
  }
  if (net < 0) {
    return { text: `-${formatYen(-net)}`, className: "text-red-600" };
  }
  return { text: formatYen(0), className: "text-muted-foreground" };
}

/**
 * Feature: 查看結算
 * Rule: 每位團員的淨額 = 他付出的總金額 − 他被分攤的總金額（列出 付出／被分攤 讓計算過程可追）
 * Rule: 餘額清單列出旅程所有團員，含淨額為 0 者
 * Rule: 無任何開支或所有團員淨額為 0 時，結清清單為空
 * 對應規格：spec/features/查看結算.feature
 *
 * 帳本「結餘」區塊（對照 doc/design-refs/expense-split.jpg）：
 * 上方為個人結算摘要卡，下方為全員結餘清單與結清清單。
 * 截圖中「照片」Tab 與結餘標題右側被紅線劃掉的按鈕不實作；
 * 不做大頭照（spec.md），以姓名字首圓形代替。
 */
export function SettlementView({
  tripId,
  members,
  transfers,
}: {
  tripId: number;
  members: SettlementMember[];
  transfers: SettlementTransfer[];
}) {
  // 個人結算摘要：我的淨額為正 → 別人欠我；為負 → 我欠別人；為 0 → 已結清
  const incoming = transfers.filter((transfer) => transfer.toIsMe);
  const outgoing = transfers.filter((transfer) => transfer.fromIsMe);
  const incomingTotal = incoming.reduce((sum, t) => sum + t.amount, 0);
  const outgoingTotal = outgoing.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      <LedgerRealtimeRefresher tripId={tripId} />

      <div className="flex items-center gap-4 rounded-xl border bg-card px-5 py-4">
        {incoming.length > 0 ? (
          <>
            <span className="text-3xl" aria-hidden>
              🤑
            </span>
            <div>
              <p className="text-lg font-semibold">
                你被欠下 {formatYen(incomingTotal)}
              </p>
              <p className="text-sm text-muted-foreground">
                由 {incoming.map((t) => t.fromName).join("、")}
              </p>
            </div>
          </>
        ) : outgoing.length > 0 ? (
          <>
            <span className="text-3xl" aria-hidden>
              💸
            </span>
            <div>
              <p className="text-lg font-semibold">
                你欠下 {formatYen(outgoingTotal)}
              </p>
              <p className="text-sm text-muted-foreground">
                給 {outgoing.map((t) => t.toName).join("、")}
              </p>
            </div>
          </>
        ) : (
          <>
            <span className="text-3xl" aria-hidden>
              ✅
            </span>
            <div>
              <p className="text-lg font-semibold">你已結清</p>
              <p className="text-sm text-muted-foreground">
                目前沒有你需要處理的轉帳
              </p>
            </div>
          </>
        )}
      </div>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">結餘</h3>
        <ul className="space-y-2">
          {members.map((member) => {
            const net = netDisplay(member.net);
            return (
              <li
                key={member.id}
                className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3"
              >
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted font-semibold"
                  aria-hidden
                >
                  {member.name.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {memberLabel(member.name, member.isMe)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    付出 {formatYen(member.paid)} · 被分攤{" "}
                    {formatYen(member.share)}
                  </p>
                </div>
                <p
                  className={`text-lg font-semibold tracking-tight ${net.className}`}
                >
                  {net.text}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">結清清單</h3>
        {transfers.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <p className="font-medium">無需結算</p>
            <p className="mt-1 text-sm text-muted-foreground">
              大家都結清了，沒有待轉的帳
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {transfers.map((transfer, index) => (
              <li
                key={index}
                className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {memberLabel(transfer.fromName, transfer.fromIsMe)}{" "}
                    <span className="text-muted-foreground">轉給</span>{" "}
                    {memberLabel(transfer.toName, transfer.toIsMe)}
                  </p>
                </div>
                <p className="text-lg font-semibold tracking-tight">
                  {formatYen(transfer.amount)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
