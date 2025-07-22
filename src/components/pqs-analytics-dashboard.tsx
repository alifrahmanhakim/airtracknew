

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

type PqsAnalyticsDashboardProps = {
  allRecords: PqRecord[];
  filteredRecords: PqRecord[];
   filters: {
    statusFilter: string;
    icaoStatusFilter: string;
    criticalElementFilter: string;
  };
  setFilters: {
    setStatusFilter: (value: string) => void;
    setIcaoStatusFilter: (value: string) => void;
    setCriticalElementFilter: (value: string) => void;
  };
};

const CHART_COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(var(--muted))',
];

const criticalElementOptions = ["all", "CE - 1", "CE - 2", "CE - 3", "CE - 4", "CE - 5", "CE - 6", "CE - 7", "CE - 8"];
const icaoStatusOptions = ["all", "Satisfactory", "No Satisfactory"];
const statusOptions = ["all", "Existing", "Draft", "Final"];


export function PqsAnalyticsDashboard({ allRecords, filteredRecords, filters, setFilters }: PqsAnalyticsDashboardProps) {
  const analyticsData = useMemo(() => {
    if (filteredRecords.length === 0) {
      return null;
    }

    const countBy = (key: keyof PqRecord) => filteredRecords.reduce((acc, record) => {
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
  }, [filteredRecords]);

  const chartConfig = (data: {originalName: string, value: number}[]) => ({
      value: { label: 'Count' },
      ...data.reduce((acc, item, index) => {
          acc[item.originalName] = { label: item.originalName, color: CHART_COLORS[index % CHART_COLORS.length]};
          return acc;
      }, {} as any)
  });

  if (allRecords.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground bg-muted/50 rounded-lg">
        <Info className="mx-auto h-8 w-8 mb-2" />
        <p className="font-semibold">No data to analyze.</p>
        <p className="text-sm">Submit records to see analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <CardTitle>PQs Analytics Dashboard</CardTitle>
                    <CardDescription>
                        Visualizations of the Protocol Questions data. Use the filters below to refine the results.
                    </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                        <Select value={filters.statusFilter} onValueChange={setFilters.setStatusFilter}>
                            <SelectTrigger><SelectValue placeholder="Filter by status..." /></SelectTrigger>
                            <SelectContent>
                                {statusOptions.map(option => <SelectItem key={option} value={option}>{option === 'all' ? 'All Statuses' : option}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={filters.icaoStatusFilter} onValueChange={setFilters.setIcaoStatusFilter}>
                            <SelectTrigger><SelectValue placeholder="Filter by ICAO Status..." /></SelectTrigger>
                            <SelectContent>
                                {icaoStatusOptions.map(option => <SelectItem key={option} value={option}>{option === 'all' ? 'All ICAO Statuses' : option}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={filters.criticalElementFilter} onValueChange={setFilters.setCriticalElementFilter}>
                            <SelectTrigger><SelectValue placeholder="Filter by CE..." /></SelectTrigger>
                            <SelectContent>
                                {criticalElementOptions.map(option => <SelectItem key={option} value={option}>{option === 'all' ? 'All Critical Elements' : option}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
        </Card>
        {!analyticsData ? (
             <div className="text-center py-10 text-muted-foreground bg-muted/50 rounded-lg">
                <Info className="mx-auto h-8 w-8 mb-2" />
                <p className="font-semibold">No data for the current filters</p>
                <p className="text-sm">Adjust or clear filters to see analytics.</p>
            </div>
        ) : (
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
        )}
    </div>
  );
}
