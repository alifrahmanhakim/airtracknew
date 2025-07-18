
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

    const statusCounts = countBy('status');
    const totalStatus = Object.values(statusCounts).reduce((a, b) => a + b, 0);
    const statusData = Object.entries(statusCounts).map(([name, value]) => ({ 
        name: `${name} (${value}/${totalStatus} - ${((value / totalStatus) * 100).toFixed(1)}%)`,
        value,
        originalName: name,
    }));
    const finalStatusCount = statusCounts['Final'] || 0;
    const finalStatusPercentage = totalStatus > 0 ? (finalStatusCount / totalStatus) * 100 : 0;

    const icaoStatusCounts = countBy('icaoStatus');
    const totalIcaoStatus = Object.values(icaoStatusCounts).reduce((a, b) => a + b, 0);
    const icaoStatusData = Object.entries(icaoStatusCounts).map(([name, value]) => ({ 
        name: `${name} (${value}/${totalIcaoStatus} - ${((value / totalIcaoStatus) * 100).toFixed(1)}%)`,
        value,
        originalName: name,
     }));
    const satisfactoryIcaoStatusCount = icaoStatusCounts['Satisfactory'] || 0;
    const satisfactoryIcaoStatusPercentage = totalIcaoStatus > 0 ? (satisfactoryIcaoStatusCount / totalIcaoStatus) * 100 : 0;

    const criticalElementData = Object.entries(countBy('criticalElement')).map(([name, value]) => ({ name, value }));
    
    const totalCriticalElements = criticalElementData.reduce((acc, curr) => acc + curr.value, 0);
    const criticalElementPercentages = criticalElementData.map(item => ({
        ...item,
        percentage: totalCriticalElements > 0 ? (item.value / totalCriticalElements) * 100 : 0,
    })).sort((a, b) => b.value - a.value);

    const criticalElementDescription = (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-1 text-sm text-muted-foreground">
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
      finalStatusPercentage,
      criticalElementData,
      icaoStatusData,
      satisfactoryIcaoStatusPercentage,
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

  const chartConfig = (data: {originalName: string, value: number}[]) => ({
      value: { label: 'Count' },
      ...data.reduce((acc, item, index) => {
          acc[item.originalName] = { label: item.originalName, color: CHART_COLORS[index % CHART_COLORS.length]};
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
            <CardContent className="h-[250px] relative">
                <ChartContainer config={chartConfig(analyticsData.statusData)} className="mx-auto aspect-square h-full">
                    <PieChart>
                        <ChartTooltip cursor={{ fill: "hsl(var(--muted))" }} wrapperStyle={{ zIndex: 1000 }} content={<ChartTooltipContent nameKey="originalName" hideLabel />} />
                        <Pie data={analyticsData.statusData} dataKey="value" nameKey="originalName" innerRadius={60} strokeWidth={5}>
                            {analyticsData.statusData.map((entry) => (
                                <Cell key={`cell-${entry.name}`} fill={chartConfig(analyticsData.statusData)[entry.originalName].color} />
                            ))}
                        </Pie>
                         <ChartLegend content={<ChartLegendContent nameKey="name" />} className="[&>*]:justify-center flex-wrap" />
                    </PieChart>
                </ChartContainer>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[calc(50%+1.5rem)] text-center pointer-events-none">
                    <p className="text-2xl font-bold">{analyticsData.finalStatusPercentage.toFixed(0)}%</p>
                    <p className="text-sm text-muted-foreground">Final</p>
                </div>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>ICAO Status Implementation</CardTitle>
                <CardDescription>Breakdown of ICAO implementation statuses.</CardDescription>
            </CardHeader>
            <CardContent className="h-[250px] relative">
                <ChartContainer config={chartConfig(analyticsData.icaoStatusData)} className="mx-auto aspect-square h-full">
                    <PieChart>
                        <ChartTooltip cursor={{ fill: "hsl(var(--muted))" }} wrapperStyle={{ zIndex: 1000 }} content={<ChartTooltipContent nameKey="originalName" hideLabel />} />
                        <Pie data={analyticsData.icaoStatusData} dataKey="value" nameKey="originalName" innerRadius={60} strokeWidth={5}>
                            {analyticsData.icaoStatusData.map((entry) => (
                                <Cell key={`cell-${entry.name}`} fill={chartConfig(analyticsData.icaoStatusData)[entry.originalName].color} />
                            ))}
                        </Pie>
                         <ChartLegend content={<ChartLegendContent nameKey="name" />} className="[&>*]:justify-center flex-wrap" />
                    </PieChart>
                </ChartContainer>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[calc(50%+1.5rem)] text-center pointer-events-none">
                    <p className="text-2xl font-bold">{analyticsData.satisfactoryIcaoStatusPercentage.toFixed(0)}%</p>
                    <p className="text-sm text-muted-foreground">Satisfactory</p>
                </div>
            </CardContent>
        </Card>

        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Distribution by Critical Element</CardTitle>
                <CardDescription>Shows the count of records for each critical element.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {analyticsData.criticalElementDescription}
                <div className="pt-4 w-full">
                  <ChartContainer config={chartConfig(analyticsData.criticalElementData as any[])}>
                      <ResponsiveContainer width="100%" height={analyticsData.criticalElementData.length * 35 + 40}>
                          <BarChart data={analyticsData.criticalElementData} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                              <XAxis type="number" allowDecimals={false} />
                              <YAxis dataKey="name" type="category" interval={0} tick={{ fontSize: 12 }} width={60}/>
                              <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} wrapperStyle={{ zIndex: 1000 }} content={<ChartTooltipContent indicator="dot" />} />
                              <Bar dataKey="value" name="Record Count" radius={[0, 4, 4, 0]}>
                                  {analyticsData.criticalElementData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                  ))}
                              </Bar>
                          </BarChart>
                      </ResponsiveContainer>
                  </ChartContainer>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
