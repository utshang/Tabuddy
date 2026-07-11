import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { AuthMessageToast } from "@/components/auth/auth-message-toast";
import { CreateTripDialog } from "@/components/trips/create-trip-dialog";
import { TripActionsMenu } from "@/components/trips/trip-actions-menu";
import { JoinTripHandler } from "@/components/trips/join-trip-handler";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const trips = user
    ? await prisma.trip.findMany({
        where: { members: { some: { user_id: user.id } } },
        include: {
          members: {
            include: { user: true },
          },
        },
        orderBy: { id: "desc" },
      })
    : [];

  return (
    <div className="space-y-6">
      <Suspense>
        <AuthMessageToast />
        <JoinTripHandler />
      </Suspense>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">
            我的旅程
          </h1>
          <p className="mt-1">
            你好，{user?.user_metadata?.full_name ?? user?.email}
            ！一起來規劃下一趟旅程吧。
          </p>
        </div>
        <CreateTripDialog />
      </div>

      {trips.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="text-lg font-medium">還沒有任何旅程</p>
          <p className="mt-1 text-sm">點擊「新增旅程」開始規劃</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => {
            const owner = trip.members.find(
              (member) => member.role === "owner",
            );
            const isOwner = trip.members.some(
              (member) =>
                member.user_id === user?.id && member.role === "owner",
            );

            return (
              <li key={trip.id} className="rounded-xl border p-4 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/trips/${trip.id}`} className="font-medium hover:underline">
                    {trip.name}
                  </Link>
                  <TripActionsMenu trip={trip} isOwner={isOwner} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {trip.start_date} ~ {trip.end_date}
                </p>
                <p className="text-xs text-muted-foreground">
                  建立者：{owner?.user.name}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
