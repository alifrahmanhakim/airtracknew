
'use client';

import type { Project, User, Task } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Input } from './ui/input';
import { Search, CheckCircle, Clock, AlertTriangle, List, AlertCircle, ArrowRight, Flag, Users, FileText, CalendarCheck2, ListTodo, ArrowDown, User as UserIcon, CalendarX, CalendarClock, LayoutGrid, ListFilter, HelpCircle, History } from 'lucide-react';
import { useMemo, useState, useRef } from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { format, parseISO, differenceInDays, isAfter, startOfToday, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { AddRulemakingProjectDialog } from '@/components/add-rulemaking-project-dialog';
import { rulemakingTaskOptions } from '@/lib/data';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from './ui/pagination';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { RulemakingTable } from './rulemaking-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { countAllTasks } from '@/lib/data-utils';
import { ProjectCard } from './project-card';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Separator } from './ui/separator';
import { AnimatedCounter } from './ui/animated-counter';

type RulemakingDashboardPageProps = {
    projects: Project[];
    allUsers: User[];
};

type SortDescriptor = {
    column: keyof Project | 'progress';
    direction: 'asc' | 'desc';
} | null;

type AssignedTask = Task & {
  projectName: string;
  projectId: string;
  projectType: Project['projectType'];
  createdAt?: string; // Add createdAt to the task type
};


const getEffectiveStatus = (project: Project): Project['status'] => {
    const { total, completed, hasCritical } = countAllTasks(project.tasks || []);
    const progress = total > 0 ? (completed / total) * 100 : 0;
  
    if (progress === 100) return 'Completed';

    // Manual override takes precedence over automatic calculation (except for completion)
    if (project.status === 'Off Track') {
      return 'Off Track';
    }
  
    const today = startOfToday();
    const projectEnd = parseISO(project.endDate);
  
    if (isAfter(today, projectEnd)) {
      return 'Off Track';
    }
  
    if (hasCritical || project.status === 'At Risk') {
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

const StatusLogicGuide = () => {
    const statuses = [
        {
            icon: CheckCircle,
            title: 'Completed',
            description: 'Progres penyelesaian tugas telah mencapai 100%.',
            color: 'text-green-500',
        },
        {
            icon: AlertCircle,
            title: 'Off Track',
            description: 'Proyek telah melewati tenggat waktu yang ditentukan.',
            color: 'text-red-500',
        },
        {
            icon: AlertTriangle,
            title: 'At Risk',
            description: 'Progres penyelesaian tugas tertinggal lebih dari 20% dari linimasa waktu, atau terdapat tugas yang ditandai sebagai isu kritis.',
            color: 'text-yellow-500',
        },
        {
            icon: Clock,
            title: 'On Track',
            description: 'Proyek berjalan sesuai jadwal dan progres.',
            color: 'text-blue-500',
        },
    ];

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <HelpCircle className="h-5 w-5" />
                    Status Logic Guide
                </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
                {statuses.map(status => (
                    <div key={status.title} className="flex items-start gap-3">
                        <status.icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", status.color)} />
                        <div>
                            <p className="font-semibold text-sm">{status.title}</p>
                            <p className="text-xs text-muted-foreground">{status.description}</p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};

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
             <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted">
                <Icon className={cn("h-6 w-6 text-muted-foreground", className)} />
                <div>
                    <p className="text-2xl font-bold"><AnimatedCounter endValue={count} /></p>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                </div>
            </div>
        </PopoverTrigger>
        <PopoverContent className="w-80">
            <div className="font-bold mb-2">{title} Projects</div>
             {projects.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {projects.map(p => (
                        <Link key={p.id} href={`/projects/${p.id}?type=rulemaking`} className="block p-2 rounded-md hover:bg-accent hover:text-accent-foreground">
                            <p className="font-semibold">{p.name}</p>
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


export function RulemakingDashboardPage({ projects, allUsers }: RulemakingDashboardPageProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
    const [statusFilter, setStatusFilter] = useState('all');
    const [tagFilter, setTagFilter] = useState('all');
    const [sort, setSort] = useState<SortDescriptor>({ column: 'endDate', direction: 'asc' });

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
            { name: 'Completed', value: statusGroups['Completed'].length, color: 'hsl(var(--chart-1))' }, // Green
            { name: 'On Track', value: statusGroups['On Track'].length, color: 'hsl(var(--chart-4))' }, // Blue
            { name: 'At Risk', value: statusGroups['At Risk'].length, color: 'hsl(var(--chart-2))' }, // Yellow
            { name: 'Off Track', value: statusGroups['Off Track'].length, color: 'hsl(var(--chart-3))' } // Red
        ];

        return { 
            total: projects.length, 
            statusGroups,
            highPriority, 
            distribution 
        };
    }, [projects]);


    const offTrackProjects = useMemo(() => {
        return stats.statusGroups['Off Track'].sort((a,b) => parseISO(a.endDate).getTime() - parseISO(b.endDate).getTime());
    }, [stats.statusGroups]);

    const allTags = useMemo(() => {
        const tags = new Set<string>();
        projects.forEach(p => {
            p.tags?.forEach(tag => tags.add(tag));
        });
        return Array.from(tags);
    }, [projects]);
    
    const recentlyAddedTasks = useMemo(() => {
        const allTasks: AssignedTask[] = [];
         projects.forEach(project => {
          const tasks = project.tasks || [];
          (function collectTasks(tasks: Task[]) {
              tasks.forEach(task => {
                   allTasks.push({
                      ...task,
                      projectName: project.name,
                      projectId: project.id,
                      projectType: project.projectType,
                      createdAt: project.createdAt
                   });
                   if(task.subTasks) {
                       collectTasks(task.subTasks);
                   }
              });
          })(tasks);
      });
      
      return allTasks.sort((a, b) => {
            const dateA = a.createdAt && isValid(new Date(a.createdAt)) ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt && isValid(new Date(b.createdAt)) ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });
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
            <div 
              className="relative mb-4 p-6 rounded-xl text-white overflow-hidden"
              style={{
                backgroundImage: "url('https://ik.imagekit.io/avmxsiusm/Gemini_Generated_Image_242idc242idc242i.png')",
                backgroundSize: '50%',
                backgroundPosition: 'right center',
                backgroundRepeat: 'no-repeat',
              }}
            >
              <div className="absolute inset-0 bg-black/50 z-0"></div>
              <div className="relative z-10">
                <h1 className="text-3xl font-bold tracking-tight">Aviation Regulation Management Dashboard</h1>
                <p className="text-white/80">Central hub for tracking compliance and progress of all CASRs.</p>
              </div>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Projects Overview</CardTitle>
                    <CardDescription>A summary of all rulemaking projects.</CardDescription>
                </CardHeader>
                 <CardContent className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-1">
                       <Card className="h-full">
                           <CardHeader>
                               <CardTitle className="text-base">Project Snapshot</CardTitle>
                           </CardHeader>
                           <CardContent className="grid grid-cols-1 gap-3">
                               <StatusCard title="Total Regulations" count={stats.total} icon={List} projects={projects} />
                               <StatusCard title="Completed" count={stats.statusGroups['Completed'].length} icon={CheckCircle} className="text-green-500" projects={stats.statusGroups['Completed']} />
                               <StatusCard title="On Track" count={stats.statusGroups['On Track'].length} icon={Clock} className="text-blue-500" projects={stats.statusGroups['On Track']} />
                               <StatusCard title="At Risk" count={stats.statusGroups['At Risk'].length} icon={AlertTriangle} className="text-yellow-500" projects={stats.statusGroups['At Risk']} />
                           </CardContent>
                       </Card>
                    </div>
                    <div className="lg:col-span-1">
                        <Card className="h-full border-red-500/50 bg-red-50 dark:bg-red-900/20 flex flex-col">
                             <CardHeader>
                                <CardTitle className='flex items-center gap-2 text-base text-red-800 dark:text-red-300'>
                                    <CalendarX /> 
                                    Off Track Projects ({offTrackProjects.length})
                                </CardTitle>
                                <CardDescription className='text-red-700/80 dark:text-red-400/80'>Projects that have passed their deadline.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                            {offTrackProjects.length > 0 ? (
                                <div className="space-y-3">
                                    {offTrackProjects.map(project => {
                                        const daysOverdue = differenceInDays(new Date(), parseISO(project.endDate));
                                        return (
                                            <Link key={project.id} href={`/projects/${project.id}?type=rulemaking`} className="block hover:bg-red-100/50 dark:hover:bg-red-900/30 p-2 rounded-md">
                                                <div className="flex items-center justify-between gap-4">
                                                    <p className="font-semibold break-words flex-1 text-sm">{project.name}</p>
                                                    <Badge variant="destructive" className="whitespace-nowrap">{daysOverdue} days overdue</Badge>
                                                </div>
                                            </Link>
                                        )
                                    })}
                                </div>
                            ) : (
                                    <div className="text-center text-sm text-red-700/80 dark:text-red-400/80 py-4 h-full flex flex-col justify-center items-center">
                                        <CheckCircle className="mx-auto h-8 w-8 mb-2" />
                                        No projects are off track.
                                    </div>
                            )}
                            </CardContent>
                        </Card>
                    </div>
                     <div className="lg:col-span-1">
                         <Card className="h-full">
                            <CardHeader>
                                <CardTitle className="text-base">Status Distribution</CardTitle>
                            </CardHeader>
                            <CardContent className="h-48 flex items-center justify-center">
                                <ChartContainer config={{}} className="w-full h-full">
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
                            </CardContent>
                             <CardFooter className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs">
                                {stats.distribution.filter(d => d.value > 0).map(item => {
                                    const percentage = stats.total > 0 ? (item.value / stats.total) * 100 : 0;
                                    return (
                                        <div key={item.name} className="flex items-center gap-1.5">
                                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span>{item.name} ({percentage.toFixed(0)}%)</span>
                                        </div>
                                    )
                                })}
                            </CardFooter>
                        </Card>
                    </div>
                   <div className="lg:col-span-1">
                        <StatusLogicGuide />
                    </div>
                </CardContent>
            </Card>

            {recentlyAddedTasks.length > 0 && (
                <Card className="border-blue-400 bg-blue-50 dark:bg-blue-950/80 dark:border-blue-700/60">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
                            <History /> Recently Added Tasks
                        </CardTitle>
                        <CardDescription className="text-blue-700/80 dark:text-blue-400/80">
                            The most recently created tasks across all rulemaking projects.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {recentlyAddedTasks.slice(0, 5).map((task, index) => {
                            const createdAtDate = task.createdAt && isValid(new Date(task.createdAt)) ? new Date(task.createdAt) : null;
                             const project = projects.find(p => p.id === task.projectId);
                             const creator = project ? allUsers.find(u => u.id === project.ownerId) : null;
                            return (
                                <div key={task.id}>
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <span className="font-bold text-blue-700 dark:text-blue-300 mt-1">{index + 1}.</span>
                                            <div>
                                                <p className="font-semibold text-sm">{task.title}</p>
                                                <p className="text-xs text-muted-foreground">
                                                   In project: {task.projectName}
                                                   {createdAtDate && (
                                                       <span className="ml-2">
                                                            - Created {format(createdAtDate, 'dd MMM yyyy')} by {creator?.name || 'Unknown'}
                                                       </span>
                                                   )}
                                                </p>
                                            </div>
                                        </div>
                                        <Button asChild size="sm" variant="outline">
                                            <Link href={`/projects/${task.projectId}?type=rulemaking`}>
                                                View Project <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                    {index < recentlyAddedTasks.slice(0, 5).length - 1 && <Separator className="mt-4 bg-blue-200 dark:bg-blue-800/50" />}
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>
            )}

            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mt-8 mb-4 gap-4'>
                 <h2 className="text-2xl font-bold tracking-tight">All Regulations</h2>
                 <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'card' | 'table')} aria-label="View mode">
                        <ToggleGroupItem value="card" aria-label="Card view">
                            <LayoutGrid className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="table" aria-label="Table view">
                            <ListFilter className="h-4 w-4" />
                        </ToggleGroupItem>
                    </ToggleGroup>
                    <AddRulemakingProjectDialog allUsers={allUsers} />
                 </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-6">
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
            
            <main>
                 {viewMode === 'card' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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
        </main>
        </TooltipProvider>
    );
}

    
