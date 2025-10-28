
'use client';

import * as React from 'react';
import type { RulemakingRecord } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { FileText, Clock, FileDiff, CheckCircle } from 'lucide-react';

type RulemakingAnalyticsProps = {
  records: RulemakingRecord[];
};

export function RulemakingAnalytics({ records }: RulemakingAnalyticsProps) {
  const stats = React.useMemo(() => {
    const total = records.length;
    const prosesEvaluasi = records.filter(r => r.status.deskripsi.toLowerCase().includes('proses evaluasi')).length;
    const pengembalian = records.filter(r => r.status.deskripsi.toLowerCase().includes('pengembalian')).length;
    const selesai = total - prosesEvaluasi - pengembalian; // Placeholder logic
    return { total, prosesEvaluasi, pengembalian, selesai };
  }, [records]);

  return (
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Proses Evaluasi</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold"><AnimatedCounter endValue={stats.prosesEvaluasi} /></div>
          <p className="text-xs text-muted-foreground">Usulan dalam tahap evaluasi</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Perlu Revisi</CardTitle>
          <FileDiff className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold"><AnimatedCounter endValue={stats.pengembalian} /></div>
           <p className="text-xs text-muted-foreground">Usulan dikembalikan untuk direvisi</p>
        </CardContent>
      </Card>
       <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Selesai</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold"><AnimatedCounter endValue={stats.selesai} /></div>
          <p className="text-xs text-muted-foreground">Usulan yang telah selesai diproses</p>
        </CardContent>
      </Card>
    </div>
  );
}
