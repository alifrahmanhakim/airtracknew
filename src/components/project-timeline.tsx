
'use client';

import * as React from 'react';
import {
  format,
  parseISO,
  eachMonthOfInterval,
  differenceInDays,
  addDays,
  startOfMonth,
  endOfMonth,
  differenceInCalendarMonths,
} from 'date-fns';
import { cn } from '@/lib/utils';
import type { Task, User } from '@/lib/types';
import { GanttChartSquare, ListTodo } from 'lucide-react';
import { findUserById } from '@/lib/data';
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
  const timelineRef = React.useRef<HTMLDivElement>(null);

  const { sortedTasks, months, timelineStart, timelineEnd } = React.useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return { sortedTasks: [], months: [], timelineStart: new Date(), timelineEnd: new Date() };
    }

    const sorted = [...tasks].sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime());
    const dueDates = sorted.map(t => parseISO(t.dueDate));
    
    let startDate = dueDates[0];
    let endDate = dueDates[dueDates.length - 1];
    
    // Ensure timeline shows at least 3 months for better context
    if (differenceInCalendarMonths(endDate, startDate) < 2) {
      endDate = addDays(startDate, 90);
    } else {
      endDate = addDays(endDate, 30); // Add a little buffer to the end
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
  
  const statusConfig: { [key in Task['status']]: { color: string; label: string } } = {
    'Done': { color: 'bg-green-500 hover:bg-green-600', label: 'Done' },
    'In Progress': { color: 'bg-blue-500 hover:bg-blue-600', label: 'In Progress' },
    'To Do': { color: 'bg-gray-400 hover:bg-gray-500', label: 'To Do' },
    'Blocked': { color: 'bg-red-500 hover:bg-red-600', label: 'Blocked' },
  };

  const totalTimelineDays = differenceInDays(timelineEnd, timelineStart) + 1;

  const getDaysInMonth = (month: Date) => {
    return differenceInDays(endOfMonth(month), startOfMonth(month)) + 1;
  };

  const totalWidth = months.length * 200; // 200px per month

  return (
    <TooltipProvider>
      <div ref={timelineRef} className="overflow-x-auto border-t">
        <div
          className="relative grid grid-cols-1 gap-y-1 py-4"
          style={{ width: `${totalWidth}px` }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 grid bg-card" style={{ gridTemplateColumns: `250px repeat(${months.length}, 1fr)` }}>
            <div className="flex items-center gap-2 p-2 border-b border-r font-semibold text-muted-foreground">
                <GanttChartSquare className="w-5 h-5" />
                <span>Task / Assignee</span>
            </div>
            {months.map((month) => (
              <div key={month.toString()} className="p-2 border-b text-center font-semibold text-muted-foreground">
                {format(month, 'MMMM yyyy')}
              </div>
            ))}
          </div>

          {/* Grid Lines */}
          <div className="absolute inset-0 top-14 grid h-full -z-1" style={{ gridTemplateColumns: `250px 1fr` }}>
            <div className="border-r"></div>
            <div className="grid" style={{gridTemplateColumns: `repeat(${months.length}, 1fr)`}}>
              {months.map((_, index) => (
                <div key={index} className="border-r h-full"></div>
              ))}
            </div>
          </div>
          
          {/* Task Rows */}
          {sortedTasks.map((task) => {
            const taskStart = parseISO(task.dueDate);
            const startOffsetDays = differenceInDays(taskStart, timelineStart);
            const startPercentage = (startOffsetDays / totalTimelineDays) * 100;
            const assignee = findUserById(task.assigneeId);

            return (
              <div key={task.id} className="contents group">
                {/* Task Title Cell */}
                <div className="flex flex-col justify-center p-2 border-b border-r truncate text-sm">
                   <p className="font-medium truncate">{task.title}</p>
                   <p className="text-muted-foreground truncate text-xs">{assignee?.name || 'Unassigned'}</p>
                </div>

                {/* Task Bar Cell */}
                <div className="relative flex items-center pr-2 border-b">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "absolute h-10 rounded-md text-white flex items-center justify-between px-3 cursor-pointer transition-all duration-200 shadow-md",
                          statusConfig[task.status].color
                        )}
                        style={{
                            left: `calc(${startPercentage}% - 40px)`, // Adjust position to center on due date
                            width: `120px` // Fixed width for task bar
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
      <div className="flex flex-wrap gap-x-4 gap-y-2 items-center mt-4 px-4 pb-2 text-xs border-t pt-2">
        <span className="text-sm font-semibold">Legend:</span>
        {Object.entries(statusConfig).map(([status, { color, label }]) => (
          <div key={status} className="flex items-center gap-2">
            <div className={cn('h-3 w-3 rounded-full', color.split(' ')[0])}></div>
            <span className="text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}
