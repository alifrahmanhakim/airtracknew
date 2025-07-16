
'use client';

import * as React from 'react';
import type { AdoptionDataPoint } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, CheckCircle, HelpCircle, XCircle, FileText, FileClock, FilePlus, FileQuestion } from 'lucide-react';
import { Progress } from './ui/progress';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';

interface ComplianceAnalyticsProps {
  data: AdoptionDataPoint;
}

const StatItem = ({ icon: Icon, label, value, color }: { icon: React.ElementType, label: string, value: number, color?: string }) => (
    <div className="flex items-center gap-3 text-sm">
        <Icon className={cn('h-5 w-5', color || 'text-muted-foreground')} />
        <div className="flex justify-between w-full">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-semibold">{value}</span>
        </div>
    </div>
);

export function ComplianceAnalytics({ data }: ComplianceAnalyticsProps) {
    if (!data) return null;

    const totalEvaluated = data.evaluated + data.notFinishYet + data.notEvaluated;
    const adoptionPercentage = totalEvaluated > 0 ? Math.round((data.evaluated / totalEvaluated) * 100) : 0;
    
    const gapStatusData = React.useMemo(() => [
        { name: 'Existing in CASR', value: data.existingInCasr, color: 'hsl(var(--chart-1))' },
        { name: 'Draft in CASR', value: data.draftInCasr, color: 'hsl(var(--chart-2))' },
        { name: 'Belum Diadop', value: data.belumDiAdop, color: 'hsl(var(--chart-3))' },
        { name: 'Management Decision', value: data.managementDecision, color: 'hsl(var(--chart-4))' },
        { name: 'Tidak Diadop', value: data.tidakDiAdop, color: 'hsl(var(--chart-5))' },
    ], [data]);

    const totalGaps = gapStatusData.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <Card className="bg-muted/30">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>State Letter: {data.sl}</span>
                    <span className="text-2xl font-bold text-primary">{adoptionPercentage}% Evaluated</span>
                </CardTitle>
                <CardDescription>
                    Progress of evaluation for all subjects under this State Letter.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <div className="flex justify-between items-center mb-1 text-sm">
                        <span className="font-medium text-muted-foreground">Evaluation Progress</span>
                        <span className="font-semibold">{data.evaluated} / {totalEvaluated}</span>
                    </div>
                    <Progress value={adoptionPercentage} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    <div>
                        <p className="font-semibold mb-3">Gap Status</p>
                        <div className="w-full h-[200px]">
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={gapStatusData} layout="vertical" margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        width={110}
                                        tick={{ fontSize: 12 }}
                                    />
                                    <Tooltip 
                                        cursor={{ fill: 'hsl(var(--muted))' }}
                                        content={<ChartTooltipContent />}
                                    />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={20}>
                                        {gapStatusData.map((entry) => (
                                            <Cell key={`cell-${entry.name}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                             </ResponsiveContainer>
                        </div>
                        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                            {gapStatusData.map(item => {
                                const percentage = totalGaps > 0 ? ((item.value / totalGaps) * 100).toFixed(1) : 0;
                                return (
                                    <div key={item.name} className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span>{item.name}</span>
                                        </div>
                                        <span className='font-mono font-semibold'>{item.value} ({percentage}%)</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                     <div>
                        <p className="font-semibold mb-3">Subject Status</p>
                        <div className="space-y-3">
                           <StatItem icon={CheckCircle} label="Standard" value={data.standard} color="text-green-500" />
                           <StatItem icon={HelpCircle} label="Recommendation" value={data.recommendation} />
                        </div>
                    </div>
                </div>

            </CardContent>
        </Card>
    );
}
