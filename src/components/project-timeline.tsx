
'use client';

import * as React from 'react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Task } from '@/lib/types';
import { CheckCircle, Clock, XCircle, CircleDotDashed, ListTodo } from 'lucide-react';
import { findUserById } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

type ProjectTimelineProps = {
  tasks: Task[];
};

export function ProjectTimeline({ tasks }: ProjectTimelineProps) {
  const sortedTasks = React.useMemo(() => {
    if (!tasks) return [];
    return [...tasks].sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime());
  }, [tasks]);

  const statusMap: { [key in Task['status']]: { icon: React.ElementType; color: string; } } = {
    'Done': { icon: CheckCircle, color: 'text-green-500' },
    'In Progress': { icon: Clock, color: 'text-blue-500' },
    'To Do': { icon: CircleDotDashed, color: 'text-gray-500' },
    'Blocked': { icon: XCircle, color: 'text-red-500' },
  };

  if (sortedTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-10 text-muted-foreground">
        <ListTodo className="h-12 w-12 mb-4" />
        <p className="font-semibold">No Tasks Yet</p>
        <p className="text-sm">Add tasks to this project to see them on the timeline.</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
        <div className="relative pl-4 py-4 before:absolute before:left-8 before:top-0 before:h-full before:w-0.5 before:bg-border">
        {sortedTasks.map((task, index) => {
            const StatusIcon = statusMap[task.status].icon;
            const statusColor = statusMap[task.status].color;
            const assignee = findUserById(task.assigneeId);
            return (
            <div key={task.id} className="relative mb-6 flex items-start gap-4">
                <div className={cn("absolute left-8 top-1.5 h-5 w-5 rounded-full bg-background border-2 -translate-x-1/2", statusMap[task.status].color.replace('text-', 'border-'))}>
                    <StatusIcon className={cn("h-full w-full p-0.5", statusColor)} />
                </div>
                <div className="pl-12 w-full">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{task.title}</p>
                    <div className="flex items-center gap-2">
                        {assignee && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={assignee.avatarUrl} alt={assignee.name} data-ai-hint="person portrait" />
                                        <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{assignee.name}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        <p className="text-xs text-muted-foreground">{format(parseISO(task.dueDate), 'dd MMM yyyy')}</p>
                    </div>
                </div>
                </div>
            </div>
            );
        })}
        </div>
    </TooltipProvider>
  );
}
