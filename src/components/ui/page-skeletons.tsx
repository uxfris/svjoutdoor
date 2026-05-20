import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function PageHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2 mb-8", className)}>
      <Skeleton className="h-9 w-64 max-w-full" />
      <Skeleton className="h-5 w-96 max-w-full" />
    </div>
  );
}

export function StatsGridSkeleton({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8",
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-[var(--framer-color-border)] bg-[var(--framer-color-bg)] p-6 shadow-sm space-y-3"
        >
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-3/4" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--framer-color-border)] bg-[var(--framer-color-bg)] shadow">
      <div className="flex gap-4 border-b border-[var(--framer-color-border)] p-4">
        <Skeleton className="h-10 flex-1 max-w-md" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="divide-y divide-[var(--framer-color-border)]">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReportPageSkeleton() {
  return (
    <div className="p-6">
      <PageHeaderSkeleton />
      <StatsGridSkeleton />
      <TableSkeleton rows={6} />
    </div>
  );
}

export function TablePageSkeleton() {
  return (
    <div className="p-6">
      <PageHeaderSkeleton />
      <div className="mb-6 flex gap-4">
        <Skeleton className="h-10 flex-1 max-w-md" />
        <Skeleton className="h-10 w-28" />
      </div>
      <TableSkeleton />
    </div>
  );
}

export function FormPageSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="p-6">
      <Skeleton className="mb-4 h-5 w-40" />
      <PageHeaderSkeleton className="mb-6" />
      <div className="space-y-6 rounded-lg border border-[var(--framer-color-border)] bg-[var(--framer-color-bg)] p-6 shadow">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}

export function ProfilePageSkeleton() {
  return (
    <div className="p-6">
      <PageHeaderSkeleton />
      <div className="space-y-6">
        <div className="rounded-lg border border-[var(--framer-color-border)] bg-[var(--framer-color-bg)] p-6 shadow space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
        <div className="rounded-lg border border-[var(--framer-color-border)] bg-[var(--framer-color-bg)] p-6 shadow space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}

export function DashboardPageSkeleton() {
  return (
    <div className="bg-[#F7F9FB] p-8">
      <Skeleton className="mb-8 h-40 w-full rounded-2xl" />
      <StatsGridSkeleton />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <TableSkeleton rows={5} />
        <CardBlockSkeleton lines={5} />
      </div>
    </div>
  );
}

export function CardBlockSkeleton({ lines = 5 }: { lines?: number }) {
  return (
    <div className="space-y-4 rounded-xl border border-gray-100 bg-white p-6 shadow-lg">
      <Skeleton className="h-6 w-1/3" />
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}

export function MainContentLayoutSkeleton() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden lg:ml-0">
      <div className="flex items-center justify-between border-b border-[var(--framer-color-border)] px-6 py-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      <main className="flex-1 overflow-y-auto bg-[var(--framer-color-bg)]">
        <DashboardPageSkeleton />
      </main>
    </div>
  );
}

export function GlobalNavigationSkeleton() {
  return (
    <div className="absolute inset-0 z-50 overflow-hidden bg-[var(--framer-color-bg)] p-6">
      <PageHeaderSkeleton />
      <StatsGridSkeleton />
      <TableSkeleton rows={6} />
    </div>
  );
}

export function AuthPageSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6">
      <div className="w-full max-w-md space-y-6">
        <Skeleton className="mx-auto h-16 w-16 rounded-full" />
        <Skeleton className="mx-auto h-8 w-3/4" />
        <div className="space-y-4 rounded-2xl border border-white/20 bg-white/80 p-8 shadow-xl">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}

export function PosCompletePageSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <PageHeaderSkeleton />
      <div className="space-y-6 rounded-lg border border-[var(--framer-color-border)] bg-[var(--framer-color-bg)] p-8 shadow">
        <Skeleton className="mx-auto h-24 w-24 rounded-full" />
        <Skeleton className="mx-auto h-8 w-1/2" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
