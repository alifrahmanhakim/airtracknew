
'use client';

import * as React from 'react';
import type { Kegiatan, Task, User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Info, BarChart, User as UserIcon } from 'lucide-react';
import { Bar, BarChart as BarChartComponent, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { AnimatedCounter } from './ui/animated-counter';

type KegiatanAnalyticsProps = {
  tasks: Kegiatan[];
  users: User[];
};

export function KegiatanAnalytics({ tasks, users }: KegiatanAnalyticsProps) {
  const analyticsData = React.useMemo(() => {
    if (tasks.length === 0) {
      return null;
    }
      
    const kegiatanByPersonel = tasks.reduce((acc, task) => {
        (task.nama || []).forEach(personName => {
            acc[personName] = (acc[personName] || 0) + 1;
        });
        return acc;
    }, {} as Record<string, number>);

    const personelData = Object.entries(kegiatanByPersonel)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    const kegiatanByLokasi = tasks.reduce((acc, task) => {
        acc[task.lokasi] = (acc[task.lokasi] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const lokasiData = Object.entries(kegiatanByLokasi)
        .map(([name, count]) => ({ name, count }))
        .sort((a,b) => b.count - a.count);


    return {
      totalKegiatan: tasks.length,
      personelData,
      lokasiData
    };
  }, [tasks, users]);

  if (!analyticsData) {
    return (
      <Card>
        <CardContent className="text-center py-10 text-muted-foreground">
          <Info className="mx-auto h-8 w-8 mb-2" />
          <p className="font-semibold">No Data to Analyze</p>
          <p className="text-sm">There are no activities in the selected time range to display analytics for.</p>
        </CardContent>
      </Card>
    );
  }

  return (
      <Card>
        <CardHeader>
            <CardTitle>Activity Analytics</CardTitle>
            <CardDescription>
            Overview of activities for the selected time range.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                <div>
                    <h3 className="text-lg font-semibold">Total Activities</h3>
                    <p className="text-4xl font-bold"><AnimatedCounter endValue={analyticsData.totalKegiatan} /></p>
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <BarChart className="h-5 w-5" />
                        Activities by Location
                    </h3>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer>
                        <BarChartComponent data={analyticsData.lokasiData} layout="vertical" margin={{ left: 50 }}>
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={150} interval={0} tick={{ fontSize: 12 }} />
                            <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} />
                            <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                        </BarChartComponent>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
            <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <UserIcon className="h-5 w-5" />
                    Activities by Personnel
                </h3>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer>
                    <BarChartComponent data={analyticsData.personelData} layout="vertical" margin={{ left: 50 }}>
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={150} interval={0} tick={{ fontSize: 12 }} />
                        <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} />
                        <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                    </BarChartComponent>
                    </ResponsiveContainer>
                </div>
            </div>
        </CardContent>
    </Card>
  );
}
