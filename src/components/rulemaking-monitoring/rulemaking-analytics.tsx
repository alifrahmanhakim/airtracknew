
'use client';

import * as React from 'react';
import type { RulemakingRecord } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { FileText, Clock, FileDiff, CheckCircle, BookOpen, Book, BookMarked } from 'lucide-react';
import { LineChart, Line, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

type RulemakingAnalyticsProps = {
  records: RulemakingRecord[];
};

const STATUS_COLORS: Record<string, string> = {
    'Proses Evaluasi': 'hsl(var(--chart-2))', // Yellow
    'Perlu Revisi': 'hsl(var(--chart-3))', // Red
    'Selesai': 'hsl(var(--chart-1))', // Green
};


export function RulemakingAnalytics({ records }: RulemakingAnalyticsProps) {
  const stats = React.useMemo(() => {
    const total = records.length;
    let prosesEvaluasi = 0;
    let pengembalian = 0;
    let selesai = 0;
    const kategoriCounts = {
        'PKPS/CASR': 0,
        'SI': 0,
        'AC': 0,
    };

    records.forEach(r => {
        kategoriCounts[r.kategori]++;
        const lastStage = r.stages && r.stages.length > 0 ? r.stages[r.stages.length - 1] : null;
        if (lastStage) {
            const lastStatusDesc = lastStage.status.deskripsi.toLowerCase();
            if (lastStatusDesc.includes('selesai')) {
                selesai++;
            } else if (lastStatusDesc.includes('dikembalikan')) {
                pengembalian++;
            } else {
                prosesEvaluasi++;
            }
        }
    });
    
    const monthlyData = records.reduce((acc, record) => {
        const firstStage = record.stages && record.stages.length > 0 ? record.stages[0] : null;
        if (firstStage?.pengajuan.tanggal) {
            const month = format(parseISO(firstStage.pengajuan.tanggal), 'yyyy-MM');
            const lastStage = record.stages[record.stages.length - 1];
            let status: 'Proses Evaluasi' | 'Perlu Revisi' | 'Selesai' = 'Proses Evaluasi';
            if (lastStage) {
                const lastStatusDesc = lastStage.status.deskripsi.toLowerCase();
                 if (lastStatusDesc.includes('selesai')) {
                    status = 'Selesai';
                } else if (lastStatusDesc.includes('dikembalikan')) {
                    status = 'Perlu Revisi';
                }
            }

            if (!acc[month]) {
                acc[month] = { month, 'Proses Evaluasi': 0, 'Perlu Revisi': 0, 'Selesai': 0, 'Total': 0 };
            }
            acc[month][status]++;
            acc[month]['Total']++;
        }
        return acc;
    }, {} as Record<string, { month: string; 'Proses Evaluasi': number; 'Perlu Revisi': number; 'Selesai': number; 'Total': number }>);
    
    const monthlyCreationData = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));


    return { 
        total, 
        prosesEvaluasi, 
        pengembalian, 
        selesai,
        monthlyCreationData,
        kategoriCounts,
    };
  }, [records]);

  const yearChartConfig = {
      'Proses Evaluasi': { label: `Proses Evaluasi`, color: STATUS_COLORS['Proses Evaluasi'] },
      'Perlu Revisi': { label: `Perlu Revisi`, color: STATUS_COLORS['Perlu Revisi'] },
      'Selesai': { label: `Selesai`, color: STATUS_COLORS['Selesai'] },
      'Total': { label: `Total`, color: 'hsl(var(--primary))' }
  }

  return (
    <>
    <div className="mb-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Usulan</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold"><AnimatedCounter endValue={stats.total} /></div>
          <p className="text-xs text-muted-foreground">Total semua usulan yang tercatat</p>
        </CardContent>
      </Card>
      <Card className="border-blue-500/50 bg-blue-50 dark:bg-blue-900/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-300">PKPS/CASR</CardTitle>
          <BookMarked className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-800 dark:text-blue-300"><AnimatedCounter endValue={stats.kategoriCounts['PKPS/CASR']} /></div>
        </CardContent>
      </Card>
      <Card className="border-purple-500/50 bg-purple-50 dark:bg-purple-900/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-300">SI</CardTitle>
          <Book className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-800 dark:text-purple-300"><AnimatedCounter endValue={stats.kategoriCounts['SI']} /></div>
        </CardContent>
      </Card>
       <Card className="border-pink-500/50 bg-pink-50 dark:bg-pink-900/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-pink-800 dark:text-pink-300">AC</CardTitle>
          <BookOpen className="h-4 w-4 text-pink-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-pink-800 dark:text-pink-300"><AnimatedCounter endValue={stats.kategoriCounts['AC']} /></div>
        </CardContent>
      </Card>
    </div>
     <div className="mb-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
       <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Proses Evaluasi</CardTitle>
          <Clock className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-500"><AnimatedCounter endValue={stats.prosesEvaluasi} /></div>
          <p className="text-xs text-muted-foreground">Usulan dalam tahap evaluasi</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Perlu Revisi</CardTitle>
          <FileDiff className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500"><AnimatedCounter endValue={stats.pengembalian} /></div>
           <p className="text-xs text-muted-foreground">Usulan dikembalikan untuk direvisi</p>
        </CardContent>
      </Card>
       <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Selesai</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-500"><AnimatedCounter endValue={stats.selesai} /></div>
          <p className="text-xs text-muted-foreground">Usulan yang telah selesai diproses</p>
        </CardContent>
      </Card>
    </div>
    <Card className="mb-4">
        <CardHeader>
            <CardTitle>Timeline Pengajuan Usulan</CardTitle>
            <CardDescription>Jumlah usulan baru yang dibuat setiap bulan.</CardDescription>
        </CardHeader>
        <CardContent>
            <ChartContainer config={yearChartConfig} className="h-[300px] w-full">
                 <ResponsiveContainer>
                    <LineChart data={stats.monthlyCreationData}>
                        <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => format(parseISO(value), 'MMM yyyy')}
                        />
                        <YAxis allowDecimals={false}/>
                        <Tooltip content={<ChartTooltipContent />} />
                        <Area type="monotone" dataKey="Total" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorTotal)" />
                        <Line type="monotone" dataKey="Total" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </ChartContainer>
        </CardContent>
    </Card>
    </>
  );
}
