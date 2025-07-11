
import { Skeleton } from '@/components/ui/skeleton';

export function ProjectDetailsPageLoader() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
            <div>
                <Skeleton className="h-9 w-96 mb-2" />
                <Skeleton className="h-5 w-full max-w-lg" />
            </div>
            <Skeleton className="h-10 w-32" />
        </div>
         <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
            <div className="lg:col-span-1 space-y-6">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        </div>
    </main>
  );
}
