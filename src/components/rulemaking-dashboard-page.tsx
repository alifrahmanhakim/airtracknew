
'use client';

import type { Project, User, Task } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Input } from './ui/input';
import { Search, CheckCircle, Clock, AlertTriangle, List, AlertCircle, ArrowRight, Flag, Users, FileText, CalendarCheck2, ListTodo, ArrowDown, User as UserIcon, CalendarX, CalendarClock, LayoutGrid, ListFilter, HelpCircle } from 'lucide-react';
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
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

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
  
    if (progress === 100 || project.status === 'Completed') {
      return 'Completed';
    }
  
    const today = startOfToday();
    const projectEnd = parseISO(project.endDate);
  
    if (isAfter(today, projectEnd)) {
      return 'Off Track';
    }
  
    if (hasCritical) {
      return 'At Risk';
    }
    
    const projectStart = parseISO(project.startDate);
    const totalDuration = differenceInDays(projectEnd, projectStart);
  
    if (totalDuration > 0) {
      const elapsedDuration = differenceInDays(today, projectStart);
      const timeProgress = (elapsedDuration / totalDuration) * 100;
  
      if (progress < timeProgress - 20) {
        return 'At Risk';
      }
    }
    
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
        const statusGroups: { [key in Project['status']]: Project[] } = {
            'Completed': [],
            'On Track': [],
            'At Risk': [],
            'Off Track': [],
        };

        projects.forEach(p => {
            const status = getEffectiveStatus(p);
            statusGroups[status].push(p);
        });

        const highPriority = projects.filter(p => p.tags?.includes('High Priority'));

        const distribution = [
            { name: 'Completed', value: statusGroups['Completed'].length, color: 'hsl(var(--chart-1))' },
            { name: 'On Track', value: statusGroups['On Track'].length, color: 'hsl(var(--chart-2))' },
            { name: 'At Risk', value: statusGroups['At Risk'].length, color: 'hsl(var(--chart-3))' },
            { name: 'Off Track', value: statusGroups['Off Track'].length, color: 'hsl(var(--chart-4))' }
        ];

        return { 
            total: projects.length, 
            statusGroups,
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

    const StatusCard = ({
        title,
        count,
        icon: Icon,
        className,
        projects,
    }: {
        title: string,
        count: number,
        icon: React.ElementType,
        className?: string,
        projects: Project[]
    }) => (
        <Popover>
            <PopoverTrigger asChild>
                <Card className="hover:bg-muted/50 cursor-pointer">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{title}</CardTitle>
                        <Icon className={cn("h-4 w-4 text-muted-foreground", className)} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{count}</div>
                    </CardContent>
                </Card>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="font-bold mb-2">{title} Projects</div>
                 {projects.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {projects.map(p => (
                            <Link key={p.id} href={`/projects/${p.id}?type=rulemaking`} className="block p-2 rounded-md hover:bg-accent">
                                <p className="font-semibold truncate">{p.name}</p>
                                <p className="text-xs text-muted-foreground">Due: {format(parseISO(p.endDate), 'dd MMM yyyy')}</p>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">No projects with this status.</p>
                )}
            </PopoverContent>
        </Popover>
    );

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
                        <CardContent className="space-y-2">
                           <StatusCard title="Total Regulations" count={stats.total} icon={List} projects={projects} />
                           <StatusCard title="Completed" count={stats.statusGroups['Completed'].length} icon={CheckCircle} className="text-green-500" projects={stats.statusGroups['Completed']} />
                           <StatusCard title="On Track" count={stats.statusGroups['On Track'].length} icon={Clock} className="text-blue-500" projects={stats.statusGroups['On Track']} />
                           <StatusCard title="At Risk" count={stats.statusGroups['At Risk'].length} icon={AlertTriangle} className="text-yellow-500" projects={stats.statusGroups['At Risk']} />
                           <StatusCard title="Off Track" count={stats.statusGroups['Off Track'].length} icon={AlertCircle} className="text-red-500" projects={stats.statusGroups['Off Track']} />
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

                    <Card className="border-red-500/50 bg-red-50 dark:bg-red-900/20">
                        <CardHeader>
                            <CardTitle className='flex items-center gap-2 text-red-800 dark:text-red-300'><CalendarX /> Off Track Projects</CardTitle>
                            <CardDescription className='text-red-700/80 dark:text-red-400/80'>Projects that have passed their deadline.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           {paginatedDeadlineProjects.length > 0 ? (
                               <div className="space-y-3">
                                   {paginatedDeadlineProjects.map(project => {
                                       const daysOverdue = differenceInDays(new Date(), parseISO(project.endDate));
                                       return (
                                           <Link key={project.id} href={`/projects/${project.id}?type=rulemaking`} className="block hover:bg-red-100/50 dark:hover:bg-red-900/30 p-2 rounded-md">
                                                <div className="flex items-center justify-between gap-4">
                                                    <p className="font-semibold truncate flex-1">{project.name}</p>
                                                    <Badge variant="destructive" className="whitespace-nowrap">{daysOverdue} days overdue</Badge>
                                                </div>
                                           </Link>
                                       )
                                   })}
                               </div>
                           ) : (
                                <div className="text-center text-sm text-red-700/80 dark:text-red-400/80 py-4">
                                    <CheckCircle className="mx-auto h-8 w-8 mb-2" />
                                    No projects are off track.
                                </div>
                           )}
                        </CardContent>
                        {totalDeadlinePages > 1 && (
                            <CardFooter>
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
