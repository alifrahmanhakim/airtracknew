
'use client';

import type { Project, User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Input } from './ui/input';
import { Search, CheckCircle, Clock, AlertTriangle, List, AlertCircle, ArrowRight, Flag, Users, FileText, CalendarCheck2, ListTodo, ArrowDown } from 'lucide-react';
import { useMemo, useState, useRef } from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { AddRulemakingProjectDialog } from './add-rulemaking-project-dialog';
import { rulemakingTaskOptions } from '@/lib/data';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from './ui/tooltip';

type RulemakingDashboardPageProps = {
    projects: Project[];
    allUsers: User[];
}

const statusConfig: { [key in Project['status']]: { icon: React.ElementType, color: string, label: string } } = {
    'Completed': { icon: CheckCircle, color: 'text-green-500', label: 'Completed' },
    'On Track': { icon: Clock, color: 'text-blue-500', label: 'In Progress' },
    'At Risk': { icon: AlertTriangle, color: 'text-yellow-500', label: 'At Risk' },
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

    return (
        <TooltipProvider>
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
                 <AddRulemakingProjectDialog allUsers={allUsers} />
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
                               <Link key={p.id} href={`/projects/${p.id}?type=rulemaking`}>
                                <div className='p-3 rounded-md bg-red-50 border border-red-200 hover:bg-red-100 cursor-pointer dark:bg-red-900/20 dark:border-red-500/30 dark:hover:bg-red-900/30'>
                                    <p className='font-bold text-red-800 dark:text-red-300'>CASR {p.casr}</p>
                                    <p className='text-sm text-red-700 dark:text-red-400 truncate'>{p.name}</p>
                                </div>
                               </Link>
                           )) : (
                               <p className="text-sm text-muted-foreground text-center py-4">No high priority items.</p>
                           )}
                        </CardContent>
                    </Card>
                </aside>
                
                {/* Main Content */}
                 <main className="md:col-span-3">
                     <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                        {filteredProjects.map(project => {
                           const totalTasks = project.tasks?.length || 0;
                           const completedTasks = project.tasks?.filter((task) => task.status === 'Done').length || 0;
                           const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
                           const currentStatus = statusConfig[project.status] || statusConfig['On Track'];
                           const doneTaskTitles = new Set((project.tasks || []).filter(t => t.status === 'Done').map(t => t.title));
                           const currentTaskIndex = rulemakingTaskOptions.findIndex(option => !doneTaskTitles.has(option.value));
                           const currentTask = currentTaskIndex !== -1 ? rulemakingTaskOptions[currentTaskIndex] : null;
                           const nextTask = currentTaskIndex !== -1 && currentTaskIndex < rulemakingTaskOptions.length - 1 ? rulemakingTaskOptions[currentTaskIndex + 1] : null;

                           return (
                                <Link key={project.id} href={`/projects/${project.id}?type=rulemaking`} className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg h-full block">
                                    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
                                        <CardHeader className="pb-4">
                                          <div className="flex justify-between items-start">
                                            <CardTitle className="text-base font-bold">CASR {project.casr}</CardTitle>
                                             <div className="flex items-center gap-2">
                                                {project.tags?.includes('High Priority') && (
                                                    <Badge variant="destructive" className="font-medium">
                                                        High Priority
                                                    </Badge>
                                                )}
                                                <div className="flex items-center gap-1 text-sm font-semibold">
                                                  <currentStatus.icon className={cn("h-4 w-4", currentStatus.color)} />
                                                  <span className={currentStatus.color}>{currentStatus.label}</span>
                                                </div>
                                            </div>
                                          </div>
                                          <CardDescription className="text-xs h-8 line-clamp-2">{project.name}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-grow space-y-4 pt-0">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="font-medium text-muted-foreground">Progress</span>
                                                    <span className="font-bold">{Math.round(progress)}%</span>
                                                </div>
                                                <Progress value={progress} className="h-1.5" />
                                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                    <span>{completedTasks}/{totalTasks} Tasks</span>
                                                    <span>Due: {format(parseISO(project.endDate), 'dd MMM yyyy')}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="text-xs text-muted-foreground pt-2 border-t">
                                              {currentTask ? (
                                                  <div className="grid grid-cols-2 items-start gap-2">
                                                      <div className="flex items-start gap-2">
                                                          <ArrowRight className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                                          <div>
                                                              <p className="font-semibold uppercase text-muted-foreground/80">Current</p>
                                                              <p className="font-semibold text-foreground truncate">{currentTask.label}</p>
                                                          </div>
                                                      </div>
                                                      {nextTask && (
                                                          <div className="flex items-start gap-2 pl-2 border-l">
                                                              <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                                              <div>
                                                                  <p className="font-semibold uppercase text-muted-foreground/80">Next</p>
                                                                  <p className="font-semibold text-muted-foreground truncate">{nextTask.label}</p>
                                                              </div>
                                                          </div>
                                                      )}
                                                  </div>
                                              ) : (
                                                  <div className="flex items-center gap-2">
                                                      <Flag className="h-4 w-4 text-green-600" />
                                                      <span className="font-semibold text-foreground">Finalization</span>
                                                  </div>
                                              )}
                                            </div>
                                        </CardContent>
                                        <CardFooter className="pt-2 flex justify-between items-center mt-auto">
                                           <div className="flex items-center -space-x-2">
                                                {project.team.slice(0, 5).map(member => (
                                                    <Tooltip key={member.id}>
                                                        <TooltipTrigger asChild>
                                                            <Avatar className="h-6 w-6 border-2 border-background">
                                                                <AvatarImage src={member.avatarUrl} alt={member.name} data-ai-hint="person portrait" />
                                                                <AvatarFallback>{member.name?.charAt(0) || '?'}</AvatarFallback>
                                                            </Avatar>
                                                        </TooltipTrigger>
                                                        <TooltipContent>{member.name}</TooltipContent>
                                                    </Tooltip>
                                                ))}
                                                {project.team.length > 5 && (
                                                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-semibold z-10 border-2 border-background">
                                                    +{project.team.length - 5}
                                                  </div>
                                                )}
                                            </div>
                                        </CardFooter>
                                    </Card>
                                </Link>
                           );
                       })}
                    </div>
                </main>
            </div>
        </main>
        </TooltipProvider>
    );
}
