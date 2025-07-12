// This file has been replaced by compliance-data-editor.tsx and is no longer needed.
// This component now handles the visualization of compliance data.
'use client';

import { Bar, BarChart, CartesianGrid, Legend, Rectangle, ResponsiveContainer, Tooltip, XAxis, YAxis, Text, TooltipProps } from "recharts";
import type { AdoptionDataPoint } from "@/lib/types";
import { Info } from "lucide-react";

type AdoptionLevelDashboardProps = {
    data: AdoptionDataPoint[];
}

const COLORS = {
    'Evaluated': '#16a34a', // green-600
    'Not Evaluated': '#f97316', // orange-500
    'Not Finish Yet': '#eab308', // yellow-500
    'Standard': '#2563eb', // blue-600
    'Recommendation': '#4f46e5', // indigo-600
    'Existing in CASR': '#16a34a', // green-600
    'Draft in CASR': '#ca8a04', // yellow-600
    'Belum Diadop': '#f97316', // orange-500
    'Tidak Diadop': '#dc2626', // red-600
    'Management Decision': '#6b7280', // gray-500
    'No Difference': '#16a34a',
    'More Exacting or Exceeds': '#2563eb',
    'Different in Character': '#ca8a04',
    'Less Protective': '#f97316',
    'Significant Difference': '#dc2626',
    'Not Applicable': '#6b7280',
};


const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-background border rounded-lg shadow-lg text-xs">
        <p className="font-bold">{label}</p>
        {payload.map(p => (
            <p key={p.name} style={{ color: p.color }}>
                {p.name}: {p.value}
            </p>
        ))}
      </div>
    );
  }
  return null;
};


export function AdoptionLevelDashboard({ data }: AdoptionLevelDashboardProps) {
    if (!data || data.length === 0) {
        return <p>No data to display.</p>
    }

    const evaluationStatusData = data.map(d => ({
        sl: d.sl,
        'Evaluated': d.evaluated,
        'Not Evaluated': d.notEvaluated,
        'Not Finish Yet': d.notFinishYet
    }));

    const subjectStatusData = data.map(d => ({
        sl: d.sl,
        'Total Subject': d.totalSubject,
        'Standard': d.standard,
        'Recommendation': d.recommendation
    }));

    const gapStatusData = data.map(d => ({
        sl: d.sl,
        'Existing in CASR': d.existingInCasr,
        'Draft in CASR': d.draftInCasr,
        'Belum Diadop': d.belumDiAdop,
        'Tidak Diadop': d.tidakDiAdop,
        'Management Decision': d.managementDecision
    }));

    const implementationLevelData = data.map(d => ({
        sl: d.sl,
        'No Difference': d.noDifference,
        'More Exacting or Exceeds': d.moreExactingOrExceeds,
        'Different in Character': d.differentInCharacter,
        'Less Protective': d.lessProtective,
        'Significant Difference': d.significantDifference,
        'Not Applicable': d.notApplicable
    }));

    return (
        <div className="space-y-8">
            <ChartSection title="Total Evaluation Status" data={evaluationStatusData} colors={['Evaluated', 'Not Evaluated', 'Not Finish Yet']} />
            <ChartSection title="Total Subject & Status" data={subjectStatusData} colors={['Total Subject', 'Standard', 'Recommendation']} />
            <ChartSection title="Gap Status" data={gapStatusData} colors={['Existing in CASR', 'Draft in CASR', 'Belum Diadop', 'Tidak Diadop', 'Management Decision']} />
            <ChartSection title="Level of Implementation" data={implementationLevelData} colors={['No Difference', 'More Exacting or Exceeds', 'Different in Character', 'Less Protective', 'Significant Difference', 'Not Applicable']} />
        </div>
    );
}

function ChartSection({ title, data, colors }: { title: string, data: any[], colors: string[] }) {
    const totalRecords = data.reduce((sum, current) => sum + Object.values<number>(current).slice(1).reduce((s, c) => s + c, 0), 0);

    if (totalRecords === 0) {
        return null; // Don't render chart if there's no data
    }

    return (
        <div>
            <h3 className="font-semibold text-lg mb-4">{title}</h3>
            <ResponsiveContainer width="100%" height={250}>
                <BarChart
                    data={data}
                    margin={{
                        top: 20, right: 30, left: 20, bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="sl" />
                    <YAxis allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 1000 }} />
                    <Legend />
                    {colors.map(colorKey => (
                        <Bar key={colorKey} dataKey={colorKey} stackId="a" fill={COLORS[colorKey as keyof typeof COLORS] || '#8884d8'} />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
