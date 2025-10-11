
'use client';

import type { Project, User, Task } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Input } from './ui/input';
import { Search, CheckCircle, Clock, AlertTriangle, List, AlertCircle, ArrowRight, Flag, Users, FileText, CalendarCheck2, ListTodo, ArrowDown, User as UserIcon, CalendarX, CalendarClock, LayoutGrid, ListFilter } from 'lucide-react';
import { useMemo, useState, useRef } from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { format, parseISO, differenceInDays, isAfter, startOfToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { AddRulemakingProjectDialog } from './add-rulemaking-project-dialog';
import { rulemakingTaskOptions } from '@/lib/data';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from './ui/pagination';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { RulemakingTable } from './rulemaking-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { countAllTasks } from '@/lib/data-utils';
import { ProjectCard } from './project-card';

type RulemakingDashboardPageProps = {
    projects: Project[];
    allUsers: User[];
    onProjectAdd: () => void;
};

type SortDescriptor = {
    column: keyof Project | 'progress';
    direction: 'asc' | 'desc';
} | null;

const getEffectiveStatus = (project: Project): Project['status'] => {
    const { total, completed, hasCritical } = countAllTasks(project.tasks || []);
    const progress = total > 0 ? (completed / total) * 100 : 0;
  
    // 1. If progress is 100% or status is manually set to Completed, it's Completed.
    if (progress === 100 || project.status === 'Completed') {
      return 'Completed';
    }
  
    const today = startOfToday();
    const projectEnd = parseISO(project.endDate);
  
    // 2. Highest priority after completion: If the end date is in the past, it's Off Track.
    if (isAfter(today, projectEnd)) {
      return 'Off Track';
    }
  
    // 3. If there is a critical issue, it's At Risk.
    if (hasCritical) {
      return 'At Risk';
    }
    
    const projectStart = parseISO(project.startDate);
    const totalDuration = differenceInDays(projectEnd, projectStart);
  
    // 4. If progress is significantly behind the time elapsed, it's At Risk.
    if (totalDuration > 0) {
      const elapsedDuration = differenceInDays(today, projectStart);
      const timeProgress = (elapsedDuration / totalDuration) * 100;
  
      if (progress < timeProgress - 20) {
        return 'At Risk';
      }
    }
    
    // 5. If none of the above severe conditions are met, it's On Track.
    return 'On Track';
};


export function RulemakingDashboardPage({ projects, allUsers, onProjectAdd }: RulemakingDashboardPageProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [deadlinePage, setDeadlinePage] = useState(1);
    const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
    const [statusFilter, setStatusFilter] = useState('all');
    const [tagFilter, setTagFilter] = useState('all');
    const [sort, setSort] = useState<SortDescriptor>({ column: 'endDate', direction: 'asc' });

    const DEADLINES_PER_PAGE = 3;

    const stats = useMemo(() => {
        const total = projects.length;
        let statusCounts = {
            'Completed': 0,
            'On Track': 0,
            'At Risk': 0,
            'Off Track': 0,
        };

        projects.forEach(p => {
            const status = getEffectiveStatus(p);
            statusCounts[status]++;
        });

        const highPriority = projects.filter(p => p.tags?.includes('High Priority'));

        const distribution = [
            { name: 'Completed', value: statusCounts['Completed'], color: 'hsl(var(--chart-1))' },
            { name: 'On Track', value: statusCounts['On Track'], color: 'hsl(var(--chart-2))' },
            { name: 'At Risk', value: statusCounts['At Risk'], color: 'hsl(var(--chart-3))' },
            { name: 'Off Track', value: statusCounts['Off Track'], color: 'hsl(var(--chart-4))' }
        ];

        return { 
            total, 
            completed: statusCounts['Completed'],
            onTrack: statusCounts['On Track'],
            atRiskOrOffTrack: statusCounts['At Risk'] + statusCounts['Off Track'],
            highPriority, 
            distribution 
        };
    }, [projects]);


    const offTrackProjects = useMemo(() => {
        return projects.filter(p => getEffectiveStatus(p) === 'Off Track')
        .sort((a,b) => parseISO(a.endDate).getTime() - parseISO(b.endDate).getTime());
    }, [projects]);
    
    const totalDeadlinePages = Math.ceil(offTrackProjects.length / DEADLINES_PER_PAGE);
    const paginatedDeadlineProjects = offTrackProjects.slice(
        (deadlinePage - 1) * DEADLINES_PER_PAGE,
        deadlinePage * DEADLINES_PER_PAGE
    );

    const handleDeadlinePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalDeadlinePages) {
            setDeadlinePage(newPage);
        }
    };

    const allTags = useMemo(() => {
        const tags = new Set<string>();
        projects.forEach(p => {
            p.tags?.forEach(tag => tags.add(tag));
        });
        return Array.from(tags);
    }, [projects]);

    const filteredProjects = useMemo(() => {
        let filtered = [...projects];

        if (searchTerm) {
            const lowercasedFilter = searchTerm.toLowerCase();
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(lowercasedFilter) ||
                p.casr?.toLowerCase().includes(lowercasedFilter) ||
                p.team.some(t => t.name && t.name.toLowerCase().includes(lowercasedFilter)) ||
                p.tags?.some(tag => tag.toLowerCase().includes(lowercasedFilter))
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(p => getEffectiveStatus(p) === statusFilter);
        }
        
        if (tagFilter !== 'all') {
            filtered = filtered.filter(p => p.tags?.includes(tagFilter));
        }

        return filtered;
    }, [projects, searchTerm, statusFilter, tagFilter]);

    return (
        <TooltipProvider>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className='mb-4 p-4 rounded-lg bg-card/80 backdrop-blur-sm'>
                <h1 className="text-3xl font-bold tracking-tight">Aviation Regulation Management Dashboard</h1>
                <p className="text-muted-foreground">Central hub for tracking compliance and progress of all CASRs.</p>
            </div>
            
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4'>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
                     <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by CASR ID, title, etc..." 
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                     <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter by status..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="On Track">On Track</SelectItem>
                            <SelectItem value="At Risk">At Risk</SelectItem>
                            <SelectItem value="Off Track">Off Track</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                    </Select>
                     <Select value={tagFilter} onValueChange={setTagFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter by tag..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Tags</SelectItem>
                            {allTags.map(tag => <SelectItem key={tag} value={tag}>{tag}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'card' | 'table')} aria-label="View mode">
                        <ToggleGroupItem value="card" aria-label="Card view">
                            <LayoutGrid className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="table" aria-label="Table view">
                            <ListFilter className="h-4 w-4" />
                        </ToggleGroupItem>
                    </ToggleGroup>
                    <AddRulemakingProjectDialog allUsers={allUsers} onProjectAdd={onProjectAdd} />
                 </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1">
                {/* Left Sidebar */}
                <aside className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Project Snapshot</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                                <List className="h-6 w-6 text-primary" />
                                <div>
                                    <p className="text-2xl font-bold">{stats.total}</p>
                                    <p className="text-sm text-muted-foreground">Total Regulations</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                                <CheckCircle className="h-6 w-6 text-green-500" />
                                <div>
                                    <p className="text-2xl font-bold">{stats.completed}</p>
                                    <p className="text-sm text-muted-foreground">Completed</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                                <Clock className="h-6 w-6 text-blue-500" />
                                <div>
                                    <p className="text-2xl font-bold">{stats.onTrack}</p>
                                    <p className="text-sm text-muted-foreground">On Track</p>
                                </div>
                            </div>
                             <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                                <AlertTriangle className="h-6 w-6 text-yellow-500" />
                                <div>
                                    <p className="text-2xl font-bold">{stats.atRiskOrOffTrack}</p>
                                    <p className="text-sm text-muted-foreground">At Risk / Off Track</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Status Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={{}} className="h-48 w-full">
                                <ResponsiveContainer>
                                    <PieChart>
                                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                        <Pie data={stats.distribution} dataKey="value" nameKey="name" innerRadius="60%" strokeWidth={2}>
                                             {stats.distribution.map((entry) => (
                                                <Cell key={`cell-${entry.name}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 text-xs">
                                {stats.distribution.filter(d => d.value > 0).map(item => (
                                    <div key={item.name} className="flex items-center gap-2">
                                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span>{item.name} ({stats.total > 0 ? ((item.value / stats.total) * 100).toFixed(0) : 0}%)</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className='flex items-center gap-2'><Flag className='text-red-500' /> High Priority Items</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           {stats.highPriority.length > 0 ? stats.highPriority.map(p => (
                               <Link key={p.id} href={`/projects/${p.id}?type=rulemaking`}>
                                <div className='p-3 rounded-md bg-red-50 border border-red-200 hover:bg-red-100 cursor-pointer dark:bg-red-900/20 dark:border-red-500/30 dark:hover:bg-red-900/30 flex items-center gap-2'>
                                    <ArrowRight className='h-4 w-4 text-red-500'/>
                                    <div>
                                        <p className='font-bold text-red-800 dark:text-red-300'>CASR {p.casr}</p>
                                        <p className='text-sm text-red-700 dark:text-red-400 truncate'>{p.name}</p>
                                    </div>
                                </div>
                               </Link>
                           )) : (
                               <p className="text-sm text-muted-foreground text-center py-4">No high priority items.</p>
                           )}
                        </CardContent>
                    </Card>
                     <Card className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-destructive"><AlertCircle className="h-5 w-5"/> Off Track Projects</CardTitle>
                            <CardDescription>Projects that have passed their deadline.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 flex-grow">
                            {paginatedDeadlineProjects.length > 0 ? (
                                paginatedDeadlineProjects.map(project => {
                                    const daysOverdue = differenceInDays(new Date(), parseISO(project.endDate));
                                    return (
                                        <Link key={project.id} href={`/projects/${project.id}?type=rulemaking`} className="block hover:bg-muted/50 p-2 rounded-md">
                                            <div className="flex items-center justify-between gap-4">
                                                <p className="font-semibold truncate flex-1">CASR {project.casr}</p>
                                                <Badge variant="destructive" className="whitespace-nowrap">{daysOverdue} days overdue</Badge>
                                            </div>
                                             <p className="text-xs text-muted-foreground truncate">{project.name}</p>
                                        </Link>
                                    )
                                })
                            ) : (
                                <div className="text-center text-sm text-muted-foreground py-4">
                                    <CalendarClock className="mx-auto h-8 w-8 mb-2" />
                                    No off track projects. Great job!
                                </div>
                            )}
                        </CardContent>
                         {totalDeadlinePages > 1 && (
                             <CardFooter className="pt-4 mt-auto">
                                <Pagination>
                                    <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handleDeadlinePageChange(deadlinePage - 1); }} className={deadlinePage === 1 ? 'pointer-events-none opacity-50' : ''} />
                                    </PaginationItem>
                                    <PaginationItem>
                                        <span className="px-4 py-2 text-sm">
                                            Page {deadlinePage} of {totalDeadlinePages}
                                        </span>
                                    </PaginationItem>
                                    <PaginationItem>
                                        <PaginationNext href="#" onClick={(e) => { e.preventDefault(); handleDeadlinePageChange(deadlinePage + 1); }} className={deadlinePage >= totalDeadlinePages ? 'pointer-events-none opacity-50' : ''} />
                                    </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </CardFooter>
                        )}
                    </Card>
                </aside>
                
                {/* Main Content */}
                <main className="md:col-span-3">
                     {viewMode === 'card' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                           {filteredProjects.map(project => (
                               <ProjectCard
                                   key={project.id}
                                   project={project}
                                   allUsers={allUsers}
                               />
                           ))}
                        </div>
                    ) : (
                        <RulemakingTable projects={filteredProjects} sort={sort} setSort={setSort} />
                    )}
                </main>
            </div>
        </main>
        </TooltipProvider>
    );
}
