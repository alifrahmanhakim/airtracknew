
'use client';

import * as React from 'react';
import type { User, Task } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { getISOWeek, startOfWeek, endOfWeek, parseISO, format, eachDayOfInterval, isSameDay, getDay, isWithinInterval, addWeeks, subWeeks, differenceInDays, isBefore, startOfDay } from 'date-fns';
import { Activity, ArrowLeft, ArrowRight, BarChart2, Calendar, CheckCircle, Clock, ListTodo, User as UserIcon, Zap } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { AnimatedCounter } from './ui/animated-counter';
import { ProjectTimeline } from './project-timeline';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

type AssignedTask = Task & {
  projectId: string;
  projectName: string;
  projectType: Project['projectType'];
};

interface MyTasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  tasks: AssignedTask[];
}

const getPaceAndWorkload = (tasks: AssignedTask[]) => {
    const today = new Date();
    const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 });
    const endOfThisWeek = endOfWeek(today, { weekStartsOn: 1 });

    const tasksCompletedThisWeek = tasks.filter(t => 
        t.status === 'Done' && t.doneDate && isWithinInterval(parseISO(t.doneDate), { start: startOfThisWeek, end: endOfThisWeek })
    ).length;

    const openTasks = tasks.filter(t => t.status !== 'Done');
    
    let workloadScore = 0;
    openTasks.forEach(task => {
        const daysUntilDue = differenceInDays(parseISO(task.dueDate), today);
        if (daysUntilDue < 0) workloadScore += 5; // Overdue
        else if (daysUntilDue <= 3) workloadScore += 4; // Due very soon
        else if (daysUntilDue <= 7) workloadScore += 3; // Due this week
        else workloadScore += 1; // Due later
    });

    let workloadLabel: string;
    if (workloadScore > 20) workloadLabel = 'Overloaded';
    else if (workloadScore > 10) workloadLabel = 'High';
    else if (workloadScore > 5) workloadLabel = 'Normal';
    else workloadLabel = 'Low';
    
    return { pace: tasksCompletedThisWeek, workloadScore, workloadLabel };
};


export function MyTasksDialog({ open, onOpenChange, user, tasks }: MyTasksDialogProps) {
    const { pace, workloadScore, workloadLabel } = React.useMemo(() => getPaceAndWorkload(tasks), [tasks]);
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Done').length;
    const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const isUserOnline = user.lastOnline ? (new Date().getTime() - new Date(user.lastOnline).getTime()) / (1000 * 60) < 5 : false;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[80vw] h-[80vh] max-w-[1200px] flex flex-col bg-white/80 dark:bg-black/80 backdrop-blur-sm p-0 border-border/20 rounded-lg">
                <DialogHeader className="p-6 pb-2 flex flex-row items-center gap-4">
                    <Avatar className="h-16 w-16" online={isUserOnline}>
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback><UserIcon /></AvatarFallback>
                    </Avatar>
                    <div className='flex-1'>
                        <p className="text-muted-foreground">{user.name}</p>
                        <DialogTitle className="text-2xl">My Tasks Overview</DialogTitle>
                        <DialogDescription>A summary of your workload, pace, and schedule.</DialogDescription>
                    </div>
                </DialogHeader>
                <TooltipProvider>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 p-6 pt-0 overflow-y-auto">
                        <div className="md:col-span-1 space-y-6">
                            <Card className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
                                 <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <BarChart2 className="h-5 w-5"/>
                                        Statistics
                                    </CardTitle>
                                 </CardHeader>
                                 <CardContent className="space-y-4">
                                    <div>
                                        <div className="flex justify-between items-baseline mb-1">
                                            <p className="text-sm font-medium">Task Completion</p>
                                            <p className="text-sm text-muted-foreground">{completedTasks} / {totalTasks}</p>
                                        </div>
                                        <Progress value={completionPercentage} />
                                    </div>
                                     <div className="flex items-center gap-4 p-3 rounded-lg bg-muted">
                                        <Zap className="h-6 w-6 text-primary"/>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Pace (Tasks This Week)</p>
                                            <p className="text-base font-bold"><AnimatedCounter endValue={pace} /></p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-3 rounded-lg bg-muted">
                                        <Activity className="h-6 w-6 text-primary"/>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Workload</p>
                                            <p className="text-base font-bold">{workloadLabel} ({workloadScore})</p>
                                        </div>
                                    </div>
                                 </CardContent>
                            </Card>
                             <Card className="bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2"><ListTodo className="h-5 w-5" /> All Open Tasks</CardTitle>
                                </CardHeader>
                                <CardContent className="max-h-60 overflow-y-auto">
                                    <div className="space-y-2">
                                        {tasks.filter(t => t.status !== 'Done').map(task => {
                                            const isOverdue = isBefore(parseISO(task.dueDate), startOfDay(new Date()));
                                            const daysOverdue = isOverdue ? differenceInDays(startOfDay(new Date()), parseISO(task.dueDate)) : 0;
                                            const taskColorClass = 
                                                isOverdue ? 'bg-red-100 dark:bg-red-900/30' :
                                                task.status === 'In Progress' ? 'bg-blue-100 dark:bg-blue-900/30' :
                                                'bg-muted/50';

                                            return (
                                                <div key={task.id} className={cn("text-sm p-2 rounded-md", taskColorClass)}>
                                                    <div className="flex justify-between items-start">
                                                        <p className="font-semibold truncate pr-2">{task.title}</p>
                                                        {isOverdue && (
                                                            <span className="text-xs font-bold text-red-600 whitespace-nowrap">
                                                                {daysOverdue}d overdue
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">{task.projectName}</p>
                                                </div>
                                            )
                                        })}
                                        {tasks.filter(t => t.status !== 'Done').length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No open tasks!</p>}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="md:col-span-3 h-full flex flex-col">
                             <ProjectTimeline tasks={tasks} teamMembers={[user]} open={open} />
                        </div>
                    </div>
                </TooltipProvider>
            </DialogContent>
        </Dialog>
    );
}
