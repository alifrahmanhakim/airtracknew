
'use client';

import { useState } from 'react';
import { CcefodForm } from '@/components/ccefod-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CcefodRecordsTable } from '@/components/ccefod-records-table';
import type { CcefodFormValues } from '@/components/ccefod-form';

export default function CcefodPage() {
  const [records, setRecords] = useState<CcefodFormValues[]>([]);

  const handleFormSubmit = (data: CcefodFormValues) => {
    setRecords(prevRecords => [...prevRecords, data]);
  };

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
      </Tabs>
    </div>
  );
}
