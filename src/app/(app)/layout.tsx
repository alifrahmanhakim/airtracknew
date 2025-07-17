
'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// This component acts as a wrapper to dynamically load the actual layout.
// This strategy is used to bypass a persistent caching issue with the original layout file.
const NewLayout = dynamic(() => import('./layout-new').then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex items-center space-x-2">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    </div>
  ),
});

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <NewLayout>{children}</NewLayout>;
}
