import { Skeleton } from "@/components/ui/skeleton";

const BREAKDOWN_PLACEHOLDERS = [
  "breakdown-1",
  "breakdown-2",
  "breakdown-3",
  "breakdown-4",
];
const RECENT_PLACEHOLDERS = [
  "recent-1",
  "recent-2",
  "recent-3",
  "recent-4",
  "recent-5",
];

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-8 w-44" />
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <Skeleton className="h-9 w-44" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      <div className="space-y-3 rounded-xl border p-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border p-6">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>

        <div className="space-y-4 rounded-xl border p-6">
          <Skeleton className="h-5 w-32" />
          <div className="space-y-3">
            {BREAKDOWN_PLACEHOLDERS.map((key) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border p-6">
        <Skeleton className="h-5 w-28" />
        <div className="space-y-3">
          {RECENT_PLACEHOLDERS.map((key) => (
            <div key={key} className="flex items-center gap-3">
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
