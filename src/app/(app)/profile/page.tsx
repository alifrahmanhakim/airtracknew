
import * as React from 'react';
import { Suspense } from 'react';
import { AppLayout } from '@/components/app-layout-component';
import { ProfilePageClient } from '@/components/profile-page-client';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';

function ProfilePageLoader() {
  return (
    <div className="p-4 md:p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-72" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
        <CardFooter className="flex justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-24" />
        </CardFooter>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AppLayout>
      <Suspense fallback={<ProfilePageLoader />}>
        <ProfilePageClient />
      </Suspense>
    </AppLayout>
  );
}
