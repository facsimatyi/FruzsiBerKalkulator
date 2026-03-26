import { Skeleton } from "@/components/ui/skeleton";

export default function PotlekokLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-full rounded-lg" />
      <div className="flex flex-col items-center gap-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-48" />
      </div>
      <Skeleton className="h-44 rounded-xl" />
      <Skeleton className="h-44 rounded-xl" />
    </div>
  );
}
