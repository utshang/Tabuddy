import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { DayTabsNav } from "@/components/trips/day-tabs-nav";
import { AddActivityDialog } from "@/components/trips/add-activity-dialog";
import { EditActivityDialog } from "@/components/trips/edit-activity-dialog";
import { DeleteActivityDialog } from "@/components/trips/delete-activity-dialog";
import { Card, CardContent } from "@/components/ui/card";

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
        include: { activities: { orderBy: { order: "asc" } } },
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

            {day.activities.length === 0 ? (
              <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                這天還沒有行程
              </div>
            ) : (
              <ul className="space-y-2">
                {day.activities.map((activity) => (
                  <li key={activity.id}>
                    <Card size="sm">
                      <CardContent className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          {activity.google_map_url ? (
                            <a
                              href={activity.google_map_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                            >
                              <MapPin className="size-3.5" />
                              {activity.name}
                            </a>
                          ) : (
                            <p className="font-medium">{activity.name}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            停留 {activity.duration_minutes} 分鐘
                          </p>
                          {activity.note && (
                            <p className="text-xs text-muted-foreground">
                              {activity.note}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <EditActivityDialog activity={activity} />
                          <DeleteActivityDialog activity={activity} />
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
