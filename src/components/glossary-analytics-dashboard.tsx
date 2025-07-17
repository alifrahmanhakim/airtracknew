

'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { GlossaryRecord } from '@/lib/types';
import { Info, PieChartIcon } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { ChartContainer, ChartTooltipContent, ChartLegend, ChartLegendContent } from './ui/chart';

type GlossaryAnalyticsDashboardProps = {
  records: GlossaryRecord[];
};

const CHART_COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
];

export function GlossaryAnalyticsDashboard({ records }: GlossaryAnalyticsDashboardProps) {
  const analyticsData = useMemo(() => {
    if (records.length === 0) {
      return null;
    }

    const statusCounts = records.reduce((acc, record) => {
        acc[record.status] = (acc[record.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const statusData = Object.entries(statusCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a,b) => b.value - a.value);

    return {
      totalRecords: records.length,
      statusData
    };
  }, [records]);

  if (!analyticsData) {
    return (
      <div className="text-center py-10 text-muted-foreground bg-muted/50 rounded-lg">
        <Info className="mx-auto h-8 w-8 mb-2" />
        <p className="font-semibold">No data to analyze.</p>
        <p className="text-sm">Add records to see analytics.</p>
      </div>
    );
  }

  const chartConfig = (data: {name: string, value: number}[]) => ({
      value: { label: 'Count' },
      ...data.reduce((acc, item, index) => {
          acc[item.name] = { label: item.name, color: CHART_COLORS[index % CHART_COLORS.length]};
          return acc;
      }, {} as any)
  });

  return (
    <div className="grid grid-cols-1 gap-6">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><PieChartIcon /> Status Distribution</CardTitle>
                <CardDescription>Breakdown of all records by their status.</CardDescription>
            </CardHeader>
            <CardContent>
                 <ChartContainer config={chartConfig(analyticsData.statusData)} className="mx-auto aspect-square h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <ChartTooltip cursor={{ fill: "hsl(var(--muted))" }} wrapperStyle={{ zIndex: 1000 }} content={<ChartTooltipContent hideLabel />} />
                            <Pie data={analyticsData.statusData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
                                {analyticsData.statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={chartConfig(analyticsData.statusData)[entry.name].color} />
                                ))}
                            </Pie>
                            <ChartLegend content={<ChartLegendContent nameKey="name" />} className="[&>*]:justify-center" />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    </div>
  );
}
