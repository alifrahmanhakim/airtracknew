
'use client';

import { useMemo } from 'react';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { GapAnalysisRecord } from '@/lib/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Info } from 'lucide-react';

type GapAnalysisAnalyticsDashboardProps = {
  records: GapAnalysisRecord[];
};

const CHART_COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(var(--muted))',
];

export function GapAnalysisAnalyticsDashboard({ records }: GapAnalysisAnalyticsDashboardProps) {
  const analyticsData = useMemo(() => {
    if (records.length === 0) {
      return null;
    }

    const allEvaluations = records.flatMap(r => r.evaluations || []);
    const complianceStatusCounts = allEvaluations.reduce((acc, evaluation) => {
        acc[evaluation.complianceStatus] = (acc[evaluation.complianceStatus] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const complianceStatusData = Object.entries(complianceStatusCounts).map(([name, value]) => ({ name, value }));
    
    const statusItemCounts = records.reduce((acc, record) => {
        acc[record.statusItem] = (acc[record.statusItem] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    const statusItemData = Object.entries(statusItemCounts).map(([name, value]) => ({ name, value }));


    return {
      complianceStatusData,
      statusItemData,
    };
  }, [records]);

  if (!analyticsData) {
    return (
      <div className="text-center py-10 text-muted-foreground bg-muted/50 rounded-lg">
        <Info className="mx-auto h-8 w-8 mb-2" />
        <p className="font-semibold">No data to analyze.</p>
        <p className="text-sm">Submit records to see analytics.</p>
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
                <CardTitle>Follow Up Status</CardTitle>
                <CardDescription>Distribution of OPEN vs CLOSED items.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig(analyticsData.statusItemData)} className="mx-auto aspect-square h-[250px]">
                    <PieChart>
                        <ChartTooltip cursor={{ fill: "hsl(var(--muted))" }} wrapperStyle={{ zIndex: 1000 }} content={<ChartTooltipContent hideLabel />} />
                        <Pie data={analyticsData.statusItemData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
                            {analyticsData.statusItemData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={chartConfig(analyticsData.statusItemData)[entry.name].color} />
                            ))}
                        </Pie>
                        <ChartLegend content={<ChartLegendContent nameKey="name" />} className="[&>*]:justify-center" />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
        
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>DGCA Compliance/Differences Status</CardTitle>
                <CardDescription>Breakdown of all compliance statuses from evaluations.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig(analyticsData.complianceStatusData)} className="h-[300px] w-full">
                    <ResponsiveContainer>
                        <BarChart data={analyticsData.complianceStatusData} layout="horizontal" margin={{ left: 20, right: 30, top: 20, bottom: 20 }}>
                            <ChartTooltip cursor={{ fill: "hsl(var(--muted))" }} wrapperStyle={{ zIndex: 1000 }} content={<ChartTooltipContent indicator="dot" />} />
                            <Bar dataKey="value" name="Record Count" radius={[4, 4, 0, 0]}>
                                {analyticsData.complianceStatusData.map((entry, index) => (
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
