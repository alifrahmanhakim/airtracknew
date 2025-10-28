'use client';

import * as React from 'react';
import type { RulemakingRecord } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { FileText, Clock, FileDiff, CheckCircle, BookOpen, Book, BookMarked } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';

type RulemakingAnalyticsProps = {
  records: RulemakingRecord[];
};

const STATUS_COLORS: Record<string, string> = {
    'Selesai': 'hsl(var(--chart-1))', // Green
    'Proses Evaluasi': 'hsl(var(--chart-2))', // Yellow
    'Perlu Revisi': 'hsl(var(--chart-3))', // Red
    'Pengajuan Awal': 'hsl(var(--chart-4))', // Blue
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
            try {
                const month = format(parseISO(firstStage.pengajuan.tanggal), 'yyyy-MM');
                
                if (!acc[month]) {
                    acc[month] = { month, 'Proses Evaluasi': 0, 'Perlu Revisi': 0, 'Selesai': 0, 'Pengajuan Awal': 0 };
                }

                // Increment 'Pengajuan Awal'
                if (firstStage.pengajuan.keteranganPengajuan?.toLowerCase().includes('pengajuan awal')) {
                    acc[month]['Pengajuan Awal']++;
                }

                const lastStage = record.stages[record.stages.length - 1];
                if (lastStage) {
                    const lastStatusDesc = lastStage.status.deskripsi.toLowerCase();
                    if (lastStatusDesc.includes('selesai')) {
                         acc[month]['Selesai']++;
                    } else if (lastStatusDesc.includes('dikembalikan')) {
                        acc[month]['Perlu Revisi']++;
                    } else {
                       acc[month]['Proses Evaluasi']++;
                    }
                }

            } catch (e) {
                // Ignore records with invalid date formats
            }
        }
        return acc;
    }, {} as Record<string, { month: string; 'Proses Evaluasi': number; 'Perlu Revisi': number; 'Selesai': number; 'Pengajuan Awal': number; }>);
    
    const monthlyCreationData = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));

    const pengajuanAwalCount = records.filter(r => r.stages?.[0]?.pengajuan?.keteranganPengajuan?.toLowerCase().includes('pengajuan awal')).length;

    return { 
        total, 
        prosesEvaluasi, 
        pengembalian, 
        selesai,
        monthlyCreationData,
        kategoriCounts,
        pengajuanAwalCount,
    };
  }, [records]);

  const chartConfig = {
      'Selesai': { label: `Selesai (${stats.selesai})`, color: STATUS_COLORS['Selesai'] },
      'Proses Evaluasi': { label: `Proses Evaluasi (${stats.prosesEvaluasi})`, color: STATUS_COLORS['Proses Evaluasi'] },
      'Perlu Revisi': { label: `Perlu Revisi (${stats.pengembalian})`, color: STATUS_COLORS['Perlu Revisi'] },
      'Pengajuan Awal': { label: `Pengajuan Awal (${stats.pengajuanAwalCount})`, color: STATUS_COLORS['Pengajuan Awal'] },
  };

  if (records.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground bg-muted/50 rounded-lg">
        <Info className="mx-auto h-8 w-8 mb-2" />
        <p className="font-semibold">No Rulemaking Records Found</p>
        <p className="text-sm">Add records to see analytics.</p>
      </div>
    );
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
            <CardTitle>Timeline Pengajuan Usulan by Status</CardTitle>
            <CardDescription>Jumlah usulan baru yang dibuat setiap bulan, dipecah berdasarkan status.</CardDescription>
        </CardHeader>
        <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
                 <ResponsiveContainer>
                    <AreaChart data={stats.monthlyCreationData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => format(parseISO(value), 'MMM yyyy')}
                        />
                        <YAxis allowDecimals={false}/>
                        <Tooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <defs>
                             <linearGradient id="fillPengajuanAwal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={STATUS_COLORS['Pengajuan Awal']} stopOpacity={0.8}/>
                                <stop offset="95%" stopColor={STATUS_COLORS['Pengajuan Awal']} stopOpacity={0.1}/>
                            </linearGradient>
                            <linearGradient id="fillSelesai" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={STATUS_COLORS['Selesai']} stopOpacity={0.8}/>
                                <stop offset="95%" stopColor={STATUS_COLORS['Selesai']} stopOpacity={0.1}/>
                            </linearGradient>
                            <linearGradient id="fillPerluRevisi" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={STATUS_COLORS['Perlu Revisi']} stopOpacity={0.8}/>
                                <stop offset="95%" stopColor={STATUS_COLORS['Perlu Revisi']} stopOpacity={0.1}/>
                            </linearGradient>
                            <linearGradient id="fillProsesEvaluasi" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={STATUS_COLORS['Proses Evaluasi']} stopOpacity={0.8}/>
                                <stop offset="95%" stopColor={STATUS_COLORS['Proses Evaluasi']} stopOpacity={0.1}/>
                            </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="Pengajuan Awal" stroke={STATUS_COLORS['Pengajuan Awal']} fill="url(#fillPengajuanAwal)" />
                        <Area type="monotone" dataKey="Selesai" stroke={STATUS_COLORS['Selesai']} fill="url(#fillSelesai)" />
                        <Area type="monotone" dataKey="Perlu Revisi" stroke={STATUS_COLORS['Perlu Revisi']} fill="url(#fillPerluRevisi)" />
                        <Area type="monotone" dataKey="Proses Evaluasi" stroke={STATUS_COLORS['Proses Evaluasi']} fill="url(#fillProsesEvaluasi)" />
                    </AreaChart>
                </ResponsiveContainer>
            </ChartContainer>
        </CardContent>
    </Card>
    </>
  );
}
