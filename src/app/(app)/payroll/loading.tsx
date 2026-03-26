import { Skeleton } from "@/components/ui/skeleton";

export default function PayrollLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Skeleton className="h-8 w-full rounded-lg" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-12 w-56" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
