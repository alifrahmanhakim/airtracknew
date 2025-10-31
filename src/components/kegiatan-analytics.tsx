
'use client';

import * as React from 'react';
import type { Kegiatan } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Info, BarChart, User } from 'lucide-react';
import { Bar, BarChart as BarChartComponent, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { format, parseISO } from 'date-fns';
import { AnimatedCounter } from './ui/animated-counter';

type KegiatanAnalyticsProps = {
  records: Kegiatan[];
};

export function KegiatanAnalytics({ records }: KegiatanAnalyticsProps) {
  const analyticsData = React.useMemo(() => {
    if (records.length === 0) {
      return null;
    }

    const kegiatanByLokasi = records.reduce((acc, record) => {
      const lokasi = record.lokasi || 'Unknown';
      acc[lokasi] = (acc[lokasi] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const locationData = Object.entries(kegiatanByLokasi)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
      
    const kegiatanByPersonel = records.reduce((acc, record) => {
        record.nama.forEach(person => {
            acc[person] = (acc[person] || 0) + 1;
        });
        return acc;
    }, {} as Record<string, number>);

    const personelData = Object.entries(kegiatanByPersonel)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);


    return {
      totalKegiatan: records.length,
      locationData,
      personelData,
    };
  }, [records]);

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
            <div>
                <h3 className="text-lg font-semibold">Total Activities</h3>
                <p className="text-4xl font-bold"><AnimatedCounter endValue={analyticsData.totalKegiatan} /></p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <BarChart className="h-5 w-5" />
                        Activities by Location
                    </h3>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer>
                        <BarChartComponent data={analyticsData.locationData} layout="vertical" margin={{ left: 50 }}>
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={150} interval={0} tick={{ fontSize: 12 }} />
                            <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} />
                            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                        </BarChartComponent>
                        </ResponsiveContainer>
                    </div>
                </div>
                 <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <User className="h-5 w-5" />
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
            </div>
        </CardContent>
    </Card>
  );
}
