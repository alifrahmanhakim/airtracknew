
'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import type { AdoptionDataPoint } from '@/lib/types';
import { ChartContainer } from './ui/chart';

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
      const { name, value } = payload[0];
      return (
        <div className="p-2 bg-background border rounded-lg shadow-lg text-xs">
          <p className="font-bold">{`${name}: ${value}`}</p>
        </div>
      );
    }
    return null;
};


function SummaryPieCard({ title, data, total, label }: { title: string, data: {name: string, value: number, color: string}[], total: number, label: string }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm text-center">{title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
                <ChartContainer config={{}} className="h-48 w-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Tooltip content={<CustomTooltip />} />
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={70}
                                innerRadius={50}
                                dataKey="value"
                                strokeWidth={2}
                            >
                                {data.map((entry) => (
                                    <Cell key={`cell-${entry.name}`} fill={entry.color} />
                                ))}
                            </Pie>
                             <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} verticalAlign="bottom" align="center" />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartContainer>
                <div className="text-center mt-2">
                    <span className="text-2xl font-bold">{`${Math.round(total)}%`}</span>
                    <p className="text-xs text-muted-foreground">{label}</p>
                </div>
            </CardContent>
        </Card>
    )
}

export function AdoptionLevelDashboard({ data }: AdoptionLevelDashboardProps) {

  const {
    percentageEvaluationData,
    totalEvaluationPercentage,
    subjectStatusData,
    totalSubjectPercentage,
    gapStatusData,
    totalGapPercentage,
    implementationData,
    totalImplementationPercentage,
  } = useMemo(() => {
    // Evaluation Status
    const evaluated = data.reduce((acc, curr) => acc + curr.evaluated, 0);
    const notEvaluated = data.reduce((acc, curr) => acc + curr.notEvaluated, 0);
    const notFinishYet = data.reduce((acc, curr) => acc + curr.notFinishYet, 0);
    const totalEval = evaluated + notEvaluated + notFinishYet;
    const evalData = [
      { name: 'Finished', value: evaluated, color: CHART_COLORS.blue },
      { name: 'Not Finished Yet', value: notEvaluated + notFinishYet, color: CHART_COLORS.red },
    ];
    const evalPercentage = totalEval > 0 ? (evaluated / totalEval) * 100 : 0;
    
    // Subject Status
    const standard = data.reduce((acc, curr) => acc + curr.standard, 0);
    const recommendation = data.reduce((acc, curr) => acc + curr.recommendation, 0);
    const totalSub = standard + recommendation;
    const subData = [
        { name: 'Standard', value: standard, color: CHART_COLORS.green },
        { name: 'Recommendation', value: recommendation, color: CHART_COLORS.orange }
    ];
    const subPercentage = totalSub > 0 ? (standard / totalSub) * 100 : 0;

    // Gap Status
    const existingInCasr = data.reduce((acc, curr) => acc + curr.existingInCasr, 0);
    const otherGaps = data.reduce((acc, curr) => acc + curr.draftInCasr + curr.belumDiAdop + curr.tidakDiAdop + curr.managementDecision, 0);
    const totalGap = existingInCasr + otherGaps;
    const gapData = [
        { name: 'Existing in CASR', value: existingInCasr, color: CHART_COLORS.green },
        { name: 'Has Gap', value: otherGaps, color: CHART_COLORS.red },
    ];
    const gapPercentage = totalGap > 0 ? (existingInCasr / totalGap) * 100 : 0;
    
    // Implementation Level
    const noDifference = data.reduce((acc, curr) => acc + curr.noDifference, 0);
    const otherImplementations = data.reduce((acc, curr) => acc + curr.moreExactingOrExceeds + curr.differentInCharacter + curr.lessProtective + curr.significantDifference + curr.notApplicable, 0);
    const totalImpl = noDifference + otherImplementations;
    const implData = [
        { name: 'No Difference', value: noDifference, color: CHART_COLORS.green },
        { name: 'Has Difference', value: otherImplementations, color: CHART_COLORS.red }
    ];
    const implPercentage = totalImpl > 0 ? (noDifference / totalImpl) * 100 : 0;

    return {
      percentageEvaluationData: evalData,
      totalEvaluationPercentage: evalPercentage,
      subjectStatusData: subData,
      totalSubjectPercentage: subPercentage,
      gapStatusData: gapData,
      totalGapPercentage: gapPercentage,
      implementationData: implData,
      totalImplementationPercentage: implPercentage,
    };
  }, [data]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SummaryPieCard 
            title="Percentage Evaluation"
            data={percentageEvaluationData}
            total={totalEvaluationPercentage}
            label="Finished"
        />
         <SummaryPieCard 
            title="Subject Status"
            data={subjectStatusData}
            total={totalSubjectPercentage}
            label="Standard"
        />
        <SummaryPieCard 
            title="Gap Analysis"
            data={gapStatusData}
            total={totalGapPercentage}
            label="Existing in CASR"
        />
        <SummaryPieCard 
            title="Implementation Level"
            data={implementationData}
            total={totalImplementationPercentage}
            label="No Difference"
        />
    </div>
  );
}
