
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowRight, BarChart, FileSearch, Gavel, ShieldQuestion, FileWarning, Search, Info, Users, AlertTriangle, Plane, BookCheck, BookOpenCheck, LineChart as LineChartIcon, ChevronsUpDown, Send, Pencil } from 'lucide-react';
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
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { LineChart, Line, CartesianGrid, XAxis, ResponsiveContainer, Legend, YAxis, PieChart, Pie, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EditTindakLanjutRecordDialog } from '@/components/rsi/edit-tindak-lanjut-dialog';
import { OperatorFollowUpDialog } from '@/components/rsi/operator-follow-up-dialog';
import { AppLayout } from '@/components/app-layout-component';
import { Input } from '@/components/ui/input';
import { Highlight } from '@/components/ui/highlight';


type RsiModule = {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  collectionName: keyof RsiData;
  statusField: string;
  statusVariant: (status: string) => string;
};

const CHART_COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
];

const rsiModules: RsiModule[] = [
  {
    title: 'Data Accident & Serious Incident',
    description: 'Review and analyze accident and serious incident data.',
    icon: <FileWarning className="h-8 w-8 text-destructive" />,
    href: '/rsi/data-accident-incident',
    collectionName: 'accidentIncidentRecords',
    statusField: 'kategori',
    statusVariant: (status) => {
        if (status === 'Accident (A)') return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
        if (status === 'Serious Incident (SI)') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
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
        if (status === 'Accident (A)') return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
        if (status === 'Serious Incident (SI)') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
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
        if (status.toLowerCase().includes('draft final')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300';
        if (status.toLowerCase().includes('final')) return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
        if (status.toLowerCase().includes('preliminary')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
        if (status.toLowerCase().includes('interim')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'; // Default for 'Draft'
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
        if (status.toLowerCase().includes('draft final')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300';
        if (status.toLowerCase().includes('final')) return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
        if (status.toLowerCase().includes('draft')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
        if (status.toLowerCase().includes('preliminary')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
        if (status.toLowerCase().includes('interim')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
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
        if (status === 'aoc') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
        if (status === 'personnel') return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
        if (status === 'organization') return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300';
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
        case 'pemeriksaanRecords': return 'tanggal';
        default: return 'tanggal';
    }
};

const getStatusClass = (status: string) => {
    switch (status) {
      case 'Final': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'Draft': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'Draft Final': return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      case 'Preliminary': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'Interim Statement': return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'Usulan': return 'bg-red-100 text-red-800 hover:bg-red-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

export default function RsiPage() {
    const [data, setData] = React.useState<Partial<RsiData>>({});
    const [isLoading, setIsLoading] = React.useState(true);
    const [yearFilter, setYearFilter] = React.useState<string>('all');
    const [expandedCards, setExpandedCards] = React.useState<Record<string, boolean>>({});
    const [chartYearScope, setChartYearScope] = React.useState<string>('all');
    const [isAwaitingFollowUpExpanded, setIsAwaitingFollowUpExpanded] = React.useState(false);
    const [isOperatorBreakdownExpanded, setIsOperatorBreakdownExpanded] = React.useState(false);
    const [recordToEdit, setRecordToEdit] = React.useState<TindakLanjutRecord | null>(null);
    const [selectedOperator, setSelectedOperator] = React.useState<string | null>(null);
    const [awaitingFollowUpSearch, setAwaitingFollowUpSearch] = React.useState('');

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
    
     const handleRecordUpdate = (updatedRecord: TindakLanjutRecord) => {
        setData(prevData => {
            if (!prevData.tindakLanjutRecords) return prevData;
            const newRecords = prevData.tindakLanjutRecords.map(r => 
                r.id === updatedRecord.id ? updatedRecord : r
            );
            return { ...prevData, tindakLanjutRecords: newRecords };
        });
        setRecordToEdit(null);
    };

    const yearOptions = React.useMemo(() => {
        const allYears = new Set<number>();
        rsiModules.forEach(module => {
            const records = data[module.collectionName] || [];
            let dateField: string;

            if (module.collectionName === 'lawEnforcementRecords') {
                dateField = 'dateLetter'; // Special handling for this collection
            } else {
                dateField = getDateFieldForCollection(module.collectionName);
            }

            records.forEach((record: any) => {
                let dateStrings: string[] = [];

                if (module.collectionName === 'lawEnforcementRecords') {
                    dateStrings = (record.references || []).map((ref: any) => ref.dateLetter).filter(Boolean);
                } else {
                    const dateString = record[dateField];
                    if (dateString) {
                        dateStrings.push(dateString);
                    }
                }
                
                dateStrings.forEach(dateString => {
                    if (dateString && typeof dateString === 'string') {
                        try {
                            const parsedDate = parseISO(dateString);
                            if(isValid(parsedDate)) {
                                allYears.add(getYear(parsedDate));
                            }
                        } catch (e) {
                            // ignore invalid date
                        }
                    } else if (dateString && (dateString as any).toDate) { // For Firestore Timestamps
                        allYears.add(getYear((dateString as any).toDate()));
                    }
                });
            });
        });
        const validYears = Array.from(allYears).filter(year => !isNaN(year));
        return ['all', ...validYears.sort((a,b) => b-a)];
    }, [data]);

    const dashboardStats = React.useMemo(() => {
        const filterByYear = (records: any[] | undefined, collectionName: keyof RsiData) => {
            if (!records) return [];
            if (yearFilter === 'all') return records;
            
            let dateField: string;
             if (collectionName === 'lawEnforcementRecords') {
                dateField = 'dateLetter';
            } else {
                dateField = getDateFieldForCollection(collectionName);
            }
            
            return records.filter((record: any) => {
                let dateStrings: string[] = [];
                if (collectionName === 'lawEnforcementRecords') {
                    dateStrings = (record.references || []).map((ref: any) => ref.dateLetter).filter(Boolean);
                } else {
                     const dateString = record[dateField];
                    if (dateString) dateStrings.push(dateString);
                }

                return dateStrings.some(dateString => {
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
                        } else if ((dateString as any).toDate) { // Firestore Timestamp
                            recordYear = getYear((dateString as any).toDate());
                        }
                        return recordYear === parseInt(yearFilter);
                    } catch(e) {
                        return false;
                    }
                });
            });
        };

        const filteredAccidents = filterByYear(data.accidentIncidentRecords, 'accidentIncidentRecords') as AccidentIncidentRecord[];
        const totalIncidents = filteredAccidents.length;
        const totalAccidents = filteredAccidents.filter(r => r.kategori === 'Accident (A)').length;
        const totalSeriousIncidents = totalIncidents - totalAccidents;
        const totalReports = filterByYear(data.knktReports, 'knktReports').length;
        const filteredLawEnforcements = filterByYear(data.lawEnforcementRecords, 'lawEnforcementRecords');
        const totalSanctions = filteredLawEnforcements.length;
        const totalCasualties = filteredAccidents.reduce((sum, r) => sum + parseCasualties(r.korbanJiwa), 0);
        const allTindakLanjut = filterByYear(data.tindakLanjutRecords, 'tindakLanjutRecords') as TindakLanjutRecord[];
        const totalRekomendasiKnkt = allTindakLanjut.length;
        const totalRekomendasiDgca = filterByYear(data.tindakLanjutDgcaRecords, 'tindakLanjutDgcaRecords').length;
        
        const openOperatorFollowUps = allTindakLanjut.filter(r => !r.tindakLanjutOperator || r.tindakLanjutOperator.trim() === '-');

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
        
        const sanctionTypeCounts = filteredLawEnforcements.reduce((acc, record) => {
            (record.references || []).forEach(ref => {
                if(ref.sanctionType) {
                    acc[ref.sanctionType] = (acc[ref.sanctionType] || 0) + 1;
                }
            })
            return acc;
        }, {} as Record<string, number>);

        const totalSanctionTypes = Object.values(sanctionTypeCounts).reduce((a, b) => a + b, 0);

        const sanctionTypesBreakdown = Object.entries(sanctionTypeCounts)
            .map(([name, count]) => ({
                name,
                count,
                className: 'bg-gray-100 text-gray-800',
                percentage: totalSanctionTypes > 0 ? (count / totalSanctionTypes) * 100 : 0
            }))
            .sort((a,b) => b.count - a.count);
            
        const operatorFollowUpCompleted = totalRekomendasiKnkt - openOperatorFollowUps.length;
        const operatorFollowUpPercentage = totalRekomendasiKnkt > 0 ? (operatorFollowUpCompleted / totalRekomendasiKnkt) * 100 : 0;
        
        const openFollowUpsByOperator = openOperatorFollowUps.reduce((acc, record) => {
            const operators = Array.isArray(record.penerimaRekomendasi) ? record.penerimaRekomendasi : (typeof record.penerimaRekomendasi === 'string' ? [record.penerimaRekomendasi] : []);
            operators.forEach(op => {
                if (op && op.trim() !== '' && op.trim() !== '-') {
                     acc[op] = (acc[op] || 0) + 1;
                }
            });
            return acc;
        }, {} as Record<string, number>);

        const totalPending = Object.values(openFollowUpsByOperator).reduce((a, b) => a + b, 0);

        const openFollowUpsOperatorChartData = Object.entries(openFollowUpsByOperator)
            .map(([name, value]) => ({ 
                name, 
                value,
                percentage: totalPending > 0 ? (value / totalPending) * 100 : 0,
            }))
            .sort((a,b) => b.value - a.value);


        return {
            totalIncidents,
            totalAccidents,
            totalSeriousIncidents,
            totalReports,
            totalSanctions,
            totalCasualties,
            totalRekomendasiKnkt,
            totalRekomendasiDgca,
            incidentTrend: sortedTrendData,
            sanctionTypesBreakdown,
            openOperatorFollowUps,
            operatorFollowUpPercentage,
            openFollowUpsOperatorChartData
        }
    }, [data, yearFilter]);
    
    const filteredOpenOperatorFollowUps = React.useMemo(() => {
        if (!awaitingFollowUpSearch) {
            return dashboardStats.openOperatorFollowUps;
        }
        const lowercasedSearch = awaitingFollowUpSearch.toLowerCase();
        return dashboardStats.openOperatorFollowUps.filter(record => {
            const recipientText = (Array.isArray(record.penerimaRekomendasi) ? record.penerimaRekomendasi.join(' ') : record.penerimaRekomendasi) || '';
            return (
                record.judulLaporan?.toLowerCase().includes(lowercasedSearch) ||
                record.nomorLaporan?.toLowerCase().includes(lowercasedSearch) ||
                recipientText.toLowerCase().includes(lowercasedSearch) ||
                record.registrasiPesawat?.toLowerCase().includes(lowercasedSearch) ||
                record.lokasiKejadian?.toLowerCase().includes(lowercasedSearch)
            );
        });
    }, [dashboardStats.openOperatorFollowUps, awaitingFollowUpSearch]);

    const filteredTrendData = React.useMemo(() => {
        const allTrendData = dashboardStats.incidentTrend;
        if (chartYearScope === 'all') {
            return allTrendData;
        }
        const scope = parseInt(chartYearScope, 10);
        const currentYear = new Date().getFullYear();
        return allTrendData.filter(d => d.year >= currentYear - scope + 1);
    }, [dashboardStats.incidentTrend, chartYearScope]);

    return (
        <AppLayout>
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
                                            <div className="flex items-baseline gap-2">
                                                <p className="text-3xl font-bold text-red-500"><AnimatedCounter endValue={dashboardStats.totalAccidents} /></p>
                                                <p className="text-xl font-bold text-yellow-500">/ <AnimatedCounter endValue={dashboardStats.totalSeriousIncidents} /></p>
                                            </div>
                                            <p className="text-sm text-muted-foreground">Accidents / Serious Incidents</p>
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
                                    <div className="flex items-center gap-4 p-4 rounded-lg bg-background/50">
                                        <BookCheck className="h-8 w-8 text-green-500" />
                                        <div>
                                            <p className="text-3xl font-bold"><AnimatedCounter endValue={dashboardStats.totalRekomendasiKnkt} /></p>
                                            <p className="text-sm text-muted-foreground">Rekomendasi KNKT</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 rounded-lg bg-background/50">
                                        <BookOpenCheck className="h-8 w-8 text-purple-500" />
                                        <div>
                                            <p className="text-3xl font-bold"><AnimatedCounter endValue={dashboardStats.totalRekomendasiDgca} /></p>
                                            <p className="text-sm text-muted-foreground">Rekomendasi ke DGCA</p>
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
                
                {dashboardStats.totalRekomendasiKnkt > 0 && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <Card className="border-orange-400 bg-orange-50 dark:bg-orange-950/80 dark:border-orange-700/60 flex flex-col">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-300">
                                    <Send /> Awaiting Operator Follow-Up ({dashboardStats.openOperatorFollowUps.length})
                                </CardTitle>
                                <div className="flex justify-between items-center text-orange-700/80 dark:text-orange-400/80">
                                    <CardDescription className="text-orange-700/80 dark:text-orange-400/80">
                                        These KNKT recommendations are waiting for a response or action from the related operator.
                                    </CardDescription>
                                    <span className="text-sm font-bold">{dashboardStats.operatorFollowUpPercentage.toFixed(0)}% Completed</span>
                                </div>
                                <Progress value={dashboardStats.operatorFollowUpPercentage} className="h-2 mt-2 bg-orange-200" indicatorClassName="bg-orange-500" />
                                <div className="relative pt-2">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search pending follow-ups..."
                                        className="pl-9 bg-background/50"
                                        value={awaitingFollowUpSearch}
                                        onChange={(e) => setAwaitingFollowUpSearch(e.target.value)}
                                    />
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow min-h-0">
                                <ScrollArea className="h-full max-h-[400px]">
                                    <div className="space-y-3 pr-6">
                                        {filteredOpenOperatorFollowUps.slice(0, 5).map((record) => {
                                            const status = record.status || 'N/A';
                                            return (
                                            <div 
                                                key={record.id} 
                                                className="p-3 border-b border-orange-200 dark:border-orange-800/50 hover:bg-orange-100/50 dark:hover:bg-orange-900/20 rounded-md cursor-pointer"
                                                onClick={() => setRecordToEdit(record)}
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <p className="font-semibold text-sm"><Highlight text={record.judulLaporan} query={awaitingFollowUpSearch} /></p>
                                                        <p className="text-xs text-muted-foreground">
                                                            <Highlight text={record.nomorLaporan} query={awaitingFollowUpSearch} />
                                                            <span className="font-semibold mx-2 text-orange-600 dark:text-orange-400">
                                                            (<Highlight text={(Array.isArray(record.penerimaRekomendasi) ? record.penerimaRekomendasi : [record.penerimaRekomendasi]).filter(Boolean).join(', ')} query={awaitingFollowUpSearch} />)
                                                            </span>
                                                        </p>
                                                    </div>
                                                    <Badge className={cn('text-xs', getStatusClass(status))}>{status}</Badge>
                                                </div>
                                                <div className="mt-2 grid grid-cols-2 gap-4 text-xs">
                                                    <div className="text-muted-foreground">
                                                        <p><span className="font-semibold">Reg:</span> <Highlight text={record.registrasiPesawat || '-'} query={awaitingFollowUpSearch} /></p>
                                                        <p><span className="font-semibold">Loc:</span> <Highlight text={record.lokasiKejadian || '-'} query={awaitingFollowUpSearch} /></p>
                                                    </div>
                                                    <div className="text-muted-foreground text-right">
                                                        <p><span className="font-semibold">Incident:</span> {record.tanggalKejadian ? parseISO(record.tanggalKejadian).toLocaleDateString() : '-'}</p>
                                                        <p><span className="font-semibold">Published:</span> {record.tanggalTerbit ? parseISO(record.tanggalTerbit).toLocaleDateString() : '-'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )})}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                        <Card className="h-full flex flex-col border-red-500 bg-red-50 dark:bg-red-950/80 dark:border-red-700/60">
                            <CardHeader>
                                <CardTitle className="text-red-800 dark:text-red-300">Pending Follow-Ups by Operator</CardTitle>
                                <CardDescription className="text-red-700/80 dark:text-red-400/80">Breakdown of pending follow-ups by responsible operator.</CardDescription>
                            </CardHeader>
                             <CardContent className="flex-grow min-h-0">
                                <ScrollArea className="h-full max-h-[400px]">
                                    <div className="space-y-3 pr-6">
                                    {dashboardStats.openFollowUpsOperatorChartData.map((item) => {
                                        const maxVal = dashboardStats.openFollowUpsOperatorChartData[0]?.value || 1;
                                        const barPercentage = (item.value / maxVal) * 100;
                                        return (
                                            <div 
                                                key={item.name} 
                                                className="w-full flex items-center gap-3 text-sm text-left p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/40 cursor-pointer"
                                                onClick={() => setSelectedOperator(item.name)}
                                            >
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                      <div className="truncate text-left flex-1">
                                                        <span>{item.name}</span>
                                                      </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {item.name}
                                                    </TooltipContent>
                                                </Tooltip>
                                                <div className="w-1/3 bg-yellow-200 dark:bg-yellow-800/50 rounded-full h-2.5">
                                                    <div
                                                        className="bg-yellow-500 h-2.5 rounded-full"
                                                        style={{ width: `${barPercentage}%` }}
                                                    ></div>
                                                </div>
                                                <span className="font-bold w-12 text-right">{item.value} ({item.percentage.toFixed(0)}%)</span>
                                            </div>
                                        )
                                    })}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                            <div>
                                <CardTitle className="flex items-center gap-2"><LineChartIcon /> Incident Trends by Year</CardTitle>
                                <CardDescription>Year-over-year trends for Accidents, Serious Incidents, and Casualties.</CardDescription>
                            </div>
                            <Select value={chartYearScope} onValueChange={setChartYearScope}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Select date range..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="5">Last 5 Years</SelectItem>
                                    <SelectItem value="10">Last 10 Years</SelectItem>
                                    <SelectItem value="all">All Time</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer
                            config={{
                                "Accident": { label: "Accident", color: "hsl(var(--chart-3))" },
                                "S. Incident": { label: "S. Incident", color: "hsl(var(--chart-2))" },
                                "Casualties": { label: "Casualties", color: "hsl(var(--chart-5))" },
                            }}
                            className="h-[300px] w-full"
                        >
                            <ResponsiveContainer>
                                <LineChart data={filteredTrendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="year" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Legend />
                                    <Line name="Accident" type="monotone" dataKey="A" stroke="hsl(var(--chart-3))" strokeWidth={2} activeDot={{ r: 8 }} />
                                    <Line name="S. Incident" type="monotone" dataKey="SI" stroke="hsl(var(--chart-2))" strokeWidth={2} activeDot={{ r: 8 }} />
                                    <Line name="Casualties" type="monotone" dataKey="Casualties" stroke="hsl(var(--chart-5))" strokeWidth={2} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rsiModules.map((module) => {
                        const dateField = getDateFieldForCollection(module.collectionName);
                        
                        const filteredRecords = (data[module.collectionName] || []).filter((record: any) => {
                            if (yearFilter === 'all') return true;
                            
                            let dateStrings: string[] = [];
                            if (module.collectionName === 'lawEnforcementRecords') {
                                dateStrings = (record.references || []).map((ref: any) => ref.dateLetter).filter(Boolean);
                            } else {
                                const dateString = record[dateField];
                                if (dateString) dateStrings.push(dateString);
                            }

                        return dateStrings.some(dateString => {
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
                                    } else if ((dateString as any).toDate) { // For Firestore Timestamps
                                        recordYear = getYear((dateString as any).toDate());
                                    }
                                    return recordYear === parseInt(yearFilter);
                                } catch(e) {
                                    return false;
                                }
                            });
                        });
                        
                        const totalCount = filteredRecords.length;
                        
                        const statusCounts = filteredRecords.reduce((acc, record) => {
                            const status = (record as any)[module.statusField];
                            if (status) {
                                if (Array.isArray(status)) {
                                    status.forEach(s => {
                                        acc[s] = (acc[s] || 0) + 1;
                                    });
                                } else {
                                    acc[status] = (acc[status] || 0) + 1;
                                }
                            }
                            return acc;
                        }, {} as Record<string, number>);

                        const statusArray = Object.entries(statusCounts)
                            .map(([name, count]) => ({ 
                                name, 
                                count, 
                                className: module.statusVariant(name),
                                percentage: totalCount > 0 ? (count / totalCount) * 100 : 0
                            }))
                            .sort((a, b) => b.count - a.count);

                        const isExpanded = expandedCards[module.title] || false;
                        
                        const totalAccidents = module.collectionName === 'accidentIncidentRecords'
                            ? (filteredRecords as AccidentIncidentRecord[]).filter(r => r.kategori === 'Accident (A)').length
                            : 0;
                        
                        const totalSeriousIncidents = module.collectionName === 'accidentIncidentRecords'
                            ? totalCount - totalAccidents
                            : 0;

                        const totalCasualties = module.collectionName === 'accidentIncidentRecords'
                            ? (filteredRecords as AccidentIncidentRecord[]).reduce((sum, r) => sum + parseCasualties(r.korbanJiwa), 0)
                            : null;
                            
                        const breakdownItems = module.title === 'Monitoring Rekomendasi ke DGCA'
                            ? Object.entries(
                                (filteredRecords as TindakLanjutDgcaRecord[]).reduce((acc, r) => {
                                    acc[r.operator] = (acc[r.operator] || 0) + 1;
                                    return acc;
                                }, {} as Record<string, number>)
                            )
                            .map(([name, count]) => ({
                                name,
                                count,
                                className: module.statusVariant(name),
                                percentage: totalCount > 0 ? (count / totalCount) * 100 : 0,
                            }))
                            .sort((a,b) => b.count - a.count)
                            : statusArray;

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
                                            module.collectionName === 'accidentIncidentRecords' ? (
                                                <div className="flex items-baseline gap-2">
                                                    <p className="text-4xl font-bold text-red-500"><AnimatedCounter endValue={totalAccidents} /></p>
                                                    <p className="text-2xl font-bold text-yellow-500">/ <AnimatedCounter endValue={totalSeriousIncidents} /></p>
                                                </div>
                                            ) : (
                                                <p className="text-4xl font-bold">
                                                    <AnimatedCounter endValue={totalCount} />
                                                </p>
                                            )
                                        )}
                                    </div>
                                    {(totalCount > 0) && (
                                        <div className="pt-2 space-y-3">
                                            <p className="text-xs uppercase text-muted-foreground font-semibold">Breakdown</p>
                                            {module.collectionName === 'accidentIncidentRecords' && (
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    <Badge variant="destructive">
                                                        Total Casualties: <span className="font-bold ml-1">{totalCasualties}</span>
                                                    </Badge>
                                                </div>
                                            )}
                                            {module.collectionName !== 'accidentIncidentRecords' && module.title === 'List of Law Enforcement' && dashboardStats.sanctionTypesBreakdown.length > 0 && (
                                                <>
                                                    <div className="space-y-1">
                                                    {(isExpanded ? dashboardStats.sanctionTypesBreakdown : dashboardStats.sanctionTypesBreakdown.slice(0, 5)).map(({ name, count, className, percentage }) => (
                                                        <div key={name} className="flex items-center gap-2">
                                                            <Badge variant="secondary" className={cn(className, 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300', "whitespace-nowrap")}>
                                                                {name}: <span className="font-bold ml-1">{count} ({percentage.toFixed(0)}%)</span>
                                                            </Badge>
                                                        </div>
                                                    ))}
                                                    {dashboardStats.sanctionTypesBreakdown.length > 5 && (
                                                        <Button
                                                            variant="link"
                                                            className="text-xs h-auto p-0"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                toggleCardExpansion(`${module.title}-sanction`);
                                                            }}
                                                        >
                                                            {isExpanded ? 'Show less' : `Show ${dashboardStats.sanctionTypesBreakdown.length - 5} more`}
                                                        </Button>
                                                    )}
                                                    </div>
                                                    <p className="text-xs uppercase text-muted-foreground font-semibold pt-2">By Entity</p>
                                                </>
                                            )}
                                            <div className="space-y-1">
                                                {(isExpanded ? breakdownItems : breakdownItems.slice(0, 5)).map(({ name, count, className, percentage }) => (
                                                    <div key={name} className="flex items-center gap-2">
                                                        <Badge variant="secondary" className={cn(className, module.title === 'Monitoring Rekomendasi ke DGCA' ? 'bg-indigo-100 text-indigo-800' : '', "whitespace-nowrap")}>
                                                            {name}: <span className="font-bold ml-1">{count} ({percentage.toFixed(0)}%)</span>
                                                        </Badge>
                                                    </div>
                                                ))}
                                                {breakdownItems.length > 5 && (
                                                    <Button
                                                        variant="link"
                                                        className="text-xs h-auto p-0"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            toggleCardExpansion(module.title);
                                                        }}
                                                    >
                                                        {isExpanded ? 'Show less' : `Show ${breakdownItems.length - 5} more`}
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
                {recordToEdit && (
                    <EditTindakLanjutRecordDialog
                        record={recordToEdit}
                        onRecordUpdate={handleRecordUpdate}
                        open={!!recordToEdit}
                        onOpenChange={(isOpen) => !isOpen && setRecordToEdit(null)}
                    />
                )}
                {selectedOperator && (
                    <OperatorFollowUpDialog
                        operatorName={selectedOperator}
                        records={dashboardStats.openOperatorFollowUps}
                        open={!!selectedOperator}
                        onOpenChange={(isOpen) => !isOpen && setSelectedOperator(null)}
                    />
                )}
                </main>
            </TooltipProvider>
        </AppLayout>
    );
}
