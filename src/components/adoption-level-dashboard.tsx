
'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import type { AdoptionDataPoint } from '@/lib/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart';

type AdoptionLevelDashboardProps = {
  data: AdoptionDataPoint[];
};

const CHART_COLORS = {
  blue: 'hsl(var(--chart-1))',
  red: 'hsl(var(--chart-3))',
  orange: 'hsl(var(--chart-2))',
  green: 'hsl(var(--chart-4))',
  gray: 'hsl(var(--muted-foreground))',
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 bg-background border rounded-lg shadow-lg text-xs">
          <p className="font-bold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

export function AdoptionLevelDashboard({ data }: AdoptionLevelDashboardProps) {

  const percentageEvaluationData = useMemo(() => {
    const total = data.reduce((acc, curr) => acc + curr.evaluated + curr.notEvaluated + curr.notFinishYet, 0);
    const finished = data.reduce((acc, curr) => acc + curr.evaluated, 0);
    const notFinishedYet = total - finished;
    
    return [
      { name: 'Finished', value: finished, color: CHART_COLORS.blue },
      { name: 'Not Finish Yet', value: notFinishedYet, color: CHART_COLORS.red },
    ];
  }, [data]);
  
  const chartConfig = {
    evaluated: { label: "Evaluated", color: CHART_COLORS.blue },
    notEvaluated: { label: "Not Evaluated", color: CHART_COLORS.orange },
    notFinishYet: { label: "Not Finish Yet", color: CHART_COLORS.red },
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">Total Evaluation Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="sl" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}/>
                  <Bar dataKey="evaluated" stackId="a" fill={CHART_COLORS.blue} name="Evaluated" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="notEvaluated" stackId="a" fill={CHART_COLORS.orange} name="Not Evaluated" />
                  <Bar dataKey="notFinishYet" stackId="a" fill={CHART_COLORS.red} name="Not Finish Yet" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 flex flex-col">
            <CardHeader>
                <CardTitle className="text-sm">Percentage Evaluation</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center">
                 <ChartContainer config={{}} className="h-48 w-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Tooltip content={<CustomTooltip />} />
                            <Pie
                                data={percentageEvaluationData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={70}
                                innerRadius={50}
                                dataKey="value"
                                strokeWidth={2}
                            >
                                {percentageEvaluationData.map((entry) => (
                                    <Cell key={`cell-${entry.name}`} fill={entry.color} />
                                ))}
                            </Pie>
                             <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">Total Subject & Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="sl" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}/>
                  <Bar dataKey="totalSubject" fill={CHART_COLORS.gray} name="Total Subject" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="standard" fill={CHART_COLORS.red} name="Standard" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="recommendation" fill={CHART_COLORS.orange} name="Recommendation" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Gap Status</CardTitle>
        </CardHeader>
        <CardContent>
            <ChartContainer config={{}} className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="sl" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}/>
                    <Bar dataKey="existingInCasr" stackId="a" fill={CHART_COLORS.green} name="Existing in CASR" />
                    <Bar dataKey="draftInCasr" stackId="a" fill="hsl(var(--chart-5))" name="Draft in CASR" />
                    <Bar dataKey="belumDiAdop" stackId="a" fill={CHART_COLORS.blue} name="Belum Diadop" />
                    <Bar dataKey="tidakDiAdop" stackId="a" fill={CHART_COLORS.gray} name="Tidak Diadop" />
                    <Bar dataKey="managementDecision" stackId="a" fill={CHART_COLORS.orange} name="Management Decision" />
                </BarChart>
                </ResponsiveContainer>
            </ChartContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Level of Implementation</CardTitle>
        </CardHeader>
        <CardContent>
            <ChartContainer config={{}} className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="sl" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}/>
                    <Bar dataKey="noDifference" stackId="a" fill={CHART_COLORS.green} name="No Difference" />
                    <Bar dataKey="moreExactingOrExceeds" stackId="a" fill={CHART_COLORS.orange} name="More exacting or Exceeds" />
                    <Bar dataKey="differentInCharacter" stackId="a" fill={CHART_COLORS.blue} name="Different in character/Other means of compliance" />
                    <Bar dataKey="lessProtective" stackId="a" fill={CHART_COLORS.red} name="Less Protective" />
                    <Bar dataKey="significantDifference" stackId="a" fill="hsl(var(--chart-5))" name="Significant Difference" />
                    <Bar dataKey="notApplicable" stackId="a" fill={CHART_COLORS.gray} name="Not Applicable" />
                </BarChart>
                </ResponsiveContainer>
            </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
