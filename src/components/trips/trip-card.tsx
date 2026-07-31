import Link from "next/link";
import { TripActionsMenu } from "@/components/trips/trip-actions-menu";

type Trip = {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
};

export function TripCard({
  trip,
  ownerName,
  isOwner,
}: {
  trip: Trip;
  ownerName?: string;
  isOwner: boolean;
}) {
  return (
    <li className="relative min-w-0 space-y-1 rounded-xl border p-4 transition hover:border-primary/50">
      <Link
        href={`/trips/${trip.id}`}
        className="absolute inset-0 z-0 rounded-xl"
      >
        <span className="sr-only">{trip.name}</span>
      </Link>

      <div className="pointer-events-none relative z-10 flex items-start justify-between gap-2">
        <span className="min-w-0 truncate font-medium">{trip.name}</span>
        <div className="pointer-events-auto">
          <TripActionsMenu trip={trip} isOwner={isOwner} />
        </div>
      </div>
      <p className="pointer-events-none relative z-10 text-sm text-muted-foreground">
        {trip.start_date} ~ {trip.end_date}
      </p>
      <p className="pointer-events-none relative z-10 text-xs text-muted-foreground">
        建立者：{ownerName}
      </p>
    </li>
  );
}
