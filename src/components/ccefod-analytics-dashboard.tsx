
'use client';

import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CcefodRecord } from '@/lib/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Info, PieChartIcon, BarChartIcon, Edit, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';

type CcefodAnalyticsDashboardProps = {
  records: CcefodRecord[];
};

const CHART_COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(var(--muted-foreground))',
];

const truncateText = (text: string, length: number) => {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
}

export function CcefodAnalyticsDashboard({ records }: CcefodAnalyticsDashboardProps) {
  const analyticsData = useMemo(() => {
    if (records.length === 0) {
      return null;
    }

    const totalRecords = records.length;
    
    const countBy = (key: keyof CcefodRecord) => records.reduce((acc, record) => {
      const value = record[key] as string | undefined;
      if (value) {
        acc[value] = (acc[value] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const implementationLevelData = Object.entries(countBy('implementationLevel')).map(([name, value]) => ({ name, value }));
    const statusData = Object.entries(countBy('status')).map(([name, value]) => ({ name, value }));
    const adaPerubahanData = Object.entries(countBy('adaPerubahan')).map(([name, value]) => ({ name, value }));
    const annexData = Object.entries(countBy('annex')).map(([name, value]) => ({ name: truncateText(name, 20), value, fullName: name }));
    const usulanPerubahanData = Object.entries(countBy('usulanPerubahan')).filter(([name]) => name).map(([name, value]) => ({ name, value }));

    return {
      totalRecords,
      implementationLevelData,
      statusData,
      adaPerubahanData,
      annexData,
      usulanPerubahanData
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
                <CardDescription>Overview of record statuses</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig(analyticsData.statusData)} className="mx-auto aspect-square h-[200px]">
                    <PieChart>
                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                        <Pie data={analyticsData.statusData} dataKey="value" nameKey="name" innerRadius={50} strokeWidth={2}>
                            {analyticsData.statusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={chartConfig(analyticsData.statusData)[entry.name].color} />
                            ))}
                        </Pie>
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
        
        <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle>Change Proposals</CardTitle>
                <CardDescription>Records with proposed changes</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig(analyticsData.adaPerubahanData)} className="mx-auto aspect-square h-[200px]">
                    <PieChart>
                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                        <Pie data={analyticsData.adaPerubahanData} dataKey="value" nameKey="name" innerRadius={50} strokeWidth={2}>
                            {analyticsData.adaPerubahanData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={chartConfig(analyticsData.adaPerubahanData)[entry.name].color} />
                            ))}
                        </Pie>
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>

        <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle>Change Proposal Types</CardTitle>
                <CardDescription>Breakdown of proposed changes</CardDescription>
            </CardHeader>
            <CardContent>
                {analyticsData.usulanPerubahanData.length > 0 ? (
                    <ScrollArea className="h-[200px]">
                        <div className="space-y-2 pr-4">
                            {analyticsData.usulanPerubahanData.sort((a,b) => b.value - a.value).map((item, index) => (
                                <div key={item.name} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                    <span className="text-sm font-medium">{item.name}</span>
                                    <span className="text-sm font-bold text-primary">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                ) : (
                    <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">No change proposals.</div>
                )}
            </CardContent>
        </Card>

        <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle>Distribution by Annex</CardTitle>
                <CardDescription>Shows the count of records for each Annex.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2 h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.annexData} layout="vertical" margin={{ left: 10, right: 30, top: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={150} interval={0} tick={{ fontSize: 12 }} />
                        <Tooltip
                            cursor={{ fill: 'hsl(var(--muted))' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                        <div className="p-2 bg-background border rounded-lg shadow-lg text-xs">
                                            <p className="font-bold">{data.fullName}</p>
                                            <p><span className="font-semibold">Count:</span> {data.value}</p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar dataKey="value" name="Record Count" radius={[0, 4, 4, 0]}>
                             {analyticsData.annexData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>

        <Card className="lg:col-span-3">
            <CardHeader>
            <CardTitle>Level of Implementation Distribution</CardTitle>
            <CardDescription>Shows the count for each implementation level.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2 h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.implementationLevelData} layout="vertical" margin={{ right: 30, top: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={300} interval={0} tick={{ fontSize: 12 }} />
                        <Tooltip
                            cursor={{ fill: 'hsl(var(--muted))' }}
                            content={<ChartTooltipContent indicator="dot" />}
                        />
                        <Bar dataKey="value" name="Record Count" radius={[0, 4, 4, 0]}>
                            {analyticsData.implementationLevelData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    </div>
  );
}

