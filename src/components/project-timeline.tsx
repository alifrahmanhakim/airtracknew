
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
  isSameMonth,
  isToday
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
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

type ProjectTimelineProps = {
  projectId: string;
  tasks: Task[];
  teamMembers: User[];
  onTaskUpdate: (updatedTask: Task) => void;
};

export function ProjectTimeline({ projectId, tasks, teamMembers, onTaskUpdate }: ProjectTimelineProps) {
  const timelineRef = React.useRef<HTMLDivElement>(null);
  const todayRef = React.useRef<HTMLDivElement>(null);

  const { sortedTasks, months, timelineStart, timelineEnd, days } = React.useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return { sortedTasks: [], months: [], timelineStart: new Date(), timelineEnd: new Date(), days: [] };
    }

    const sorted = [...tasks].sort((a, b) => {
        const dateA = parseISO(a.dueDate).getTime();
        const dateB = parseISO(b.dueDate).getTime();
        if (dateA === dateB) {
            return a.title.localeCompare(b.title);
        }
        return dateA - dateB;
    });

    const dueDates = sorted.map(t => parseISO(t.dueDate));
    
    let startDate = dueDates.length > 0 ? dueDates[0] : new Date();
    let endDate = dueDates.length > 0 ? dueDates[dueDates.length - 1] : new Date();
    
    // Add buffer to start and end
    startDate = addDays(startDate, -14);
    endDate = addDays(endDate, 14);

    const tStart = startOfMonth(startDate);
    const tEnd = endOfMonth(endDate);
    
    const monthInterval = eachMonthOfInterval({
      start: tStart,
      end: tEnd,
    });

    const dayArray = Array.from({ length: differenceInDays(tEnd, tStart) + 1 }, (_, i) => addDays(tStart, i));

    return { sortedTasks: sorted, months: monthInterval, timelineStart: tStart, timelineEnd: tEnd, days: dayArray };
  }, [tasks]);

   React.useEffect(() => {
    if (todayRef.current) {
      // Scroll to today's marker
      todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
  }, [days]);

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

  const DAY_WIDTH = 40; // width of a single day column in pixels
  const ROW_HEIGHT = 52; // height of a single task row in pixels
  const HEADER_HEIGHT = 70; // height of the month and day headers
  const totalWidth = days.length * DAY_WIDTH;

  const getDaysInMonth = (date: Date) => differenceInDays(endOfMonth(date), startOfMonth(date)) + 1;

  // Group tasks to avoid overlap
  const taskLayouts = React.useMemo(() => {
    const layouts: { task: Task; top: number; left: number; width: number }[] = [];
    const occupiedLanes: { end: number }[] = [];

    sortedTasks.forEach(task => {
        const taskStartOffset = differenceInDays(parseISO(task.dueDate), timelineStart);
        let laneIndex = 0;

        while (true) {
            if (!occupiedLanes[laneIndex] || occupiedLanes[laneIndex].end < taskStartOffset) {
                occupiedLanes[laneIndex] = { end: taskStartOffset + 3 }; // +3 for task bar width in days
                break;
            }
            laneIndex++;
        }

        layouts.push({
            task: task,
            top: HEADER_HEIGHT + laneIndex * ROW_HEIGHT,
            left: taskStartOffset * DAY_WIDTH,
            width: 3 * DAY_WIDTH, // Make task bars span 3 days for visibility
        });
    });

    return { layouts, totalHeight: HEADER_HEIGHT + occupiedLanes.length * ROW_HEIGHT };
  }, [sortedTasks, timelineStart, days]);


  return (
    <TooltipProvider>
      <div ref={timelineRef} className="overflow-x-auto border-t w-full">
        <div
          className="relative bg-background"
          style={{ width: `${totalWidth}px`, height: `${taskLayouts.totalHeight}px` }}
        >
          {/* Month Headers */}
          <div className="sticky top-0 z-20 flex h-8 bg-card border-b">
            {months.map((month) => (
              <div key={month.toString()} className="flex-shrink-0 text-center font-semibold text-sm flex items-center justify-center border-r"
                style={{ width: `${getDaysInMonth(month) * DAY_WIDTH}px` }}
              >
                {format(month, 'MMMM yyyy')}
              </div>
            ))}
          </div>

          {/* Day Headers and Grid Lines */}
          <div className="sticky top-8 z-20 flex h-8 bg-card border-b">
             {days.map((day, index) => (
              <div key={index} className="flex-shrink-0 flex flex-col items-center justify-center border-r" style={{ width: `${DAY_WIDTH}px` }}>
                <span className={cn("text-xs", {'font-bold text-primary': isToday(day)})}>{format(day, 'd')}</span>
                <span className="text-xs text-muted-foreground">{format(day, 'E')[0]}</span>
              </div>
            ))}
          </div>
          
           {/* Vertical Grid Lines for days */}
          <div className="absolute top-0 left-0 h-full -z-10">
             {days.map((day, index) => (
              <div key={index} className="absolute top-0 h-full border-r" style={{ left: `${(index + 1) * DAY_WIDTH}px` }} />
            ))}
          </div>
          
           {/* Today Marker */}
          {days.findIndex(isToday) !== -1 && (
             <div ref={todayRef} className="absolute top-0 bottom-0 w-1 bg-primary/50 z-0" style={{ left: `${days.findIndex(isToday) * DAY_WIDTH + (DAY_WIDTH / 2)}px` }} >
                <div className="sticky top-0 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-b-md z-30">
                    Today
                </div>
            </div>
          )}


          {/* Task Bars */}
          <div className="relative w-full" style={{ height: `${taskLayouts.totalHeight - HEADER_HEIGHT}px` }}>
            {taskLayouts.layouts.map(({ task, top, left, width }) => {
                const assignee = findUserById(task.assigneeId);
                return (
                <Tooltip key={task.id}>
                    <TooltipTrigger asChild>
                    <div
                        className={cn(
                        "absolute h-10 rounded-md text-white flex items-center justify-between px-3 cursor-pointer transition-all duration-200 shadow group",
                        statusConfig[task.status].color
                        )}
                        style={{
                            top: `${top - HEADER_HEIGHT + 6}px`,
                            left: `${left}px`,
                            width: `${width}px`,
                        }}
                    >
                        <p className="text-xs font-semibold truncate flex-1">{task.title}</p>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity pl-2">
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
                        <p className="font-bold">{task.title}</p>
                        <div className="flex items-center gap-2 mt-2">
                            {assignee && <Avatar className="h-6 w-6">
                                <AvatarImage src={assignee.avatarUrl} data-ai-hint="person portrait" />
                                <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
                            </Avatar>}
                            <div>
                                <p className="font-semibold">{assignee?.name || 'Unassigned'}</p>
                                <p className="text-sm"><span className="font-semibold">Due:</span> {format(parseISO(task.dueDate), 'PPP')}</p>
                            </div>
                        </div>
                    </TooltipContent>
                </Tooltip>
                );
            })}
          </div>
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
