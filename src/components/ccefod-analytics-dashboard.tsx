
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
import { Info, PieChartIcon, BarChartIcon, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export function CcefodAnalyticsDashboard({ records }: CcefodAnalyticsDashboardProps) {
  const analyticsData = useMemo(() => {
    if (records.length === 0) {
      return null;
    }

    const totalRecords = records.length;
    
    // Implementation Level Distribution
    const implementationLevels = records.reduce((acc, record) => {
      const level = record.implementationLevel;
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const implementationLevelData = Object.entries(implementationLevels).map(([name, value]) => ({ 
        name, 
        value,
        percentage: ((value / totalRecords) * 100).toFixed(1)
    }));
    
    // Status Distribution
    const statuses = records.reduce((acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusData = Object.entries(statuses).map(([name, value]) => ({ name, value }));

    // Perubahan (Change Proposals)
    const perubahan = records.filter(r => r.adaPerubahan === 'YA').length;

    return {
      totalRecords,
      implementationLevelData,
      statusData,
      perubahan,
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

  const chartConfigImplementation = {
      value: { label: 'Count' },
      ...analyticsData.implementationLevelData.reduce((acc, item, index) => {
          acc[item.name] = { label: item.name, color: CHART_COLORS[index % CHART_COLORS.length]};
          return acc;
      }, {} as any)
  };
  
  const chartConfigStatus = {
      value: { label: 'Count' },
      ...analyticsData.statusData.reduce((acc, item, index) => {
          acc[item.name] = { label: item.name, color: CHART_COLORS[index % CHART_COLORS.length]};
          return acc;
      }, {} as any)
  };


  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
       <Card className="lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Records</CardTitle>
          <BarChartIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analyticsData.totalRecords}</div>
          <p className="text-xs text-muted-foreground">Total records in current view</p>
        </CardContent>
      </Card>
      <Card className="lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Change Proposals</CardTitle>
          <Edit className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analyticsData.perubahan}</div>
          <p className="text-xs text-muted-foreground">
            {((analyticsData.perubahan / analyticsData.totalRecords) * 100).toFixed(1)}% of records have changes proposed
          </p>
        </CardContent>
      </Card>
      <Card className="lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Status Distribution</CardTitle>
          <PieChartIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
           <ChartContainer config={chartConfigStatus} className="mx-auto aspect-square h-[150px]">
             <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie data={analyticsData.statusData} dataKey="value" nameKey="name" innerRadius={40}>
                    {analyticsData.statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                </Pie>
             </PieChart>
           </ChartContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Level of Implementation Distribution</CardTitle>
          <CardDescription>Shows the count and percentage for each implementation level across all records in the current view.</CardDescription>
        </CardHeader>
        <CardContent className="pl-2 h-[400px]">
          <ChartContainer config={chartConfigImplementation} className="w-full h-full">
            <ResponsiveContainer>
              <BarChart data={analyticsData.implementationLevelData} layout="vertical" margin={{ left: 120, right: 40 }}>
                <CartesianGrid horizontal={false} />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={200} />
                <XAxis type="number" hide />
                <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent indicator="dot" />} />
                <Bar dataKey="value" radius={5}>
                    {analyticsData.implementationLevelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartConfigImplementation[entry.name]?.color || CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                </Bar>
                 {analyticsData.implementationLevelData.map((entry, index) => (
                    <text
                        key={`label-${index}`}
                        x={10} 
                        y={index * (400 / analyticsData.implementationLevelData.length) + (400 / analyticsData.implementationLevelData.length) / 2 + 5}
                        dy={-10}
                        fill="hsl(var(--foreground))"
                        textAnchor="start"
                        className="text-xs font-bold"
                    >
                        {`${entry.value} (${entry.percentage}%)`}
                    </text>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
