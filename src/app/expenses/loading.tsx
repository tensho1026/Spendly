import { Skeleton } from "@/components/ui/skeleton";

const GROUP_PLACEHOLDERS = ["group-1", "group-2"];
const ROW_PLACEHOLDERS = ["row-1", "row-2", "row-3", "row-4"];

export default function ExpensesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-44" />
        </div>
        <Skeleton className="h-9 w-full sm:w-32" />
      </div>

      <Skeleton className="h-14 w-full rounded-lg" />

      <div className="space-y-4">
        {GROUP_PLACEHOLDERS.map((groupKey) => (
          <div key={groupKey} className="overflow-hidden rounded-lg border">
            <div className="flex items-center justify-between border-b px-4 py-2.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="divide-y">
              {ROW_PLACEHOLDERS.map((rowKey) => (
                <div
                  key={`${groupKey}-${rowKey}`}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <Skeleton className="h-4 w-10" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
