
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowRight, BarChart, FileSearch, Gavel, ShieldQuestion, FileWarning, Search, Info, Users, AlertTriangle, Plane, BookCheck, BookOpenCheck } from 'lucide-react';
import Link from 'next/link';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import type { AccidentIncidentRecord, KnktReport, TindakLanjutDgcaRecord, TindakLanjutRecord, LawEnforcementRecord, PemeriksaanRecord } from '@/lib/types';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getYear, parseISO, isToday, isValid } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { LineChart, Line, CartesianGrid, XAxis, ResponsiveContainer } from 'recharts';
import { Button } from '../ui/button';


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
    icon: <BookCheck className="h-8 w-8 text-green-500" />,
    href: '/rsi/monitoring-rekomendasi',
    collectionName: 'tindakLanjutRecords',
    statusField: 'status',
     statusVariant: (status) => {
        if (status.toLowerCase().includes('final')) return 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300';
        if (status.toLowerCase().includes('draft')) return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/50 dark:text-green-300';
        return 'secondary';
    },
  },
  {
    title: 'Monitoring Rekomendasi ke DGCA',
    description: 'Track NTSC recommendations to the DGCA.',
    icon: <BookOpenCheck className="h-8 w-8 text-purple-500" />,
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

const parseCasualties = (casualtyString: string | undefined): number => {
    if (!casualtyString || casualtyString.toLowerCase() === 'tidak ada') {
      return 0;
    }
    const match = casualtyString.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
};

const getDateFieldForCollection = (collectionName: keyof RsiData): string => {
    switch (collectionName) {
        case 'knktReports': return 'tanggal_diterbitkan';
        case 'tindakLanjutDgcaRecords': return 'tanggalKejadian';
        case 'tindakLanjutRecords': return 'tanggalKejadian';
        case 'lawEnforcementRecords': return 'createdAt';
        default: return 'tanggal';
    }
};

export default function RsiPage() {
    const [data, setData] = React.useState<Partial<RsiData>>({});
    const [isLoading, setIsLoading] = React.useState(true);
    const [yearFilter, setYearFilter] = React.useState<string>('all');
    const [expandedCards, setExpandedCards] = React.useState<Record<string, boolean>>({});

    const toggleCardExpansion = (cardTitle: string) => {
        setExpandedCards(prev => ({ ...prev, [cardTitle]: !prev[cardTitle] }));
    }

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
        
        setTimeout(() => setIsLoading(false), 2000);

        return () => unsubscribes.forEach(unsub => unsub());
    }, []);

    const yearOptions = React.useMemo(() => {
        const allYears = new Set<number>();
        rsiModules.forEach(module => {
            const records = data[module.collectionName] || [];
            const dateField = getDateFieldForCollection(module.collectionName);
            records.forEach((record: any) => {
                const dateString = record[dateField];
                if (dateString && typeof dateString === 'string') {
                    try {
                        const parsedDate = parseISO(dateString);
                        if(isValid(parsedDate)) {
                            allYears.add(getYear(parsedDate));
                        }
                    } catch (e) {
                        // ignore invalid date
                    }
                } else if (dateString && dateString.toDate) { // For Firestore Timestamps
                    allYears.add(getYear(dateString.toDate()));
                }
            });
        });
        const validYears = Array.from(allYears).filter(year => !isNaN(year));
        return ['all', ...validYears.sort((a,b) => b-a)];
    }, [data]);

    const dashboardStats = React.useMemo(() => {
        const filterByYear = (records: any[] | undefined, collectionName: keyof RsiData) => {
            if (!records) return [];
            if (yearFilter === 'all') return records;
            
            const dateField = getDateFieldForCollection(collectionName);
            
            return records.filter((record: any) => {
                const dateString = record[dateField];
                if (!dateString) return false;
                
                try {
                    let recordYear;
                    if (typeof dateString === 'string') {
                        const parsedDate = parseISO(dateString);
                        if(isValid(parsedDate)) {
                            recordYear = getYear(parsedDate);
                        } else {
                            return false;
                        }
                    } else if (dateString.toDate) { // Firestore Timestamp
                        recordYear = getYear(dateString.toDate());
                    }
                    return recordYear === parseInt(yearFilter);
                } catch(e) {
                    return false;
                }
            });
        };

        const filteredAccidents = filterByYear(data.accidentIncidentRecords, 'accidentIncidentRecords') as AccidentIncidentRecord[];
        const totalIncidents = filteredAccidents.length;
        const totalReports = filterByYear(data.knktReports, 'knktReports').length;
        const totalSanctions = filterByYear(data.lawEnforcementRecords, 'lawEnforcementRecords').length;
        const totalCasualties = filteredAccidents.reduce((sum, r) => sum + parseCasualties(r.korbanJiwa), 0);
        
        const trendData = (data.accidentIncidentRecords || []).reduce((acc, record) => {
            if (!record.tanggal || !isValid(parseISO(record.tanggal))) return acc;
            const year = getYear(parseISO(record.tanggal));
            if (!acc[year]) {
                acc[year] = { year, A: 0, SI: 0, Casualties: 0 };
            }
            if (record.kategori === 'Accident (A)') {
                acc[year].A++;
            }
            if (record.kategori === 'Serious Incident (SI)') {
                acc[year].SI++;
            }
            acc[year].Casualties += parseCasualties(record.korbanJiwa);
            return acc;
        }, {} as Record<number, { year: number, A: number, SI: number, Casualties: number }>);

        const sortedTrendData = Object.values(trendData).sort((a, b) => a.year - b.year);

        return {
            totalIncidents,
            totalReports,
            totalSanctions,
            totalCasualties,
            incidentTrend: sortedTrendData,
        }
    }, [data, yearFilter]);

    return (
        <TooltipProvider>
            <main className="p-4 md:p-8">
            <div className="mb-8 p-4 rounded-lg bg-card/80 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold">Resolution Safety Issues (RSI) Dashboard</h1>
                        <p className="text-muted-foreground">
                        A centralized hub for managing and monitoring safety incidents and recommendations.
                        </p>
                    </div>
                    <div className="w-full sm:w-auto">
                        <Select value={yearFilter} onValueChange={setYearFilter}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Filter by year..." />
                            </SelectTrigger>
                            <SelectContent>
                                {yearOptions.map(year => (
                                    <SelectItem key={String(year)} value={String(year)}>
                                        {year === 'all' ? 'All Years' : String(year)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <Card className="mb-6 bg-gradient-to-r from-primary/10 via-background to-background overflow-hidden">
                <div className="flex flex-col lg:flex-row">
                    <div className="flex-1 p-6">
                        <CardHeader className="p-0 mb-6">
                            <CardTitle>Overall Summary</CardTitle>
                            <CardDescription className="text-foreground">
                                Key metrics from all records.
                                {yearFilter !== 'all' ? ` (Period: ${yearFilter})` : ' (All Time)'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="flex items-center gap-4 p-4 rounded-lg bg-background/50">
                                    <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                                    <div>
                                        <p className="text-3xl font-bold"><AnimatedCounter endValue={dashboardStats.totalIncidents} /></p>
                                        <p className="text-sm text-muted-foreground">Total Incidents</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-lg bg-background/50">
                                    <FileSearch className="h-8 w-8 text-yellow-500" />
                                    <div>
                                        <p className="text-3xl font-bold"><AnimatedCounter endValue={dashboardStats.totalReports} /></p>
                                        <p className="text-sm text-muted-foreground">Total KNKT Reports</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-lg bg-background/50">
                                    <Gavel className="h-8 w-8 text-gray-500" />
                                    <div>
                                        <p className="text-3xl font-bold"><AnimatedCounter endValue={dashboardStats.totalSanctions} /></p>
                                        <p className="text-sm text-muted-foreground">Total Law Enforcements</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-lg bg-background/50">
                                    <Users className="h-8 w-8 text-red-500" />
                                    <div>
                                        <p className="text-3xl font-bold"><AnimatedCounter endValue={dashboardStats.totalCasualties} /></p>
                                        <p className="text-sm text-muted-foreground">Total Casualties</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </div>
                    <div className="relative w-full lg:w-1/3 min-h-[200px] lg:min-h-0">
                        <Image
                            src="https://ik.imagekit.io/avmxsiusm/Gemini_Generated_Image_4unr7i4unr7i4unr.png"
                            alt="RSI Summary Illustration"
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 100vw, 33vw"
                        />
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rsiModules.map((module) => {
                    const dateField = getDateFieldForCollection(module.collectionName);
                    
                    const filteredRecords = (data[module.collectionName] || []).filter((record: any) => {
                        if (yearFilter === 'all') return true;
                        const dateString = record[dateField];
                        if (dateString && typeof dateString === 'string') {
                             try {
                                const parsedDate = parseISO(dateString);
                                if(isValid(parsedDate)) {
                                    return getYear(parsedDate) === parseInt(yearFilter);
                                }
                            } catch (e) {
                                return false;
                            }
                        }
                         if (dateString && dateString.toDate) { // For Firestore Timestamps
                            return getYear(dateString.toDate()) === parseInt(yearFilter);
                        }
                        return false;
                    });
                    
                    const totalCount = filteredRecords.length;
                    
                    const statusCounts = filteredRecords.reduce((acc, record) => {
                        const status = (record as any)[module.statusField];
                        if (status) {
                            acc[status] = (acc[status] || 0) + 1;
                        }
                        return acc;
                    }, {} as Record<string, number>);

                    const statusArray = Object.entries(statusCounts)
                        .map(([name, count]) => ({ name, count }))
                        .sort((a, b) => b.count - a.count);

                    const totalCasualties = module.collectionName === 'accidentIncidentRecords'
                        ? (filteredRecords as AccidentIncidentRecord[]).reduce((sum, r) => sum + parseCasualties(r.korbanJiwa), 0)
                        : null;
                    
                    const chartConfig = {
                        A: { label: "Accident", color: "hsl(var(--chart-3))" },
                        SI: { label: "S. Incident", color: "hsl(var(--chart-2))" },
                        Casualties: { label: "Casualties", color: "hsl(var(--destructive))" },
                    };

                    const isExpanded = expandedCards[module.title] || false;
                    const itemsToShow = isExpanded ? statusArray : statusArray.slice(0, 5);


                    return (
                        <Link href={module.href} key={module.title} className="group focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg block h-full">
                            <Card className="flex flex-col h-full hover:shadow-lg hover:border-primary transition-all group-hover:bg-gradient-to-b group-hover:from-primary/10 dark:group-hover:from-primary/20">
                                <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
                                {module.icon}
                                <CardTitle>{module.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-grow flex flex-col space-y-4">
                                <p className="text-sm text-muted-foreground h-10 line-clamp-2">
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
                                {module.collectionName === 'accidentIncidentRecords' ? (
                                    <div className="pt-2 flex-grow flex flex-col justify-end">
                                      <ChartContainer config={chartConfig} className="h-[60px] w-full">
                                        <ResponsiveContainer>
                                            <LineChart data={dashboardStats.incidentTrend} margin={{ top: 5, right: 10, left: -30, bottom: 0 }}>
                                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                                                <XAxis dataKey="year" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                                <ChartTooltip content={<ChartTooltipContent />} />
                                                <Line type="monotone" dataKey="A" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
                                                <Line type="monotone" dataKey="SI" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                                                <Line type="monotone" dataKey="Casualties" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                      </ChartContainer>
                                    </div>
                                ) : (totalCount > 0 || totalCasualties !== null) && (
                                    <div className="pt-2 space-y-3">
                                        <p className="text-xs uppercase text-muted-foreground font-semibold">Breakdown</p>
                                        <div className="space-y-1">
                                            {totalCasualties !== null && (
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    <Badge variant="destructive">
                                                        Total Casualties: <span className="font-bold ml-1">{totalCasualties}</span>
                                                    </Badge>
                                                </div>
                                            )}
                                            {itemsToShow.map(({ name, count }) => (
                                                <div key={name} className="flex items-center gap-2">
                                                    <div className={cn("h-2 w-2 rounded-full", module.statusVariant(name) === 'destructive' ? 'bg-destructive' : 'bg-secondary-foreground')}></div>
                                                    <Badge variant={module.statusVariant(name) === 'destructive' ? 'destructive' : 'default'} className={cn(module.statusVariant(name))}>
                                                        {name === 'aoc' ? 'AOC' : name}: <span className="font-bold ml-1">{count} ({totalCount > 0 ? ((count / totalCount) * 100).toFixed(0) : 0}%)</span>
                                                    </Badge>
                                                </div>
                                            ))}
                                            {statusArray.length > 5 && (
                                                <Button
                                                    variant="link"
                                                    className="text-xs h-auto p-0"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        toggleCardExpansion(module.title);
                                                    }}
                                                >
                                                    {isExpanded ? 'Show less' : `Show ${statusArray.length - 5} more`}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}
                                </CardContent>
                                <CardFooter className="bg-muted/50 p-4 mt-auto">
                                    <div className="relative text-sm font-semibold w-full flex items-center">
                                        <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent transition-colors group-hover:text-primary">
                                            Open Module
                                        </span>
                                        <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300 group-hover:w-full"></div>
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
