
'use client';

import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Text,
  Legend,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CcefodRecord } from '@/lib/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type CcefodAnalyticsDashboardProps = {
  records: CcefodRecord[];
};

const CHART_COLORS = [
    'hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))',
    'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--chart-6))',
    'hsl(var(--chart-7))', 'hsl(var(--chart-8))', 'hsl(var(--chart-1))',
    'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))',
    'hsl(var(--chart-5))', 'hsl(var(--chart-6))', 'hsl(var(--chart-7))',
    'hsl(var(--chart-8))', 'hsl(var(--chart-1))', 'hsl(var(--chart-2))',
    'hsl(var(--chart-3))', 'hsl(var(--muted))',
];

const CustomizedAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const maxCharsPerLine = 45;
    const text = payload.value;

    const splitTextIntoLines = (text: string, maxChars: number) => {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        words.forEach(word => {
            if ((currentLine + word).length > maxChars) {
                lines.push(currentLine.trim());
                currentLine = '';
            }
            currentLine += word + ' ';
        });
        lines.push(currentLine.trim());
        return lines;
    };

    const lines = splitTextIntoLines(text, maxCharsPerLine);

    return (
        <g transform={`translate(${x},${y})`}>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <text x={0} y={0} dy={4} textAnchor="end" fill="hsl(var(--foreground))" className="text-xs">
                            {lines.map((line, index) => (
                                <tspan key={index} x={0} dy={index === 0 ? 0 : 12}>
                                    {line}
                                </tspan>
                            ))}
                        </text>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{text}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </g>
    );
};

export function CcefodAnalyticsDashboard({ records }: CcefodAnalyticsDashboardProps) {
  const analyticsData = useMemo(() => {
    if (records.length === 0) {
      return null;
    }

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
    
    const annexCounts = countBy('annex');
    const annexData = Object.entries(annexCounts)
      .map(([name, value]) => ({ name, value, fullName: name }))
      .sort((a, b) => {
          const numA = parseInt(a.name, 10);
          const numB = parseInt(b.name, 10);
          if (!isNaN(numA) && !isNaN(numB)) {
              if (numA !== numB) return numA - numB;
          }
          return a.name.localeCompare(b.name);
      });
    
    const statusTotal = statusData.reduce((acc, curr) => acc + curr.value, 0);
    const finalStatusCount = statusData.find(s => s.name === 'Final')?.value || 0;
    const finalStatusPercentage = statusTotal > 0 ? (finalStatusCount / statusTotal) * 100 : 0;
    
    const adaPerubahanTotal = adaPerubahanData.reduce((acc, curr) => acc + curr.value, 0);
    const yaAdaPerubahanCount = adaPerubahanData.find(s => s.name === 'YA')?.value || 0;
    const yaAdaPerubahanPercentage = adaPerubahanTotal > 0 ? (yaAdaPerubahanCount / adaPerubahanTotal) * 100 : 0;
    
    const implementationLevelTotal = implementationLevelData.reduce((acc, curr) => acc + curr.value, 0);
    const implementationPercentages = implementationLevelData
      .map(item => ({
        name: item.name,
        value: item.value,
        percentage: implementationLevelTotal > 0 ? (item.value / implementationLevelTotal) * 100 : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage);

    const implementationDescription = implementationPercentages.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {implementationPercentages.map(item => (
            <div key={item.name} className="flex items-baseline gap-2">
                <span>{item.name}</span>
                <div className="flex-grow border-b border-dashed border-muted-foreground/30"></div>
                <span className="font-bold whitespace-nowrap pl-2">{item.percentage.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      ) : <p className="text-sm text-muted-foreground">No data to describe.</p>;

    const annexTotal = annexData.reduce((acc, curr) => acc + curr.value, 0);
    const annexPercentages = annexData
      .map(item => ({
        name: item.fullName,
        value: item.value,
        percentage: annexTotal > 0 ? (item.value / annexTotal) * 100 : 0,
      }));

    const topAnnexDescription = annexPercentages.length > 0 ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1 text-sm text-muted-foreground">
        {annexPercentages.map(item => (
           <div key={item.name} className="flex items-baseline gap-2">
              <span>{item.name}</span>
              <div className="flex-grow border-b border-dashed border-muted-foreground/30"></div>
              <span className="font-bold whitespace-nowrap text-right">{item.percentage.toFixed(1)}%</span>
           </div>
        ))}
      </div>
    ) : <p className="text-sm text-muted-foreground">No data to describe.</p>;

    return {
      implementationLevelData,
      statusData,
      adaPerubahanData,
      annexData,
      annexTotal,
      finalStatusPercentage,
      yaAdaPerubahanPercentage,
      implementationDescription: implementationDescription,
      topAnnexDescription: topAnnexDescription,
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
    <TooltipProvider>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
                <CardDescription>Overview of all record statuses in the database.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] relative">
                <ChartContainer config={chartConfig(analyticsData.statusData)} className="mx-auto aspect-square h-full">
                    <PieChart>
                        <ChartTooltip cursor={{ fill: "hsl(var(--muted))" }} wrapperStyle={{ zIndex: 1000 }} content={<ChartTooltipContent hideLabel />} />
                        <Pie 
                            data={analyticsData.statusData} 
                            dataKey="value" 
                            nameKey="name" 
                            innerRadius={60} 
                            strokeWidth={5}
                        >
                            {analyticsData.statusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={chartConfig(analyticsData.statusData)[entry.name].color} />
                            ))}
                        </Pie>
                         <ChartLegend content={<ChartLegendContent nameKey="name" />} className="[&>*]:justify-center" />
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
                <CardTitle>Proposed Changes</CardTitle>
                <CardDescription>Breakdown of records with or without proposed changes.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] relative">
                <ChartContainer config={chartConfig(analyticsData.adaPerubahanData)} className="mx-auto aspect-square h-full">
                    <PieChart>
                        <ChartTooltip cursor={{ fill: "hsl(var(--muted))" }} wrapperStyle={{ zIndex: 1000 }} content={<ChartTooltipContent hideLabel />} />
                        <Pie 
                            data={analyticsData.adaPerubahanData} 
                            dataKey="value" 
                            nameKey="name" 
                            innerRadius={60} 
                            strokeWidth={5}
                        >
                            {analyticsData.adaPerubahanData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={chartConfig(analyticsData.adaPerubahanData)[entry.name].color} />
                            ))}
                        </Pie>
                        <ChartLegend content={<ChartLegendContent nameKey="name" />} className="[&>*]:justify-center" />
                    </PieChart>
                </ChartContainer>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[calc(50%+1.5rem)] text-center pointer-events-none">
                    <p className="text-2xl font-bold">{analyticsData.yaAdaPerubahanPercentage.toFixed(0)}%</p>
                    <p className="text-sm text-muted-foreground">Proposed</p>
                </div>
            </CardContent>
        </Card>

        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Distribution by Annex</CardTitle>
                <CardDescription>Detailed percentage breakdown of all Annexes in the current selection.</CardDescription>
                <div className="pt-2">
                    {analyticsData.topAnnexDescription}
                </div>
            </CardHeader>
            <CardContent className="pl-2">
                <ChartContainer config={chartConfig(analyticsData.annexData)}>
                    <ResponsiveContainer width="100%" height={Math.max(400, analyticsData.annexData.length * 40)}>
                        <BarChart data={analyticsData.annexData} layout="vertical" margin={{ left: 20, right: 30, top: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={350} interval={0} tick={<CustomizedAxisTick />} />
                             <ChartTooltip
                                cursor={{ fill: 'hsl(var(--muted))' }}
                                wrapperStyle={{ zIndex: 1000 }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        const percentage = (data.value / analyticsData.annexTotal) * 100;
                                        return (
                                            <div className="p-2 bg-background border rounded-lg shadow-lg text-xs">
                                                <p className="font-bold">{data.fullName}</p>
                                                <p><span className="font-semibold">Count:</span> {data.value}</p>
                                                <p><span className="font-semibold">Percentage:</span> {percentage.toFixed(2)}%</p>
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
              <CardDescription>Detailed percentage breakdown of all implementation levels.</CardDescription>
                <div className="pt-2">
                    {analyticsData.implementationDescription}
                </div>
            </CardHeader>
            <CardContent className="pl-2">
                <ChartContainer config={chartConfig(analyticsData.implementationLevelData)}>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={analyticsData.implementationLevelData} layout="horizontal" margin={{ right: 30, top: 20, bottom: 80 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                             <XAxis 
                                dataKey="name" 
                                type="category"
                                tickLine={false}
                                axisLine={false}
                                height={100}
                                interval={0}
                                tick={(props) => {
                                    const { x, y, payload } = props;
                                    return (
                                        <g transform={`translate(${x},${y})`}>
                                            <text x={0} y={0} dy={16} textAnchor="end" fill="#666" transform="rotate(-35)">{payload.value}</text>
                                        </g>
                                    );
                                }}
                            />
                            <YAxis type="number" allowDecimals={false} />
                            <ChartTooltip
                                cursor={{ fill: 'hsl(var(--muted))' }}
                                wrapperStyle={{ zIndex: 1000 }}
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
    </TooltipProvider>
  );
}
