
'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import type { AdoptionDataPoint } from '@/lib/types';
import { ChartContainer, ChartTooltipContent } from './ui/chart';

type AdoptionLevelDashboardProps = {
  data: AdoptionDataPoint[];
};

const CHART_COLORS = {
    blue: 'hsl(var(--chart-1))',
    red: 'hsl(var(--chart-3))',
    orange: 'hsl(var(--chart-2))',
    green: 'hsl(var(--chart-4))',
    gray: 'hsl(var(--muted-foreground))',
    purple: 'hsl(var(--chart-5))',
};

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-2 bg-background border rounded-lg shadow-lg text-xs">
          <p className="font-bold">{data.sl}</p>
          {payload.map((entry: any) => (
            <p key={entry.name} style={{ color: entry.color }}>{`${entry.name}: ${entry.value}`}</p>
          ))}
        </div>
      );
    }
    return null;
};

export function AdoptionLevelDashboard({ data }: AdoptionLevelDashboardProps) {
  const { 
    totalEvaluationData, 
    percentageEvaluationData,
    totalEvaluationPercentage,
    totalSubjectData,
    totalSubjectPercentage,
    gapStatusData,
    gapStatusPercentage,
    levelImplementationData,
    levelImplementationPercentage
  } = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        totalEvaluationData: [],
        percentageEvaluationData: [],
        totalEvaluationPercentage: 0,
        totalSubjectData: [],
        totalSubjectPercentage: 0,
        gapStatusData: [],
        gapStatusPercentage: 0,
        levelImplementationData: [],
        levelImplementationPercentage: 0,
      };
    }
    // Total Evaluation Status
    const totalEvalData = data.map(item => ({
      sl: item.sl,
      evaluated: item.evaluated,
      notEvaluated: item.notEvaluated,
      notFinishYet: item.notFinishYet
    }));

    // Percentage Evaluation
    const evaluated = data.reduce((acc, curr) => acc + curr.evaluated, 0);
    const notEvaluated = data.reduce((acc, curr) => acc + curr.notEvaluated, 0);
    const notFinishYet = data.reduce((acc, curr) => acc + curr.notFinishYet, 0);
    const totalEval = evaluated + notEvaluated + notFinishYet;
    const evalData = [
      { name: 'Finished', value: evaluated, color: CHART_COLORS.green },
      { name: 'Not Finished Yet', value: notEvaluated + notFinishYet, color: CHART_COLORS.red },
    ];
    const evalPercentage = totalEval > 0 ? (evaluated / totalEval) * 100 : 0;

    // Total Subject & Status
    const totalSubData = data.map(item => ({
        sl: item.sl,
        totalSubject: item.totalSubject,
        standard: item.standard,
        recommendation: item.recommendation
    }));
    const totalStandard = data.reduce((acc, curr) => acc + curr.standard, 0);
    const totalSubjects = data.reduce((acc, curr) => acc + curr.totalSubject, 0);
    const subjectPercentage = totalSubjects > 0 ? (totalStandard / totalSubjects) * 100 : 0;


    // Gap Status
    const gapData = data.map(item => ({
        sl: item.sl,
        existingInCasr: item.existingInCasr,
        draftInCasr: item.draftInCasr,
        belumDiAdop: item.belumDiAdop,
        tidakDiAdop: item.tidakDiAdop,
        managementDecision: item.managementDecision
    }));
    const totalExistingInCasr = data.reduce((acc, curr) => acc + curr.existingInCasr, 0);
    const totalGapSubjects = data.reduce((acc, curr) => acc + curr.existingInCasr + curr.draftInCasr + curr.belumDiAdop + curr.tidakDiAdop + curr.managementDecision, 0);
    const gapPercentage = totalGapSubjects > 0 ? (totalExistingInCasr / totalGapSubjects) * 100 : 0;
    
    // Level of Implementation
    const implData = data.map(item => ({
        sl: item.sl,
        noDifference: item.noDifference,
        moreExactingOrExceeds: item.moreExactingOrExceeds,
        differentInCharacter: item.differentInCharacter,
        lessProtective: item.lessProtective,
        significantDifference: item.significantDifference,
        notApplicable: item.notApplicable,
    }));
    const totalNoDifference = data.reduce((acc, curr) => acc + curr.noDifference, 0);
    const totalImplementationSubjects = data.reduce((acc, curr) => acc + curr.noDifference + curr.moreExactingOrExceeds + curr.differentInCharacter + curr.lessProtective + curr.significantDifference + curr.notApplicable, 0);
    const implPercentage = totalImplementationSubjects > 0 ? (totalNoDifference / totalImplementationSubjects) * 100 : 0;

    return { 
        totalEvaluationData: totalEvalData,
        percentageEvaluationData: evalData,
        totalEvaluationPercentage: evalPercentage,
        totalSubjectData: totalSubData,
        totalSubjectPercentage: subjectPercentage,
        gapStatusData: gapData,
        gapStatusPercentage: gapPercentage,
        levelImplementationData: implData,
        levelImplementationPercentage: implPercentage
    };
  }, [data]);
  
  const chartConfig = {
    sl: { label: "State Letter" },
    evaluated: { label: "Evaluated", color: "hsl(var(--chart-1))" },
    notEvaluated: { label: "Not Evaluated", color: "hsl(var(--chart-2))" },
    notFinishYet: { label: "Not Finish Yet", color: "hsl(var(--chart-3))" },
    totalSubject: { label: "Total Subject", color: "hsl(var(--chart-1))" },
    standard: { label: "Standard", color: "hsl(var(--chart-2))" },
    recommendation: { label: "Recommendation", color: "hsl(var(--chart-3))" },
    existingInCasr: { label: "Existing in CASR", color: "hsl(var(--chart-1))" },
    draftInCasr: { label: "Draft in CASR", color: "hsl(var(--chart-2))" },
    belumDiAdop: { label: "Belum Diadop", color: "hsl(var(--chart-3))" },
    tidakDiAdop: { label: "Tidak Diadop", color: "hsl(var(--chart-4))" },
    managementDecision: { label: "Management Decision", color: "hsl(var(--chart-5))" },
    noDifference: { label: "No Difference", color: "hsl(var(--chart-1))" },
    moreExactingOrExceeds: { label: "More exacting or Exceeds", color: "hsl(var(--chart-2))" },
    differentInCharacter: { label: "Different in character/Other means of compliance", color: "hsl(var(--chart-3))" },
    lessProtective: { label: "Less Protective", color: "hsl(var(--chart-4))" },
    significantDifference: { label: "Significant Difference", color: "hsl(var(--chart-5))" },
    notApplicable: { label: "Not Applicable", color: "hsl(var(--muted))" },
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Total Evaluation Status</CardTitle>
            <CardDescription>{totalEvaluationPercentage.toFixed(1)}% Evaluated</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="min-h-64 w-full">
              <BarChart data={totalEvaluationData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="sl" type="category" hide />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                <Legend />
                <Bar dataKey="evaluated" stackId="a" fill="hsl(var(--chart-1))" name="Evaluated" radius={[4, 4, 4, 4]} />
                <Bar dataKey="notEvaluated" stackId="a" fill="hsl(var(--chart-2))" name="Not Evaluated" radius={[4, 4, 4, 4]} />
                <Bar dataKey="notFinishYet" stackId="a" fill="hsl(var(--chart-3))" name="Not Finish Yet" radius={[4, 4, 4, 4]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Percentage Evaluation</CardTitle>
             <CardDescription>Overall Progress</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <ChartContainer config={{}} className="h-48 w-48">
              <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie
                  data={percentageEvaluationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  innerRadius={60}
                  dataKey="value"
                  strokeWidth={2}
                >
                  {percentageEvaluationData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.color} />
                  ))}
                </Pie>
                 <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-foreground">
                    {`${Math.round(totalEvaluationPercentage)}%`}
                </text>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Total Subject & Status</CardTitle>
            <CardDescription>{totalSubjectPercentage.toFixed(1)}% Standard</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="min-h-64 w-full">
              <BarChart data={totalSubjectData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="sl" type="category" hide />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                <Legend />
                <Bar dataKey="standard" stackId="a" fill="hsl(var(--chart-2))" name="Standard" radius={[4, 4, 4, 4]} />
                <Bar dataKey="recommendation" stackId="a" fill="hsl(var(--chart-3))" name="Recommendation" radius={[4, 4, 4, 4]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gap Status</CardTitle>
          <CardDescription>{gapStatusPercentage.toFixed(1)}% Existing in CASR</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="w-full h-[400px]">
                 <BarChart data={gapStatusData} margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="sl" angle={-45} textAnchor="end" height={50} tick={{ fontSize: 10 }} interval={0} />
                    <YAxis />
                    <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                    <Legend verticalAlign="bottom" wrapperStyle={{paddingTop: '20px'}}/>
                    <Bar dataKey="existingInCasr" stackId="a" fill="hsl(var(--chart-1))" name={chartConfig.existingInCasr.label} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="draftInCasr" stackId="a" fill="hsl(var(--chart-2))" name={chartConfig.draftInCasr.label} />
                    <Bar dataKey="belumDiAdop" stackId="a" fill="hsl(var(--chart-3))" name={chartConfig.belumDiAdop.label} />
                    <Bar dataKey="tidakDiAdop" stackId="a" fill="hsl(var(--chart-4))" name={chartConfig.tidakDiAdop.label} />
                    <Bar dataKey="managementDecision" stackId="a" fill="hsl(var(--chart-5))" name={chartConfig.managementDecision.label} radius={[4, 4, 0, 0]} />
                </BarChart>
            </ChartContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Level of Implementation</CardTitle>
          <CardDescription>{levelImplementationPercentage.toFixed(1)}% No Difference</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
           <ChartContainer config={chartConfig} className="w-full h-[400px]">
                <BarChart data={levelImplementationData} margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="sl" angle={-45} textAnchor="end" height={50} tick={{ fontSize: 10 }} interval={0}/>
                    <YAxis />
                    <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                    <Legend verticalAlign="bottom" wrapperStyle={{paddingTop: '20px'}}/>
                    <Bar dataKey="noDifference" stackId="a" fill="hsl(var(--chart-1))" name={chartConfig.noDifference.label} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="moreExactingOrExceeds" stackId="a" fill="hsl(var(--chart-2))" name={chartConfig.moreExactingOrExceeds.label} />
                    <Bar dataKey="differentInCharacter" stackId="a" fill="hsl(var(--chart-3))" name={chartConfig.differentInCharacter.label} />
                    <Bar dataKey="lessProtective" stackId="a" fill="hsl(var(--chart-4))" name={chartConfig.lessProtective.label} />
                    <Bar dataKey="significantDifference" stackId="a" fill="hsl(var(--chart-5))" name={chartConfig.significantDifference.label} />
                    <Bar dataKey="notApplicable" stackId="a" fill="hsl(var(--muted))" name={chartConfig.notApplicable.label} radius={[4, 4, 0, 0]} />
                </BarChart>
            </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}

    