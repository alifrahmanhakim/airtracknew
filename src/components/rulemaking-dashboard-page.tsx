
'use client';

import type { Project, User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Search, CheckCircle, Clock, AlertTriangle, List, AlertCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { AddProjectDialog } from './add-project-dialog';

type RulemakingDashboardPageProps = {
    projects: Project[];
    allUsers: User[];
}

const statusConfig: { [key in Project['status']]: { icon: React.ElementType, color: string, label: string } } = {
    'Completed': { icon: CheckCircle, color: 'text-green-500', label: 'Completed' },
    'On Track': { icon: Clock, color: 'text-blue-500', label: 'In Progress' },
    'At Risk': { icon: AlertTriangle, color: 'text-yellow-500', label: 'Review Needed' }, // Mapped to Review/Pending
    'Off Track': { icon: AlertCircle, color: 'text-red-500', label: 'Off Track' },
  };

export function RulemakingDashboardPage({ projects, allUsers }: RulemakingDashboardPageProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const stats = useMemo(() => {
        const total = projects.length;
        const completed = projects.filter(p => p.status === 'Completed').length;
        const inProgress = projects.filter(p => p.status === 'On Track').length;
        const reviewPending = projects.filter(p => p.status === 'At Risk' || p.status === 'Off Track').length;
        const highPriority = projects.filter(p => p.tags?.includes('High Priority'));

        const distribution = [
            { name: 'Completed', value: completed, color: 'hsl(var(--chart-1))' },
            { name: 'In Progress', value: inProgress, color: 'hsl(var(--chart-2))' },
            { name: 'Review Needed', value: reviewPending, color: 'hsl(var(--chart-3))' }
        ];

        return { total, completed, inProgress, reviewPending, highPriority, distribution };
    }, [projects]);
    
    const filteredProjects = useMemo(() => {
        if (!searchTerm) return projects;
        const lowercasedFilter = searchTerm.toLowerCase();
        return projects.filter(p => 
            p.name.toLowerCase().includes(lowercasedFilter) ||
            p.casr?.toLowerCase().includes(lowercasedFilter) ||
            p.team.some(t => t.name.toLowerCase().includes(lowercasedFilter)) ||
            p.tags?.some(tag => tag.toLowerCase().includes(lowercasedFilter))
        );
    }, [projects, searchTerm]);


    const getTagColor = (tag: string) => {
        const lowerTag = tag.toLowerCase();
        if (lowerTag.includes('priority')) return 'bg-red-100 text-red-800 border-red-200';
        if (lowerTag.includes('review')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        if (lowerTag.includes('core') || lowerTag.includes('process') || lowerTag.includes('operations')) return 'bg-blue-100 text-blue-800 border-blue-200';
        if (lowerTag.includes('finalized') || lowerTag.includes('certification')) return 'bg-green-100 text-green-800 border-green-200';
        return 'bg-gray-100 text-gray-800 border-gray-200';
    };


    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className='mb-4'>
                <h1 className="text-3xl font-bold tracking-tight">Aviation Regulation Management Dashboard</h1>
                <p className="text-muted-foreground">Central hub for tracking compliance and progress of all CASRs.</p>
            </div>
            
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4'>
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by CASR ID, title, team, or tag..." 
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                 <AddProjectDialog allUsers={allUsers} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                                    <p className="text-2xl font-bold">{stats.inProgress}</p>
                                    <p className="text-sm text-muted-foreground">In Progress</p>
                                </div>
                            </div>
                             <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                                <AlertTriangle className="h-6 w-6 text-yellow-500" />
                                <div>
                                    <p className="text-2xl font-bold">{stats.reviewPending}</p>
                                    <p className="text-sm text-muted-foreground">Review/Pending</p>
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
                                {stats.distribution.map(item => (
                                    <div key={item.name} className="flex items-center gap-2">
                                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span>{item.name}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>High Priority Items</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                           {stats.highPriority.length > 0 ? stats.highPriority.map(p => (
                               <Link key={p.id} href={`/projects/${p.id}`}>
                                <div className='p-3 rounded-md bg-red-50 border border-red-200 hover:bg-red-100 cursor-pointer'>
                                    <p className='font-bold text-red-800'>CASR {p.casr}</p>
                                    <p className='text-sm text-red-700 truncate'>{p.name}</p>
                                </div>
                               </Link>
                           )) : (
                               <p className="text-sm text-muted-foreground text-center py-4">No high priority items.</p>
                           )}
                        </CardContent>
                    </Card>
                </aside>

                {/* Main Content */}
                <main className="md:col-span-3 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 content-start">
                   {filteredProjects.map(project => {
                       const totalTasks = project.tasks?.length || 0;
                       const completedTasks = project.tasks?.filter((task) => task.status === 'Done').length || 0;
                       const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
                       const currentStatus = statusConfig[project.status] || statusConfig['On Track'];
                       
                       return (
                        <Card key={project.id} className="flex flex-col hover:shadow-lg transition-shadow duration-300">
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-xl font-bold">
                                        <Link href={`/projects/${project.id}`} className="hover:underline hover:text-primary">
                                            CASR {project.casr}
                                        </Link>
                                    </CardTitle>
                                    <Badge variant="outline" className={cn("text-xs font-semibold border-2", {
                                        "border-green-500/50 bg-green-50 text-green-700": project.status === 'Completed',
                                        "border-blue-500/50 bg-blue-50 text-blue-700": project.status === 'On Track',
                                        "border-yellow-500/50 bg-yellow-50 text-yellow-700": project.status === 'At Risk',
                                        "border-red-500/50 bg-red-50 text-red-700": project.status === 'Off Track',
                                    })}>
                                        <currentStatus.icon className={cn("h-3 w-3 mr-1", currentStatus.color)} />
                                        {currentStatus.label}
                                    </Badge>
                                </div>
                                <CardDescription className="h-10 text-sm">{project.name}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-muted-foreground">Progress</span>
                                        <span className="text-sm font-bold">{Math.round(progress)}%</span>
                                    </div>
                                    <Progress value={progress} />
                                </div>
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={project.team[0]?.avatarUrl} alt={project.team[0]?.name} data-ai-hint="person portrait" />
                                            <AvatarFallback>{project.team[0]?.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span>{project.team[0]?.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5" />
                                        <span>{format(parseISO(project.endDate), 'dd-MM-yyyy')}</span>
                                    </div>
                                </div>
                            </CardContent>
                             <CardFooter className="pt-4 flex flex-wrap gap-2 border-t mt-auto">
                                {project.tags?.map(tag => (
                                    <Badge key={tag} variant="outline" className={cn("font-medium", getTagColor(tag))}>
                                        {tag}
                                    </Badge>
                                ))}
                            </CardFooter>
                        </Card>
                       );
                   })}
                </main>

            </div>
        </main>
    );
}
