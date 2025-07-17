
'use client';

import { useMemo, useState } from 'react';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { GapAnalysisRecord } from '@/lib/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { GitCompareArrows, Info, FolderOpen } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';

type GapAnalysisAnalyticsDashboardProps = {
  allRecords: GapAnalysisRecord[];
  filteredRecords: GapAnalysisRecord[];
  filters: {
    statusFilter: string;
    annexFilter: string;
    casrFilter: string;
    textFilter: string;
  };
  setFilters: {
    setStatusFilter: (value: string) => void;
    setAnnexFilter: (value: string) => void;
    setCasrFilter: (value: string) => void;
    setTextFilter: (value: string) => void;
  };
  filterOptions: {
    annexOptions: string[];
    casrOptions: string[];
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

export function GapAnalysisAnalyticsDashboard({ 
    allRecords, 
    filteredRecords, 
    filters,
    setFilters,
    filterOptions
}: GapAnalysisAnalyticsDashboardProps) {

  const analyticsData = useMemo(() => {
    if (filteredRecords.length === 0) {
      return null;
    }

    const countBy = (key: keyof GapAnalysisRecord) => filteredRecords.reduce((acc, record) => {
        const value = record[key] as string | undefined;
        if (value) {
            acc[value] = (acc[value] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    const allEvaluations = filteredRecords.flatMap(r => r.evaluations || []);
    const complianceStatusCounts = allEvaluations.reduce((acc, evaluation) => {
        acc[evaluation.complianceStatus] = (acc[evaluation.complianceStatus] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const complianceStatusData = Object.entries(complianceStatusCounts).map(([name, value]) => ({ name, value }));
    
    const statusItemCounts = filteredRecords.reduce((acc, record) => {
        acc[record.statusItem] = (acc[record.statusItem] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    const statusItemData = Object.entries(statusItemCounts).map(([name, value]) => ({ name, value }));
    
    const allCasrInFilter = filteredRecords.flatMap(r => r.evaluations.map(e => e.casrAffected));
    const casrData = Object.entries(allCasrInFilter.reduce((acc, casr) => {
        acc[casr] = (acc[casr] || 0) + 1;
        return acc;
    }, {} as Record<string, number>)).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

    const annexCounts = filteredRecords.reduce((acc, record) => {
        acc[record.annex] = (acc[record.annex] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const annexData = Object.entries(annexCounts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

    const totalRecords = filteredRecords.length;
    const openItems = statusItemCounts['OPEN'] || 0;
    const closedItems = statusItemCounts['CLOSED'] || 0;
    const openPercentage = totalRecords > 0 ? (openItems / totalRecords) * 100 : 0;
    const closedPercentage = totalRecords > 0 ? (closedItems / totalRecords) * 100 : 0;


    return {
      totalRecords,
      openItems,
      openPercentage,
      closedPercentage,
      complianceStatusData,
      statusItemData,
      casrData,
      annexData,
    };
  }, [filteredRecords]);

  if (allRecords.length === 0) {
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
    <div className="space-y-6">
        <Card>
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <CardTitle>GAP Analysis Analytics Dashboard</CardTitle>
                    <CardDescription>
                        Visualizations of the GAP Analysis data. Use the filters below to refine the results.
                    </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                        <Select value={filters.statusFilter} onValueChange={setFilters.setStatusFilter}>
                            <SelectTrigger><SelectValue placeholder="Filter by status..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="OPEN">OPEN</SelectItem>
                                <SelectItem value="CLOSED">CLOSED</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filters.annexFilter} onValueChange={setFilters.setAnnexFilter}>
                            <SelectTrigger><SelectValue placeholder="Filter by annex..." /></SelectTrigger>
                            <SelectContent>
                                {filterOptions.annexOptions.map(option => (
                                    <SelectItem key={option} value={option}>
                                        {option === 'all' ? 'All Annexes' : option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={filters.casrFilter} onValueChange={setFilters.setCasrFilter}>
                            <SelectTrigger><SelectValue placeholder="Filter by CASR..." /></SelectTrigger>
                            <SelectContent>
                                {filterOptions.casrOptions.map(option => (
                                    <SelectItem key={option} value={option}>
                                        {option === 'all' ? 'All CASRs' : option}
                                    </SelectItem>
                                ))}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Filtered Records</CardTitle>
                        <GitCompareArrows className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analyticsData.totalRecords}</div>
                        <p className="text-xs text-muted-foreground">Total records matching filters</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Open Items</CardTitle>
                        <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analyticsData.openItems}</div>
                        <p className="text-xs text-muted-foreground">{analyticsData.openPercentage.toFixed(1)}% of filtered items require follow up</p>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Follow Up Status</CardTitle>
                        <CardDescription>Distribution of OPEN vs CLOSED items in filtered results.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[200px] flex items-center justify-center">
                        <div className="relative flex items-center justify-center w-full h-full">
                            <ChartContainer config={chartConfig(analyticsData.statusItemData)} className="absolute top-0 left-0 w-full h-full">
                                <PieChart>
                                    <ChartTooltip cursor={{ fill: "hsl(var(--muted))" }} wrapperStyle={{ zIndex: 1000 }} content={<ChartTooltipContent hideLabel />} />
                                    <Pie data={analyticsData.statusItemData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={70} strokeWidth={5}>
                                        {analyticsData.statusItemData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={chartConfig(analyticsData.statusItemData)[entry.name].color} />
                                        ))}
                                    </Pie>
                                    <ChartLegend content={<ChartLegendContent nameKey="name" />} className="[&>*]:justify-center" />
                                </PieChart>
                            </ChartContainer>
                            <div className="text-center pointer-events-none">
                                <p className="text-3xl font-bold">{analyticsData.closedPercentage.toFixed(0)}%</p>
                                <p className="text-sm text-muted-foreground">Closed</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Top CASR Affected</CardTitle>
                        <CardDescription>Distribution of records per CASR affected in filtered results.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ChartContainer config={chartConfig(analyticsData.casrData)} className="h-[300px] w-full">
                            <ResponsiveContainer>
                                <BarChart data={analyticsData.casrData.slice(0, 10)} layout="vertical" margin={{ left: 50, right: 30 }}>
                                    <YAxis dataKey="name" type="category" width={100} interval={0} tick={{ fontSize: 12 }} />
                                    <XAxis type="number" allowDecimals={false} />
                                    <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} wrapperStyle={{ zIndex: 1000 }} content={<ChartTooltipContent indicator="dot" />} />
                                    <Bar dataKey="value" name="Record Count" radius={[0, 4, 4, 0]}>
                                        {analyticsData.casrData.map((entry, index) => (
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
                        <CardTitle>Annex Count</CardTitle>
                        <CardDescription>Distribution of records per Annex in filtered results.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ChartContainer config={chartConfig(analyticsData.annexData)} className="h-[300px] w-full">
                            <ResponsiveContainer>
                                <BarChart data={analyticsData.annexData.slice(0, 10)} layout="vertical" margin={{ left: 100, right: 30 }}>
                                    <YAxis dataKey="name" type="category" width={150} interval={0} tick={{ fontSize: 12 }} />
                                    <XAxis type="number" allowDecimals={false} />
                                    <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} wrapperStyle={{ zIndex: 1000 }} content={<ChartTooltipContent indicator="dot" />} />
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

                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>DGCA Compliance/Differences Status</CardTitle>
                        <CardDescription>Breakdown of all compliance statuses from evaluations in filtered results.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ChartContainer config={chartConfig(analyticsData.complianceStatusData)} className="h-[300px] w-full">
                            <ResponsiveContainer>
                                <BarChart data={analyticsData.complianceStatusData} layout="horizontal" margin={{ right: 30, top: 20, bottom: 80 }}>
                                    <XAxis dataKey="name" type="category" angle={-45} textAnchor="end" height={100} interval={0} tick={{ fontSize: 10 }} />
                                    <YAxis type="number" allowDecimals={false} />
                                    <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} wrapperStyle={{ zIndex: 1000 }} content={<ChartTooltipContent indicator="dot" />} />
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
        )}
    </div>
  );
}
