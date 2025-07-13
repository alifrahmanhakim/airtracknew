
'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// This is a client-side wrapper component. Its only job is to dynamically
// import the main DashboardPage component with SSR (Server-Side Rendering) disabled.
// This is crucial to prevent client-side libraries like 'recharts' from causing
// build errors on the server, which was the source of the "Failed to load chunk" error.

const DashboardPage = dynamic(
  () => import('@/components/dashboard-page').then(mod => mod.DashboardPage),
  {
    ssr: false,
    loading: () => (
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
          <Skeleton className="h-80 lg:col-span-2" />
        </div>
        <div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </main>
    ),
  }
);

export default function DashboardWrapper() {
  return <DashboardPage />;
}
