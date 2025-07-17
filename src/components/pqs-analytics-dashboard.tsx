
'use client';

import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { PqRecord } from '@/lib/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Info } from 'lucide-react';

type PqsAnalyticsDashboardProps = {
  records: PqRecord[];
};

const CHART_COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(var(--muted))',
];

export function PqsAnalyticsDashboard({ records }: PqsAnalyticsDashboardProps) {
  const analyticsData = useMemo(() => {
    if (records.length === 0) {
      return null;
    }

    const countBy = (key: keyof PqRecord) => records.reduce((acc, record) => {
      const value = record[key] as string | undefined;
      if (value) {
        acc[value] = (acc[value] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const statusData = Object.entries(countBy('status')).map(([name, value]) => ({ name, value }));
    const criticalElementData = Object.entries(countBy('criticalElement')).map(([name, value]) => ({ name, value }));
    const icaoStatusData = Object.entries(countBy('icaoStatus')).map(([name, value]) => ({ name, value }));
    
    const totalCriticalElements = criticalElementData.reduce((acc, curr) => acc + curr.value, 0);
    const criticalElementPercentages = criticalElementData.map(item => ({
        ...item,
        percentage: totalCriticalElements > 0 ? (item.value / totalCriticalElements) * 100 : 0,
    })).sort((a, b) => b.value - a.value);

    const criticalElementDescription = (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-1 text-sm text-muted-foreground pt-2">
          {criticalElementPercentages.map(item => (
            <div key={item.name} className="flex items-baseline gap-2">
                <span>{item.name}</span>
                <div className="flex-grow border-b border-dashed border-muted-foreground/30"></div>
                <span className="font-bold whitespace-nowrap pl-2">{item.value} ({item.percentage.toFixed(1)}%)</span>
            </div>
          ))}
        </div>
    );
    
    return {
      statusData,
      criticalElementData,
      icaoStatusData,
      criticalElementDescription,
    };
  }, [records]);

  if (!analyticsData) {
    return (
      <div className="text-center py-10 text-muted-foreground bg-muted/50 rounded-lg">
        <Info className="mx-auto h-8 w-8 mb-2" />
        <p className="font-semibold">No data to analyze.</p>
        <p className="text-sm">Submit records or adjust filters to see analytics.</p>
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
                <CardDescription>Overview of all record statuses.</CardDescription>
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
        
        <Card>
            <CardHeader>
                <CardTitle>ICAO Status Implementation</CardTitle>
                <CardDescription>Breakdown of ICAO implementation statuses.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig(analyticsData.icaoStatusData)} className="mx-auto aspect-square h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <ChartTooltip cursor={{ fill: "hsl(var(--muted))" }} wrapperStyle={{ zIndex: 1000 }} content={<ChartTooltipContent hideLabel />} />
                            <Pie data={analyticsData.icaoStatusData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
                                {analyticsData.icaoStatusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={chartConfig(analyticsData.icaoStatusData)[entry.name].color} />
                                ))}
                            </Pie>
                            <ChartLegend content={<ChartLegendContent nameKey="name" />} className="[&>*]:justify-center" />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>

        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Distribution by Critical Element</CardTitle>
                <CardDescription>Shows the count of records for each critical element.</CardDescription>
                {analyticsData.criticalElementDescription}
            </CardHeader>
            <CardContent className="pl-2">
                <ChartContainer config={chartConfig(analyticsData.criticalElementData)} className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData.criticalElementData} layout="horizontal" margin={{ left: 20, right: 30, top: 20, bottom: 20 }}>
                            <XAxis dataKey="name" type="category" interval={0} tick={{ fontSize: 12 }} />
                            <YAxis type="number" allowDecimals={false} />
                            <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} wrapperStyle={{ zIndex: 1000 }} content={<ChartTooltipContent indicator="dot" />} />
                            <Bar dataKey="value" name="Record Count" radius={[4, 4, 0, 0]}>
                                {analyticsData.criticalElementData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    </div>
  );
}
