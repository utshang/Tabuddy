import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function Loading() {
  return (
    <div>
      <div className="sticky top-0 z-20 space-y-4 bg-background/95 pb-2 backdrop-blur">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="grid w-full grid-cols-2 gap-1">
          <Skeleton className="h-9" />
          <Skeleton className="h-9" />
        </div>
      </div>

      <div className="flex gap-1 py-2">
        <Skeleton className="h-16 w-16 shrink-0" />
        <Skeleton className="h-16 w-16 shrink-0" />
        <Skeleton className="h-16 w-16 shrink-0" />
      </div>

      <ul className="space-y-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <li key={index} className="flex gap-3">
            <Skeleton className="h-4 w-11 shrink-0" />
            <div className="flex w-5 shrink-0 justify-center">
              <Skeleton className="size-5 shrink-0 rounded-full" />
            </div>
            <Card size="sm" className="min-w-0 flex-1">
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}
