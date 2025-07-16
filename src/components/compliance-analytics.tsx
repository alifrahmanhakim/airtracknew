
'use client';

import * as React from 'react';
import type { ComplianceDataRow } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, CheckCircle, HelpCircle, XCircle, FileText, FilePlus, FileQuestion, FileClock } from 'lucide-react';
import { Progress } from './ui/progress';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  } from '@/components/ui/tooltip';

interface ComplianceAnalyticsProps {
  data: ComplianceDataRow[];
}

const ProgressBarCard = ({ title, value, total, colorClass }: { title: string, value: number, total: number, colorClass: string }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <p className="text-sm font-semibold">{value} / {total}</p>
            </div>
            <Progress value={percentage} indicatorClassName={colorClass} />
        </div>
    )
}


export function ComplianceAnalytics({ data }: ComplianceAnalyticsProps) {
  const stats = React.useMemo(() => {
    if (!data || data.length === 0) {
      return null;
    }
    const total = data.length;
    const evaluated = data.filter(d => d.evaluationStatus === 'Evaluated').length;
    const notEvaluated = data.filter(d => d.evaluationStatus === 'Not Evaluated').length;
    const notFinishYet = data.filter(d => d.evaluationStatus === 'Not Finish Yet').length;

    const standard = data.filter(d => d.subjectStatus === 'Standard').length;
    const recommendation = data.filter(d => d.subjectStatus === 'Recommendation').length;

    const existingInCasr = data.filter(d => d.gapStatus === 'Existing in CASR').length;
    const draftInCasr = data.filter(d => d.gapStatus === 'Draft in CASR').length;
    const belumDiadop = data.filter(d => d.gapStatus === 'Belum Diadop').length;
    const tidakDiadop = data.filter(d => d.gapStatus === 'Tidak Diadop').length;
    const managementDecision = data.filter(d => d.gapStatus === 'Management Decision').length;

    return { total, evaluated, notEvaluated, notFinishYet, standard, recommendation, existingInCasr, draftInCasr, belumDiadop, tidakDiadop, managementDecision };
  }, [data]);

  if (!stats) {
    return (
      <div className="text-center py-10 text-muted-foreground bg-muted/50 rounded-lg">
        <Info className="mx-auto h-8 w-8 mb-2" />
        <p className="font-semibold">No Compliance Data Available</p>
        <p className="text-sm">Add data via the editor to see analytics.</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div>
            <p className="text-base font-semibold mb-2">Evaluation Status</p>
            <ProgressBarCard title="Evaluated" value={stats.evaluated} total={stats.total} colorClass="bg-green-500" />
        </div>
        
        <div>
            <p className="text-base font-semibold mb-3">Gap Status</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                        <p className="font-bold">{stats.existingInCasr}</p>
                        <p className="text-xs text-muted-foreground">Existing in CASR</p>
                    </div>
                </div>
                 <div className="flex items-center gap-3">
                    <FileClock className="h-5 w-5 text-blue-400" />
                    <div>
                        <p className="font-bold">{stats.draftInCasr}</p>
                        <p className="text-xs text-muted-foreground">Draft in CASR</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <FilePlus className="h-5 w-5 text-yellow-500" />
                    <div>
                        <p className="font-bold">{stats.belumDiadop}</p>
                        <p className="text-xs text-muted-foreground">Belum Diadop</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <FileQuestion className="h-5 w-5 text-orange-500" />
                    <div>
                        <p className="font-bold">{stats.managementDecision}</p>
                        <p className="text-xs text-muted-foreground">Management Decision</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <div>
                        <p className="font-bold">{stats.tidakDiadop}</p>
                        <p className="text-xs text-muted-foreground">Tidak Diadop</p>
                    </div>
                </div>
            </div>
        </div>

        <div>
            <p className="text-base font-semibold mb-3">Subject Status</p>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                 <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                        <p className="font-bold">{stats.standard}</p>
                        <p className="text-xs text-muted-foreground">Standard</p>
                    </div>
                </div>
                 <div className="flex items-center gap-3">
                    <HelpCircle className="h-5 w-5 text-gray-500" />
                    <div>
                        <p className="font-bold">{stats.recommendation}</p>
                        <p className="text-xs text-muted-foreground">Recommendation</p>
                    </div>
                </div>
             </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
