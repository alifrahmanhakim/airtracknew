
'use client';

import * as React from 'react';
import type { AdoptionDataPoint } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, CheckCircle, HelpCircle, XCircle, FileText, FileClock, FilePlus, FileQuestion } from 'lucide-react';
import { Progress } from './ui/progress';

interface ComplianceAnalyticsProps {
  data: AdoptionDataPoint;
}

const StatItem = ({ icon: Icon, label, value, color }: { icon: React.ElementType, label: string, value: number, color?: string }) => (
    <div className="flex items-center gap-3 text-sm">
        <Icon className={`h-5 w-5 ${color || 'text-muted-foreground'}`} />
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
                        <div className="space-y-3">
                            <StatItem icon={FileText} label="Existing in CASR" value={data.existingInCasr} color="text-blue-500" />
                            <StatItem icon={FileClock} label="Draft in CASR" value={data.draftInCasr} color="text-blue-400" />
                            <StatItem icon={FilePlus} label="Belum Diadop" value={data.belumDiAdop} color="text-yellow-500" />
                            <StatItem icon={FileQuestion} label="Management Decision" value={data.managementDecision} color="text-orange-500" />
                            <StatItem icon={XCircle} label="Tidak Diadop" value={data.tidakDiAdop} color="text-red-500" />
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
