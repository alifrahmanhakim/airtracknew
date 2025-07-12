
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
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CcefodRecord } from '@/lib/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Info } from 'lucide-react';
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
    'hsl(var(--muted))',
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
    const annexData = Object.entries(countBy('annex')).map(([name, value]) => ({ name: truncateText(name, 25), value, fullName: name })).sort((a,b) => b.value - a.value);
    const usulanPerubahanData = Object.entries(countBy('usulanPerubahan')).filter(([name]) => name && name !== 'N/A').map(([name, value]) => ({ name, value }));
    
    const statusTotal = statusData.reduce((acc, curr) => acc + curr.value, 0);

    return {
      totalRecords,
      implementationLevelData,
      statusData,
      statusTotal,
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
                <CardDescription>Overview of all record statuses in the database.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig(analyticsData.statusData)} className="mx-auto aspect-square h-[250px]">
                    <PieChart>
                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                        <Pie 
                            data={analyticsData.statusData} 
                            dataKey="value" 
                            nameKey="name" 
                            innerRadius={60} 
                            strokeWidth={5}
                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                const RADIAN = Math.PI / 180;
                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                return (
                                  <text x={x} y={y} fill="hsl(var(--card-foreground))" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
                                    {`${(percent * 100).toFixed(0)}%`}
                                  </text>
                                );
                            }}
                            labelLine={false}
                        >
                            {analyticsData.statusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={chartConfig(analyticsData.statusData)[entry.name].color} />
                            ))}
                        </Pie>
                         <ChartLegend content={<ChartLegendContent nameKey="name" />} className="[&>*]:justify-center" />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Proposed Changes</CardTitle>
                <CardDescription>Breakdown of records with or without proposed changes.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig(analyticsData.adaPerubahanData)} className="mx-auto aspect-square h-[250px]">
                    <PieChart>
                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                        <Pie 
                            data={analyticsData.adaPerubahanData} 
                            dataKey="value" 
                            nameKey="name" 
                            innerRadius={60} 
                            strokeWidth={5}
                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                const RADIAN = Math.PI / 180;
                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                return (
                                  <text x={x} y={y} fill="hsl(var(--card-foreground))" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
                                    {`${(percent * 100).toFixed(0)}%`}
                                  </text>
                                );
                            }}
                            labelLine={false}
                        >
                            {analyticsData.adaPerubahanData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={chartConfig(analyticsData.adaPerubahanData)[entry.name].color} />
                            ))}
                        </Pie>
                        <ChartLegend content={<ChartLegendContent nameKey="name" />} className="[&>*]:justify-center" />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>

        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Distribution by Annex</CardTitle>
                <CardDescription>Shows the count of records for each Annex, sorted by volume.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2 h-[400px]">
                <ChartContainer config={chartConfig(analyticsData.annexData)} className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData.annexData} layout="vertical" margin={{ left: 10, right: 30, top: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={180} interval={0} tick={{ fontSize: 12 }} />
                             <ChartTooltip
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
                </ChartContainer>
            </CardContent>
        </Card>

        <Card className="lg:col-span-2">
            <CardHeader>
            <CardTitle>Level of Implementation Distribution</CardTitle>
            <CardDescription>Shows the count for each unique implementation level across all records.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2 h-[400px]">
                <ChartContainer config={chartConfig(analyticsData.implementationLevelData)} className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData.implementationLevelData} layout="horizontal" margin={{ right: 30, top: 20, bottom: 120 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                             <XAxis 
                                dataKey="name" 
                                type="category" 
                                angle={-45} 
                                textAnchor="end" 
                                height={100} 
                                tick={{ fontSize: 12 }} 
                            />
                            <YAxis type="number" allowDecimals={false} />
                            <ChartTooltip
                                cursor={{ fill: 'hsl(var(--muted))' }}
                                content={<ChartTooltipContent indicator="dot" />}
                            />
                            <Bar dataKey="value" name="Record Count" radius={[4, 4, 0, 0]}>
                                {analyticsData.implementationLevelData.map((entry, index) => (
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
