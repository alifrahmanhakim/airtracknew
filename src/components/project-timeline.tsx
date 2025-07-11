
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
  isToday,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  isSameMonth,
} from 'date-fns';
import { cn } from '@/lib/utils';
import type { Task, User } from '@/lib/types';
import { ListTodo, GanttChartSquare } from 'lucide-react';
import { findUserById } from '@/lib/data';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { EditTaskDialog } from './edit-task-dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';

type ProjectTimelineProps = {
  projectId: string;
  tasks: Task[];
  teamMembers: User[];
  onTaskUpdate: (updatedTask: Task) => void;
};

type ViewMode = 'month' | 'day';

export function ProjectTimeline({ projectId, tasks, teamMembers, onTaskUpdate }: ProjectTimelineProps) {
  const timelineRef = React.useRef<HTMLDivElement>(null);
  const todayRef = React.useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = React.useState<ViewMode>('month');

  const { sortedTasks, months, days, timelineStart, timelineEnd } = React.useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return { sortedTasks: [], months: [], days: [], timelineStart: new Date(), timelineEnd: new Date() };
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
    
    const tStart = startOfYear(startDate);
    const tEnd = endOfYear(endDate);
    
    const monthInterval = eachMonthOfInterval({ start: tStart, end: tEnd });
    const dayInterval = eachDayOfInterval({ start: tStart, end: tEnd });

    return { sortedTasks: sorted, months: monthInterval, days: dayInterval, timelineStart: tStart, timelineEnd: tEnd };
  }, [tasks]);

   React.useEffect(() => {
    if (todayRef.current && timelineRef.current) {
        const timelineWidth = timelineRef.current.offsetWidth;
        const todayPosition = todayRef.current.offsetLeft;
        
        timelineRef.current.scrollTo({
            left: todayPosition - timelineWidth / 2,
            behavior: 'smooth',
        });
    }
   }, [viewMode, days, months]);

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

  const DAY_WIDTH = 40;
  const MONTH_WIDTH = 120;
  const ROW_HEIGHT = 52;
  const HEADER_HEIGHT = 70;
  
  const getDaysInMonth = (date: Date) => differenceInDays(endOfMonth(date), startOfMonth(date)) + 1;

  const totalWidth = viewMode === 'day' 
    ? days.length * DAY_WIDTH 
    : months.length * MONTH_WIDTH;

  const taskLayouts = React.useMemo(() => {
    const layouts: { task: Task; top: number; left: number; width: number }[] = [];
    const occupiedLanes: { end: number }[] = [];

    sortedTasks.forEach(task => {
        let taskStartOffset: number;
        
        const taskDueDate = parseISO(task.dueDate);

        if (viewMode === 'day') {
            taskStartOffset = differenceInDays(taskDueDate, timelineStart);
        } else { // month view
            const monthIndex = taskDueDate.getMonth() - timelineStart.getMonth() + 12 * (taskDueDate.getFullYear() - timelineStart.getFullYear());
            const dayInMonth = taskDueDate.getDate();
            const daysInMonth = getDaysInMonth(taskDueDate);
            taskStartOffset = (monthIndex * MONTH_WIDTH) + ((dayInMonth / daysInMonth) * MONTH_WIDTH);
        }

        let laneIndex = 0;
        
        while (true) {
            const currentOffset = viewMode === 'day' ? taskStartOffset * DAY_WIDTH : taskStartOffset;
            if (!occupiedLanes[laneIndex] || occupiedLanes[laneIndex].end < currentOffset) {
                const taskWidth = viewMode === 'day' ? 3 * DAY_WIDTH : MONTH_WIDTH / 2;
                occupiedLanes[laneIndex] = { end: currentOffset + taskWidth + 10 /* gap */ };
                break;
            }
            laneIndex++;
        }
        
        const taskWidth = viewMode === 'day' ? 3 * DAY_WIDTH : MONTH_WIDTH / 2;

        layouts.push({
            task: task,
            top: HEADER_HEIGHT + laneIndex * ROW_HEIGHT,
            left: viewMode === 'day' ? taskStartOffset * DAY_WIDTH : taskStartOffset,
            width: taskWidth,
        });
    });

    return { layouts, totalHeight: HEADER_HEIGHT + occupiedLanes.length * ROW_HEIGHT };
  }, [sortedTasks, timelineStart, days, months, viewMode]);

  return (
    <TooltipProvider>
      <div className="p-4 border-t flex justify-between items-center">
        <RadioGroup defaultValue={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)} className="flex items-center gap-4">
           <div>
            <RadioGroupItem value="month" id="r-month" className="peer sr-only" />
            <Label htmlFor="r-month" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
              Month View
            </Label>
          </div>
          <div>
            <RadioGroupItem value="day" id="r-day" className="peer sr-only" />
            <Label htmlFor="r-day" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
              Day View
            </Label>
          </div>
        </RadioGroup>
        <div className="flex flex-wrap gap-x-4 gap-y-2 items-center text-xs">
            <span className="text-sm font-semibold">Legend:</span>
            {Object.entries(statusConfig).map(([status, { color, label }]) => (
            <div key={status} className="flex items-center gap-2">
                <div className={cn('h-3 w-3 rounded-full', color.split(' ')[0])}></div>
                <span className="text-muted-foreground">{label}</span>
            </div>
            ))}
        </div>
      </div>
      <div ref={timelineRef} className="overflow-x-auto border-t w-full">
        <div
          className="relative bg-background"
          style={{ width: `${totalWidth}px`, height: `${taskLayouts.totalHeight}px` }}
        >
          {/* Headers */}
          <div className="sticky top-0 z-20 flex h-16 bg-card border-b">
             {viewMode === 'day' ? (
                // Day View Headers
                 days.map((day, index) => {
                    const monthLabel = format(day, 'MMMM yyyy');
                    const isFirstDayOfMonth = day.getDate() === 1;
                    return (
                        <div key={index} className="flex-shrink-0 flex flex-col items-center justify-center border-r relative" style={{ width: `${DAY_WIDTH}px` }}>
                            {isFirstDayOfMonth && <span className="absolute -top-4 text-center font-semibold text-xs">{monthLabel}</span>}
                            <span className={cn("text-xs", {'font-bold text-primary': isToday(day)})}>{format(day, 'd')}</span>
                            <span className="text-xs text-muted-foreground">{format(day, 'E')[0]}</span>
                        </div>
                    );
                 })
             ) : (
                // Month View Headers
                months.map((month) => (
                    <div key={month.toString()} className="flex-shrink-0 text-center font-semibold text-sm flex items-center justify-center border-r"
                        style={{ width: `${MONTH_WIDTH}px` }}
                    >
                        {format(month, 'MMM yyyy')}
                    </div>
                ))
             )}
          </div>
          
           {/* Vertical Grid Lines */}
          <div className="absolute top-0 left-0 h-full -z-10">
            {viewMode === 'day' ? 
              days.map((day, index) => (
                  <div key={index} className="absolute top-0 h-full border-r" style={{ left: `${(index + 1) * DAY_WIDTH}px` }} />
              )) :
              months.map((month, index) => (
                  <div key={index} className="absolute top-0 h-full border-r" style={{ left: `${(index + 1) * MONTH_WIDTH}px` }} />
              ))
            }
          </div>
          
           {/* Today Marker */}
            {(() => {
                const todayIndex = days.findIndex(isToday);
                if (todayIndex === -1) return null;

                const todayLeft = viewMode === 'day' 
                    ? todayIndex * DAY_WIDTH + (DAY_WIDTH / 2)
                    : months.findIndex(m => isSameMonth(m, new Date())) * MONTH_WIDTH + ((new Date().getDate()-1) / getDaysInMonth(new Date())) * MONTH_WIDTH;

                return (
                    <div ref={todayRef} className="absolute top-0 bottom-0 w-1 bg-primary/50 z-0" style={{ left: `${todayLeft}px` }} >
                        <div className="sticky top-0 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-b-md z-30">
                            Today
                        </div>
                    </div>
                );
            })()}

          {/* Task Bars */}
          <div className="relative w-full" style={{ height: `${taskLayouts.totalHeight - HEADER_HEIGHT}px` }}>
            {taskLayouts.layouts.map(({ task, top, left, width }) => {
                const assignee = findUserById(task.assigneeId);
                return (
                <Tooltip key={task.id}>
                    <TooltipTrigger asChild>
                    <div
                        className={cn(
                        "absolute h-10 rounded-md text-white flex items-center justify-start gap-2 px-3 cursor-pointer transition-all duration-200 shadow group",
                        statusConfig[task.status].color
                        )}
                        style={{
                            top: `${top - HEADER_HEIGHT + 6}px`,
                            left: `${left}px`,
                            width: `${width}px`,
                        }}
                    >
                        <p className="text-xs font-semibold truncate">{task.title}</p>
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
    </TooltipProvider>
  );
}
