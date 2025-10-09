
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowRight, BarChart, FileSearch, Gavel, ShieldQuestion, FileWarning, Search, Info } from 'lucide-react';
import Link from 'next/link';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import type { AccidentIncidentRecord, KnktReport, TindakLanjutDgcaRecord, TindakLanjutRecord, LawEnforcementRecord, PemeriksaanRecord } from '@/lib/types';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type RsiModule = {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  collectionName: keyof RsiData;
  statusField: string;
  statusVariant: (status: string) => string;
};

const rsiModules: RsiModule[] = [
  {
    title: 'Data Accident & Serious Incident',
    description: 'Review and analyze accident and serious incident data.',
    icon: <FileWarning className="h-8 w-8 text-destructive" />,
    href: '/rsi/data-accident-incident',
    collectionName: 'accidentIncidentRecords',
    statusField: 'kategori',
    statusVariant: (status) => {
        if (status === 'Accident (A)') return 'destructive';
        if (status === 'Serious Incident (SI)') return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300';
        return 'secondary';
    },
  },
  {
    title: 'Pemeriksaan',
    description: 'Data Kecelakaan yang Dilaksanakan Pemeriksaan oleh DKPPU.',
    icon: <Search className="h-8 w-8 text-blue-500" />,
    href: '/rsi/pemeriksaan',
    collectionName: 'pemeriksaanRecords',
    statusField: 'kategori',
     statusVariant: (status) => {
        if (status === 'Accident (A)') return 'destructive';
        if (status === 'Serious Incident (SI)') return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300';
        return 'secondary';
    },
  },
  {
    title: 'Laporan Investigasi KNKT',
    description: 'Access and manage NTSC investigation reports.',
    icon: <FileSearch className="h-8 w-8 text-yellow-500" />,
    href: '/rsi/laporan-investigasi-knkt',
    collectionName: 'knktReports',
    statusField: 'status',
    statusVariant: (status) => {
        if (status.toLowerCase().includes('final')) return 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300';
        if (status.toLowerCase().includes('preliminary')) return 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300';
        return 'secondary';
    },
  },
  {
    title: 'Monitoring Rekomendasi KNKT',
    description: 'Track follow-ups on NTSC safety recommendations.',
    icon: <BarChart className="h-8 w-8 text-green-500" />,
    href: '/rsi/monitoring-rekomendasi',
    collectionName: 'tindakLanjutRecords',
    statusField: 'status',
     statusVariant: (status) => {
        if (status.toLowerCase().includes('final')) return 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300';
        if (status.toLowerCase().includes('draft')) return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300';
        return 'secondary';
    },
  },
  {
    title: 'Monitoring Rekomendasi ke DGCA',
    description: 'Track NTSC recommendations to the DGCA.',
    icon: <ShieldQuestion className="h-8 w-8 text-purple-500" />,
    href: '/rsi/monitoring-rekomendasi-dgca',
    collectionName: 'tindakLanjutDgcaRecords',
    statusField: 'operator',
    statusVariant: () => 'secondary',
  },
  {
    title: 'List of Law Enforcement',
    description: 'View and manage the list of law enforcement actions.',
    icon: <Gavel className="h-8 w-8 text-gray-500" />,
    href: '/rsi/law-enforcement',
    collectionName: 'lawEnforcementRecords',
    statusField: 'impositionType',
    statusVariant: (status) => {
        if (status === 'aoc') return 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300';
        if (status === 'personnel') return 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/50 dark:text-purple-300';
        if (status === 'organization') return 'bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/50 dark:text-orange-300';
        return 'secondary';
    },
  },
];

type RsiData = {
  accidentIncidentRecords: AccidentIncidentRecord[];
  pemeriksaanRecords: PemeriksaanRecord[];
  knktReports: KnktReport[];
  tindakLanjutRecords: TindakLanjutRecord[];
  tindakLanjutDgcaRecords: TindakLanjutDgcaRecord[];
  lawEnforcementRecords: LawEnforcementRecord[];
};

export default function RsiPage() {
    const [data, setData] = React.useState<Partial<RsiData>>({});
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        setIsLoading(true);
        const unsubscribes = rsiModules.map(module => {
            const coll = collection(db, module.collectionName);
            return onSnapshot(coll, (snapshot) => {
                const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setData(prevData => ({
                    ...prevData,
                    [module.collectionName]: records,
                }));
            }, (error) => {
                 console.error(`Error fetching ${module.collectionName}:`, error);
            });
        });
        
        // A simple way to set loading to false after an initial fetch period
        setTimeout(() => setIsLoading(false), 2000);

        return () => unsubscribes.forEach(unsub => unsub());
    }, []);

    return (
        <TooltipProvider>
            <main className="p-4 md:p-8">
            <div className="mb-8 p-4 rounded-lg bg-card/80 backdrop-blur-sm">
                <h1 className="text-3xl font-bold">Resolution Safety Issues (RSI) Dashboard</h1>
                <p className="text-muted-foreground">
                A centralized hub for managing and monitoring safety incidents and recommendations.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rsiModules.map((module) => {
                    const records = data[module.collectionName] || [];
                    const totalCount = records.length;
                    
                    const statusCounts = records.reduce((acc, record) => {
                        const status = (record as any)[module.statusField];
                        if (status) {
                            acc[status] = (acc[status] || 0) + 1;
                        }
                        return acc;
                    }, {} as Record<string, number>);

                    const statusArray = Object.entries(statusCounts).map(([name, count]) => ({ name, count }));

                    return (
                        <Link href={module.href} key={module.title} className="group focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg block h-full">
                            <Card className="flex flex-col h-full hover:shadow-lg hover:border-primary transition-all group-hover:bg-gradient-to-b group-hover:from-primary/10 dark:group-hover:from-primary/20">
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
                                            <AnimatedCounter endValue={totalCount} />
                                        </p>
                                    )}
                                </div>
                                {totalCount > 0 && (
                                    <div className="pt-2 space-y-1">
                                        <p className="text-xs uppercase text-muted-foreground font-semibold">Status Breakdown</p>
                                        <div className="flex flex-wrap gap-2">
                                            {statusArray.map(({ name, count }) => (
                                                <Badge key={name} className={cn(badgeVariants({ variant: module.statusVariant(name) === 'destructive' ? 'destructive' : 'default' }), module.statusVariant(name))}>
                                                    {name === 'aoc' ? 'AOC' : name}: <span className="font-bold ml-1">{count} ({((count / totalCount) * 100).toFixed(0)}%)</span>
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                </CardContent>
                                <CardFooter className="bg-muted/50 p-4 mt-auto">
                                    <div className="relative text-sm font-semibold w-full flex items-center">
                                        <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent transition-colors group-hover:text-primary">
                                            Open Module
                                        </span>
                                        <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 group-hover:w-full"></div>
                                        <ArrowRight className="ml-auto h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
                                    </div>
                                </CardFooter>
                            </Card>
                        </Link>
                    )
                })}
            </div>
            </main>
        </TooltipProvider>
    );
}
