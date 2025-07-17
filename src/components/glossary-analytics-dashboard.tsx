
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { GlossaryRecord } from '@/lib/types';
import { Info } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from './ui/chart';

type GlossaryAnalyticsDashboardProps = {
  records: GlossaryRecord[];
};

export function GlossaryAnalyticsDashboard({ records }: GlossaryAnalyticsDashboardProps) {
  const analyticsData = useMemo(() => {
    if (records.length === 0) {
      return null;
    }

    const tagCounts = records.reduce((acc, record) => {
        const tags = record.tags?.split(',').map(t => t.trim()).filter(Boolean) || [];
        tags.forEach(tag => {
            acc[tag] = (acc[tag] || 0) + 1;
        });
        return acc;
    }, {} as Record<string, number>);

    const tagData = Object.entries(tagCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a,b) => b.value - a.value)
        .slice(0, 10); // Top 10 tags

    return {
      totalRecords: records.length,
      tagData
    };
  }, [records]);

  if (!analyticsData) {
    return (
      <div className="text-center py-10 text-muted-foreground bg-muted/50 rounded-lg">
        <Info className="mx-auto h-8 w-8 mb-2" />
        <p className="font-semibold">No data to analyze.</p>
        <p className="text-sm">Add terms with tags to see analytics.</p>
      </div>
    );
  }

  const chartConfig = {
      value: { label: 'Count', color: "hsl(var(--chart-1))" },
  };

  return (
    <div className="grid grid-cols-1 gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Top 10 Tags</CardTitle>
                <CardDescription>Frequency of the most used tags in the glossary.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <ChartContainer config={chartConfig} className="h-[400px] w-full">
                    <ResponsiveContainer>
                        <BarChart data={analyticsData.tagData} layout="vertical" margin={{ left: 50 }}>
                            <YAxis dataKey="name" type="category" tick={{fontSize: 12}} interval={0} />
                            <XAxis type="number" hide />
                            <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent indicator="dot" />} />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="var(--color-value)" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    </div>
  );
}
