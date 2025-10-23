
'use client';

import * as React from 'react';
import type { User, Task } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { getISOWeek, startOfWeek, endOfWeek, parseISO, format, eachDayOfInterval, isSameDay, getDay, isWithinInterval, addWeeks, subWeeks, differenceInDays } from 'date-fns';
import { Activity, ArrowLeft, ArrowRight, BarChart2, Calendar, CheckCircle, Clock, ListTodo, Zap } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { AnimatedCounter } from './ui/animated-counter';
import { ProjectTimeline } from './project-timeline';

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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl h-[90vh] flex flex-col bg-background/80 backdrop-blur-sm">
                <DialogHeader>
                    <DialogTitle className="text-2xl">My Tasks Overview</DialogTitle>
                    <DialogDescription>A summary of your workload, pace, and schedule.</DialogDescription>
                </DialogHeader>
                <TooltipProvider>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 overflow-y-auto pr-2">
                        <div className="md:col-span-1 space-y-6">
                            <Card>
                                 <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
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
                                            <p className="text-xl font-bold"><AnimatedCounter endValue={pace} /></p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-3 rounded-lg bg-muted">
                                        <Activity className="h-6 w-6 text-primary"/>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Workload</p>
                                            <p className="text-xl font-bold">{workloadLabel} ({workloadScore})</p>
                                        </div>
                                    </div>
                                 </CardContent>
                            </Card>
                             <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2"><ListTodo className="h-5 w-5" /> All Open Tasks</CardTitle>
                                </CardHeader>
                                <CardContent className="max-h-60 overflow-y-auto">
                                    <div className="space-y-2">
                                        {tasks.filter(t => t.status !== 'Done').map(task => (
                                            <div key={task.id} className="text-sm p-2 rounded-md bg-muted/50">
                                                <p className="font-semibold truncate">{task.title}</p>
                                                <p className="text-xs text-muted-foreground">{task.projectName}</p>
                                            </div>
                                        ))}
                                        {tasks.filter(t => t.status !== 'Done').length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No open tasks!</p>}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="md:col-span-3">
                             <ProjectTimeline tasks={tasks} teamMembers={[user]} open={open} />
                        </div>
                    </div>
                </TooltipProvider>
            </DialogContent>
        </Dialog>
    );
}
