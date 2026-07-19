import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { DayTabsNav } from "@/components/trips/day-tabs-nav";
import { AddActivityDialog } from "@/components/trips/add-activity-dialog";
import { ActivityList } from "@/components/trips/activity-list";
import { DayStartTimeDialog } from "@/components/trips/day-start-time-dialog";
import { TripTabs } from "@/components/trips/trip-tabs";
import { ExpenseLedger } from "@/components/trips/expense-ledger";
import { LedgerTabs } from "@/components/trips/ledger-tabs";
import { SettlementView } from "@/components/trips/settlement-view";
import { computeBalancesCents, settleGreedyCents } from "@/lib/settlement";
import { fromCents, toCents } from "@/lib/expense-split";

function formatDate(date: string) {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

export default async function TripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tripId = Number(id);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || Number.isNaN(tripId)) notFound();

  // Rule: 不是自己建立或加入的旅程，無法查看
  // Feature: 查看結算 / Rule: 使用者必須是旅程成員（非成員操作失敗 → notFound）
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, members: { some: { user_id: user.id } } },
    include: {
      days: {
        orderBy: { order: "asc" },
        include: {
          activities: {
            orderBy: { order: "asc" },
            include: { transport: true },
          },
        },
      },
      // 團員依加入旅程的先後順序排列（開支均分尾差的分配順序依據）
      members: {
        include: { user: true },
        orderBy: [{ joined_at: "asc" }, { user_id: "asc" }],
      },
      expenses: {
        orderBy: [{ expense_date: "desc" }, { id: "desc" }],
        include: { payer: true, splits: true },
      },
    },
  });

  if (!trip) notFound();

  const dayTabs = trip.days.map((day) => ({
    id: day.id,
    dayLabel: `第 ${day.order} 天`,
    dateLabel: formatDate(day.date),
  }));

  const members = trip.members.map((member) => ({
    id: member.user_id,
    name: member.user.name,
    isMe: member.user_id === user.id,
  }));

  const expenses = trip.expenses.map((expense) => ({
    id: expense.id,
    name: expense.name,
    amount: Number(expense.amount),
    category: expense.category,
    category_icon: expense.category_icon,
    expense_date: expense.expense_date,
    payer_id: expense.payer_id,
    payerName: expense.payer.name,
    payerIsMe: expense.payer_id === user.id,
    myShare: Number(
      expense.splits.find((split) => split.user_id === user.id)?.amount ?? 0,
    ),
    split_type: expense.split_type as "even" | "custom",
    splits: Object.fromEntries(
      expense.splits.map((split) => [split.user_id, Number(split.amount)]),
    ),
  }));

  /**
   * Feature: 查看結算
   * 對應規格：spec/features/查看結算.feature
   * 結算為即時計算的衍生資料（不持久化）：以純函式從團員與開支算出餘額與結清清單。
   * trip.members 已依加入旅程的先後順序排序（淨額相同時的配對順序依據）。
   */
  const balances = computeBalancesCents(
    trip.members.map((member) => member.user_id),
    trip.expenses.map((expense) => ({
      payerId: expense.payer_id,
      amountCents: toCents(Number(expense.amount)),
      splits: expense.splits.map((split) => ({
        userId: split.user_id,
        amountCents: toCents(Number(split.amount)),
      })),
    })),
  );
  console.log(balances);
  const transfers = settleGreedyCents(balances);

  const memberById = new Map(members.map((member) => [member.id, member]));
  console.log(memberById);

  const settlementMembers = balances.map((balance) => {
    const member = memberById.get(balance.userId)!;
    return {
      id: balance.userId,
      name: member.name,
      isMe: member.isMe,
      paid: fromCents(balance.paidCents),
      share: fromCents(balance.shareCents),
      net: fromCents(balance.netCents),
    };
  });
  const settlementTransfers = transfers.map((transfer) => {
    const from = memberById.get(transfer.fromUserId)!;
    const to = memberById.get(transfer.toUserId)!;
    return {
      fromName: from.name,
      fromIsMe: from.isMe,
      toName: to.name,
      toIsMe: to.isMe,
      amount: fromCents(transfer.amountCents),
    };
  });

  const itinerary = (
    <div className="space-y-6">
      <DayTabsNav days={dayTabs} />

      <div className="space-y-8">
        {trip.days.map((day) => (
          <section
            key={day.id}
            id={`day-${day.id}`}
            className="scroll-mt-20 space-y-3"
          >
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">
                  第 {day.order} 天 · {formatDate(day.date)}
                </h2>
                <DayStartTimeDialog dayId={day.id} startTime={day.start_time} />
              </div>
              <AddActivityDialog dayId={day.id} />
            </div>

            <ActivityList
              dayId={day.id}
              dayDate={day.date}
              startTime={day.start_time}
              activities={day.activities}
            />
          </section>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← 我的旅程
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-primary tracking-tight">
          {trip.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {trip.start_date} ~ {trip.end_date}
        </p>
      </div>

      <TripTabs
        itinerary={itinerary}
        ledger={
          <LedgerTabs
            expenses={
              <ExpenseLedger
                tripId={trip.id}
                expenses={expenses}
                members={members}
              />
            }
            settlement={
              <SettlementView
                tripId={trip.id}
                members={settlementMembers}
                transfers={settlementTransfers}
              />
            }
          />
        }
      />
    </div>
  );
}
