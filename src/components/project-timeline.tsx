
'use client';

import * as React from 'react';
import {
  format,
  parseISO,
  eachMonthOfInterval,
  differenceInCalendarMonths,
  differenceInDays,
  addDays,
  startOfMonth,
  endOfMonth,
  isAfter,
} from 'date-fns';
import { cn } from '@/lib/utils';
import type { Task, User } from '@/lib/types';
import { ListTodo, GanttChartSquare } from 'lucide-react';
import { findUserById } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { EditTaskDialog } from './edit-task-dialog';

type ProjectTimelineProps = {
  projectId: string;
  tasks: Task[];
  teamMembers: User[];
  onTaskUpdate: (updatedTask: Task) => void;
};

export function ProjectTimeline({ projectId, tasks, teamMembers, onTaskUpdate }: ProjectTimelineProps) {
  const { sortedTasks, months, timelineStart, timelineEnd } = React.useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return { sortedTasks: [], months: [], timelineStart: new Date(), timelineEnd: new Date() };
    }

    const sorted = [...tasks].sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime());

    const dueDates = sorted.map(t => parseISO(t.dueDate));
    const startDate = dueDates[0];
    let endDate = dueDates[dueDates.length - 1];
    
    // Ensure timeline shows at least 3 months for better visualization
    if (differenceInCalendarMonths(endDate, startDate) < 2) {
      endDate = addDays(startDate, 90);
    }

    const tStart = startOfMonth(startDate);
    const tEnd = endOfMonth(endDate);
    
    const monthInterval = eachMonthOfInterval({
      start: tStart,
      end: tEnd,
    });

    return { sortedTasks: sorted, months: monthInterval, timelineStart: tStart, timelineEnd: tEnd };
  }, [tasks]);

  if (sortedTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-10 text-muted-foreground">
        <ListTodo className="h-12 w-12 mb-4" />
        <p className="font-semibold">No Tasks Yet</p>
        <p className="text-sm">Add tasks to this project to see them on the timeline.</p>
      </div>
    );
  }
  
  const statusColor: { [key in Task['status']]: string } = {
    'Done': 'bg-green-500 hover:bg-green-600',
    'In Progress': 'bg-blue-500 hover:bg-blue-600',
    'To Do': 'bg-gray-400 hover:bg-gray-500',
    'Blocked': 'bg-red-500 hover:bg-red-600',
  }

  const totalTimelineDays = differenceInDays(timelineEnd, timelineStart) + 1;

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <div className="relative grid grid-cols-1 gap-y-2 py-4" style={{ minWidth: `${months.length * 150}px` }}>
          {/* Header */}
          <div className="sticky top-0 z-10 grid bg-card" style={{ gridTemplateColumns: `200px repeat(${months.length}, 1fr)`}}>
            <div className="flex items-center gap-2 p-2 border-b border-r font-semibold text-muted-foreground">
                <GanttChartSquare className="w-5 h-5" />
                <span>Task Name</span>
            </div>
            {months.map((month) => (
              <div key={month.toString()} className="p-2 border-b text-center font-semibold text-muted-foreground">
                {format(month, 'MMM yyyy')}
              </div>
            ))}
          </div>

          {/* Body */}
          <div className="relative grid" style={{ gridTemplateColumns: `200px 1fr` }}>
            {/* Grid Lines */}
             <div className="absolute inset-0 grid h-full" style={{ gridTemplateColumns: `200px repeat(${months.length}, 1fr)` }}>
                <div className="border-r"></div>
                {months.map((_, index) => (
                    <div key={index} className="border-r"></div>
                ))}
            </div>
            
            {/* Task Rows */}
            {sortedTasks.map((task) => {
              const taskStart = parseISO(task.dueDate);
              
              const startOffsetDays = differenceInDays(taskStart, timelineStart);
              const startPercentage = (startOffsetDays / totalTimelineDays) * 100;

              const assignee = findUserById(task.assigneeId);

              return (
                <div key={task.id} className="contents group">
                  {/* Task Title */}
                  <div className="flex items-center p-2 border-b border-r truncate">
                     <p className="font-medium truncate text-sm">{task.title}</p>
                  </div>

                  {/* Task Bar */}
                  <div className="relative flex items-center p-2 border-b">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div
                                className={cn(
                                    "absolute h-8 rounded-md text-white flex items-center justify-between px-2 cursor-pointer transition-all duration-200",
                                    statusColor[task.status]
                                )}
                                style={{
                                    left: `calc(${startPercentage}% + 8px)`,
                                    width: `100px` // Fixed width for now for simplicity, represents due date marker
                                }}
                            >
                                <span className="text-xs font-semibold truncate">{task.status}</span>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <EditTaskDialog
                                        projectId={projectId}
                                        task={task}
                                        teamMembers={teamMembers}
                                        onTaskUpdate={onTaskUpdate}
                                    />
                                </div>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="font-semibold">{task.title}</p>
                            <p>Due: {format(taskStart, 'PPP')}</p>
                            {assignee && <p>Assignee: {assignee.name}</p>}
                        </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
