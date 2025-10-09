
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowRight, BarChart, FileSearch, Gavel, ShieldQuestion, FileWarning, Search } from 'lucide-react';
import Link from 'next/link';
import { collection, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedCounter } from '@/components/ui/animated-counter';

const rsiModules = [
  {
    title: 'Data Accident & Serious Incident',
    description: 'Review and analyze accident and serious incident data.',
    icon: <FileWarning className="h-8 w-8 text-destructive" />,
    href: '/rsi/data-accident-incident',
    collectionName: 'accidentIncidentRecords'
  },
  {
    title: 'Pemeriksaan',
    description: 'Data Kecelakaan yang Dilaksanakan Pemeriksaan oleh DKPPU.',
    icon: <Search className="h-8 w-8 text-blue-500" />,
    href: '/rsi/pemeriksaan',
    collectionName: 'pemeriksaanRecords'
  },
  {
    title: 'Laporan Investigasi KNKT',
    description: 'Access and manage NTSC investigation reports.',
    icon: <FileSearch className="h-8 w-8 text-yellow-500" />,
    href: '/rsi/laporan-investigasi-knkt',
    collectionName: 'knktReports'
  },
  {
    title: 'Monitoring Rekomendasi KNKT',
    description: 'Track follow-ups on NTSC safety recommendations.',
    icon: <BarChart className="h-8 w-8 text-green-500" />,
    href: '/rsi/monitoring-rekomendasi',
    collectionName: 'tindakLanjutRecords'
  },
  {
    title: 'Monitoring Rekomendasi ke DGCA',
    description: 'Track NTSC recommendations to the DGCA.',
    icon: <ShieldQuestion className="h-8 w-8 text-purple-500" />,
    href: '/rsi/monitoring-rekomendasi-dgca',
    collectionName: 'tindakLanjutDgcaRecords'
  },
  {
    title: 'List of Law Enforcement',
    description: 'View and manage the list of law enforcement actions.',
    icon: <Gavel className="h-8 w-8 text-gray-500" />,
    href: '/rsi/law-enforcement',
    collectionName: 'lawEnforcementRecords'
  },
];

type StatCounts = {
    [key: string]: number;
};

export default function RsiPage() {
    const [counts, setCounts] = React.useState<StatCounts>({});
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchCounts = async () => {
            setIsLoading(true);
            const countsData: StatCounts = {};
            try {
                for (const module of rsiModules) {
                    const coll = collection(db, module.collectionName);
                    const snapshot = await getCountFromServer(coll);
                    countsData[module.collectionName] = snapshot.data().count;
                }
                setCounts(countsData);
            } catch (error) {
                console.error("Error fetching collection counts:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCounts();
    }, []);

  return (
    <main className="p-4 md:p-8">
      <div className="mb-8 p-4 rounded-lg bg-card/80 backdrop-blur-sm">
        <h1 className="text-3xl font-bold">Resolution Safety Issues (RSI) Dashboard</h1>
        <p className="text-muted-foreground">
          A centralized hub for managing and monitoring safety incidents and recommendations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rsiModules.map((module) => (
          <Card key={module.title} className="flex flex-col hover:shadow-lg hover:border-primary transition-all hover:bg-gradient-to-b hover:from-primary/10 dark:hover:from-primary/20">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
              {module.icon}
              <CardTitle>{module.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
              <p className="text-sm text-muted-foreground h-10">
                {module.description}
              </p>
              <div className="pt-4">
                <p className="text-xs uppercase text-muted-foreground font-semibold">Total Records</p>
                {isLoading ? (
                    <Skeleton className="h-10 w-20 mt-1" />
                ) : (
                    <p className="text-4xl font-bold">
                        <AnimatedCounter endValue={counts[module.collectionName] || 0} />
                    </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="bg-muted/50 p-4 mt-auto">
                <Link href={module.href} className="group flex items-center text-sm text-primary font-semibold w-full">
                    <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-left-bottom bg-no-repeat bg-[length:0%_2px] group-hover:bg-[length:100%_2px] transition-all duration-300 ease-in-out">Open Module</span>
                    <ArrowRight className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </main>
  );
}
