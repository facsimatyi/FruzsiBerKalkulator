import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Month selector */}
      <div className="space-y-3">
        <div className="flex gap-1 justify-center">
          <Skeleton className="h-7 w-12 rounded-full" />
          <Skeleton className="h-7 w-12 rounded-full" />
          <Skeleton className="h-7 w-12 rounded-full" />
        </div>
        <Skeleton className="h-8 w-full rounded-lg" />
      </div>
      {/* Hero */}
      <div className="flex flex-col items-center gap-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-12 w-56" />
        <Skeleton className="h-3 w-64" />
      </div>
      {/* Progress */}
      <Skeleton className="h-6 w-full rounded-lg" />
      {/* Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
    </div>
  );
}
