
'use client';

import { useState, useMemo } from 'react';
import { CcefodForm } from '@/components/ccefod-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CcefodRecordsTable } from '@/components/ccefod-records-table';
import type { CcefodFormValues } from '@/components/ccefod-form';
import { CcefodAnalyticsDashboard } from '@/components/ccefod-analytics-dashboard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function CcefodPage() {
  const [records, setRecords] = useState<CcefodFormValues[]>([]);
  const [analyticsAnnexFilter, setAnalyticsAnnexFilter] = useState('all');

  const handleFormSubmit = (data: CcefodFormValues) => {
    setRecords(prevRecords => [...prevRecords, data]);
  };
  
  const annexOptions = useMemo(() => {
    const annexes = new Set(records.map(r => r.annex).filter(Boolean));
    return ['all', ...Array.from(annexes)];
  }, [records]);

  const filteredAnalyticsRecords = useMemo(() => {
    if (analyticsAnnexFilter === 'all') {
      return records;
    }
    return records.filter(record => record.annex === analyticsAnnexFilter);
  }, [records, analyticsAnnexFilter]);


  return (
    <div className="p-4 md:p-8">
       <Tabs defaultValue="form" className="w-full">
        <div className="flex justify-between items-start mb-4">
            <div>
                <h1 className="text-3xl font-bold">CC/EFOD Monitoring</h1>
                <p className="text-muted-foreground">
                    Formulir untuk memonitor dan mengelola Compliance Checklist dan Electronic Filing of Differences.
                </p>
            </div>
            <TabsList>
                <TabsTrigger value="form">Input Form</TabsTrigger>
                <TabsTrigger value="records">Records</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
        </div>
        <TabsContent value="form">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>Compliance Checklist (CC) / EFOD Form</CardTitle>
              <CardDescription>
                Isi formulir di bawah ini untuk menambahkan data baru.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CcefodForm onFormSubmit={handleFormSubmit} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="records">
           <Card>
            <CardHeader>
              <CardTitle>CC/EFOD Records</CardTitle>
              <CardDescription>
                Berikut adalah daftar data yang telah dimasukkan.
              </CardDescription>
            </CardHeader>
            <CardContent>
                <CcefodRecordsTable records={records} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="analytics">
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <CardTitle>CC/EFOD Analytics Dashboard</CardTitle>
                            <CardDescription>
                                Visualisasi data dari catatan yang telah dimasukkan.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="annex-filter" className="text-sm font-medium">Filter by Annex</Label>
                            <Select value={analyticsAnnexFilter} onValueChange={setAnalyticsAnnexFilter}>
                                <SelectTrigger id="annex-filter" className="w-full sm:w-[280px]">
                                    <SelectValue placeholder="Filter by Annex..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {annexOptions.map(annex => (
                                        <SelectItem key={annex} value={annex}>
                                            {annex === 'all' ? 'All Annexes' : annex}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <CcefodAnalyticsDashboard records={filteredAnalyticsRecords} />
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
