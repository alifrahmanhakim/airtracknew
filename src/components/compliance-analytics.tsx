
'use client';

import * as React from 'react';
import type { ComplianceDataRow } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Info } from 'lucide-react';

interface ComplianceAnalyticsProps {
  data: ComplianceDataRow[];
}

const CHART_COLORS = {
  // Evaluation Status
  Evaluated: 'hsl(var(--chart-1))',
  'Not Evaluated': 'hsl(var(--chart-2))',
  'Not Finish Yet': 'hsl(var(--chart-3))',
  // Subject Status
  Standard: 'hsl(var(--chart-1))',
  Recommendation: 'hsl(var(--chart-2))',
  'Not Applicable': 'hsl(var(--chart-4))',
  // Gap Status
  'Existing in CASR': 'hsl(var(--chart-1))',
  'Draft in CASR': 'hsl(var(--chart-2))',
  'Belum Diadop': 'hsl(var(--chart-3))',
  'Tidak Diadop': 'hsl(var(--chart-5))',
  'Management Decision': 'hsl(var(--chart-4))',
};

const PieChartCard = ({ title, data, dataKey, nameKey }: { title: string, data: any[], dataKey: string, nameKey: string }) => {
    
    const chartData = React.useMemo(() => {
        const counts = data.reduce((acc, item) => {
            const key = item[nameKey] as string;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [data, nameKey]);

    const chartConfig = {
      value: { label: 'Count' },
      ...chartData.reduce((acc, item) => {
          acc[item.name] = { 
            label: item.name, 
            color: CHART_COLORS[item.name as keyof typeof CHART_COLORS] || 'hsl(var(--muted))'
          };
          return acc;
      }, {} as any)
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[250px]">
                     <PieChart>
                        <ChartTooltip cursor={{ fill: "hsl(var(--muted))" }} wrapperStyle={{ zIndex: 1000 }} content={<ChartTooltipContent hideLabel />} />
                        <Pie data={chartData} dataKey={dataKey} nameKey={nameKey} innerRadius={60} strokeWidth={5}>
                            {chartData.map((entry) => (
                                <Cell key={`cell-${entry.name}`} fill={CHART_COLORS[entry.name as keyof typeof CHART_COLORS] || 'hsl(var(--muted))'} />
                            ))}
                        </Pie>
                         <ChartLegend content={<ChartLegendContent nameKey="name" />} className="[&>*]:justify-center" />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}

export function ComplianceAnalytics({ data }: ComplianceAnalyticsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground bg-muted/50 rounded-lg">
        <Info className="mx-auto h-8 w-8 mb-2" />
        <p className="font-semibold">No Compliance Data Available</p>
        <p className="text-sm">Add data via the editor to see analytics.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <PieChartCard title="Evaluation Status" data={data} dataKey="value" nameKey="evaluationStatus" />
        <PieChartCard title="Subject Status" data={data} dataKey="value" nameKey="subjectStatus" />
        <PieChartCard title="Gap Status" data={data} dataKey="value" nameKey="gapStatus" />
    </div>
  );
}
