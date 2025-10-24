
'use client';

import * as React from 'react';
import type { Kegiatan } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Info, BarChart } from 'lucide-react';
import { Bar, BarChart as BarChartComponent, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { format, parseISO } from 'date-fns';

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

    const chartData = Object.entries(kegiatanByLokasi)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalKegiatan: records.length,
      chartData,
    };
  }, [records]);

  if (!analyticsData) {
    return (
      <Card>
        <CardContent className="text-center py-10 text-muted-foreground">
          <Info className="mx-auto h-8 w-8 mb-2" />
          <p className="font-semibold">No Data to Analyze</p>
          <p className="text-sm">There are no activities in the selected week to display analytics for.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Analytics</CardTitle>
        <CardDescription>
          Overview of activities for the selected week.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Total Activities</h3>
          <p className="text-4xl font-bold">{analyticsData.totalKegiatan}</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold">Activities by Location</h3>
           <div className="h-[400px] w-full mt-4">
            <ResponsiveContainer>
              <BarChartComponent data={analyticsData.chartData} layout="vertical">
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChartComponent>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
