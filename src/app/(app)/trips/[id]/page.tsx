import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { DayTabsNav } from "@/components/trips/day-tabs-nav";
import { AddActivityDialog } from "@/components/trips/add-activity-dialog";
import { ActivityList } from "@/components/trips/activity-list";

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
    },
  });

  if (!trip) notFound();

  const dayTabs = trip.days.map((day) => ({
    id: day.id,
    dayLabel: `第 ${day.order} 天`,
    dateLabel: formatDate(day.date),
  }));

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
                {day.start_time && (
                  <p className="text-sm text-muted-foreground">
                    出發時間：{day.start_time}
                  </p>
                )}
              </div>
              <AddActivityDialog dayId={day.id} />
            </div>

            <ActivityList dayId={day.id} activities={day.activities} />
          </section>
        ))}
      </div>
    </div>
  );
}
