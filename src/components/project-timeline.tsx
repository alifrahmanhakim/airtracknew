
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
  startOfISOWeek,
  endOfISOWeek,
  eachDayOfInterval,
  isSameMonth,
  max,
  min,
  addMonths,
  isSameDay,
  startOfDay,
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

const TASK_LIST_WIDTH = 250;
const DAY_WIDTH_MONTH_VIEW = 4; // Smaller width for days in month view
const DAY_WIDTH_DAY_VIEW = 40; // Larger width for days in day view
const ROW_HEIGHT = 52;
const HEADER_HEIGHT = 64; // Adjusted for two-line header

export function ProjectTimeline({ projectId, tasks, teamMembers, onTaskUpdate }: ProjectTimelineProps) {
  const timelineRef = React.useRef<HTMLDivElement>(null);
  const taskListRef = React.useRef<HTMLDivElement>(null);
  const todayRef = React.useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = React.useState<ViewMode>('month');

  const { sortedTasks, months, days, timelineStart, timelineEnd, totalDays } = React.useMemo(() => {
    const validTasks = tasks?.filter(t => t.startDate && t.dueDate) || [];
    
    const sorted = [...validTasks].sort((a, b) => {
        const dateA = parseISO(a.startDate).getTime();
        const dateB = parseISO(b.startDate).getTime();
        if (dateA === dateB) {
            return a.title.localeCompare(b.title);
        }
        return dateA - dateB;
    });

    const now = new Date();
    const tStart = startOfMonth(addMonths(now, -6));
    const tEnd = endOfMonth(addMonths(now, 6));
    
    const monthInterval = eachMonthOfInterval({ start: tStart, end: tEnd });
    const dayInterval = eachDayOfInterval({ start: tStart, end: tEnd });
    const diffDays = differenceInDays(tEnd, tStart) + 1;

    return { sortedTasks: sorted, months: monthInterval, days: dayInterval, timelineStart: tStart, timelineEnd: tEnd, totalDays: diffDays };
  }, [tasks]);

   React.useEffect(() => {
    if (todayRef.current && timelineRef.current) {
        const timelineWidth = timelineRef.current.offsetWidth;
        const todayPosition = todayRef.current.offsetLeft;
        
        timelineRef.current.scrollTo({
            left: todayPosition - timelineWidth / 3,
            behavior: 'smooth',
        });
    }
   }, [viewMode, days, months]);
   
   const handleScroll = () => {
    if (taskListRef.current && timelineRef.current) {
        taskListRef.current.scrollTop = timelineRef.current.scrollTop;
    }
   }

  if (tasks.length === 0) {
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
    'Blocked': { color: 'bg-red-500 hover:bg-red-500', label: 'Blocked' },
  };
  
  const getDaysInMonth = (date: Date) => differenceInDays(endOfMonth(date), startOfMonth(date)) + 1;

  const dayWidth = viewMode === 'day' ? DAY_WIDTH_DAY_VIEW : DAY_WIDTH_MONTH_VIEW;
  const totalGridWidth = totalDays * dayWidth;

  const taskLayouts = React.useMemo(() => {
    const layouts: { task: Task; top: number}[] = [];
    
    sortedTasks.forEach((task, index) => {
        layouts.push({
            task: task,
            top: index * ROW_HEIGHT,
        });
    });

    const totalHeight = HEADER_HEIGHT + sortedTasks.length * ROW_HEIGHT;
    return { layouts, totalHeight };
  }, [sortedTasks, viewMode]);

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
      <div className="flex w-full border-t">
        {/* Task List Pane (Fixed Left) */}
        <div 
          className="bg-card z-10 border-r shrink-0"
          style={{ width: `${TASK_LIST_WIDTH}px`, height: `${taskLayouts.totalHeight}px` }}
        >
            <div className="flex items-center h-16 px-4 font-semibold border-b">
                Tasks
            </div>
            <div ref={taskListRef} className="overflow-hidden" style={{height: `${taskLayouts.totalHeight - HEADER_HEIGHT}px`}}>
                <div className="relative" style={{height: `${taskLayouts.totalHeight - HEADER_HEIGHT}px`}}>
                    {taskLayouts.layouts.map(({ task, top }) => (
                         <div
                            key={task.id}
                            className="absolute w-full flex items-center px-2 border-b"
                            style={{ top: `${top}px`, height: `${ROW_HEIGHT}px`, left: '0' }}
                        >
                            <p className="text-xs font-semibold truncate text-foreground">{task.title}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Timeline Grid Pane (Scrollable Right) */}
        <div ref={timelineRef} className="overflow-x-auto w-full" onScroll={handleScroll}>
          <div
            className="relative"
            style={{ width: `${totalGridWidth}px`, height: `${taskLayouts.totalHeight}px` }}
          >
            {/* Headers */}
            <div className="sticky top-0 z-20 flex h-16 bg-card border-b">
              {viewMode === 'day' ? (
                  days.map((day, index) => {
                      const monthLabel = format(day, 'MMMM yyyy');
                      const isFirstDayOfMonth = day.getDate() === 1;
                      return (
                          <div key={index} className="flex-shrink-0 flex flex-col items-center justify-center border-r relative" style={{ width: `${DAY_WIDTH_DAY_VIEW}px` }}>
                              {isFirstDayOfMonth && <span className="absolute -top-4 left-1 text-center font-semibold text-xs whitespace-nowrap">{monthLabel}</span>}
                              <span className={cn("text-xs", {'font-bold text-primary': isToday(day)})}>{format(day, 'd')}</span>
                              <span className="text-xs text-muted-foreground">{format(day, 'E')[0]}</span>
                          </div>
                      );
                  })
              ) : (
                  months.map((month) => {
                      const monthWidth = getDaysInMonth(month) * DAY_WIDTH_MONTH_VIEW;
                      return (
                        <div key={month.toString()} className="flex-shrink-0 text-center font-semibold text-sm flex items-center justify-center border-r"
                            style={{ width: `${monthWidth}px` }}
                        >
                            {format(month, 'MMMM yyyy')}
                        </div>
                      )
                  })
              )}
            </div>
            
            {/* Vertical Grid Lines */}
            <div className="absolute top-0 left-0 w-full -z-10" style={{ height: `${taskLayouts.totalHeight}px` }}>
                {days.map((day, index) => {
                    const isMonthStart = day.getDate() === 1;
                    const isWeekStart = isSameDay(day, startOfISOWeek(day));
                    const isDayView = viewMode === 'day';

                    return (
                        <div key={`v-line-${index}`} className={cn("absolute top-0 h-full border-r", {
                            "border-border": isMonthStart, 
                            "border-border/60": !isMonthStart && isWeekStart,
                            "border-border/30": !isMonthStart && !isWeekStart && isDayView,
                        })} style={{ left: `${(index + 1) * dayWidth}px` }} />
                    );
                })}
            </div>
            
            {/* Horizontal Row Lines */}
            <div className="absolute top-0 left-0 w-full h-full -z-10">
                {taskLayouts.layouts.map(({ task, top }) => (
                     <div key={`h-line-${task.id}`} className="absolute w-full border-b border-border/50" style={{ top: `${HEADER_HEIGHT + top + ROW_HEIGHT -1}px`, height: '1px' }} />
                ))}
            </div>
            
            {/* Today Marker */}
            {(() => {
                const todayOffsetDays = differenceInDays(startOfDay(new Date()), timelineStart);
                if (todayOffsetDays < 0 || todayOffsetDays > totalDays) return null;

                const todayLeft = todayOffsetDays * dayWidth;

                return (
                    <div ref={todayRef} className="absolute top-0 bottom-0 w-0.5 bg-primary z-0" style={{ left: `${todayLeft}px` }} >
                        <div className="sticky top-0 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-b-md">
                            Today
                        </div>
                    </div>
                );
            })()}

            {/* Task Bars */}
            <div className="relative w-full" style={{ height: `${taskLayouts.totalHeight - HEADER_HEIGHT}px` }}>
              {taskLayouts.layouts.map(({ task, top }) => {
                  const assignee = findUserById(task.assigneeId);
                  const taskStart = parseISO(task.startDate);
                  const taskEnd = parseISO(task.dueDate);

                  const startOffset = differenceInDays(taskStart, timelineStart);
                  const duration = differenceInDays(taskEnd, taskStart) + 1;
                  
                  const left = startOffset * dayWidth;
                  const width = duration * dayWidth - (viewMode === 'day' ? 2 : 1); // small padding
                  
                  return (
                  <Tooltip key={task.id}>
                      <TooltipTrigger asChild>
                      <div
                          className="absolute group flex items-center"
                          style={{
                              top: `${top + 6}px`,
                              left: `${left}px`,
                              height: `${ROW_HEIGHT - 12}px`,
                              width: `${width}px`,
                          }}
                      >
                          <div className={cn(
                              "h-full w-full rounded-md text-white flex items-center justify-start gap-2 px-3 cursor-pointer transition-all duration-200 shadow-sm",
                              statusConfig[task.status].color
                              )}
                          >
                             {viewMode === 'day' && <p className='text-xs font-bold truncate text-white/90'>{task.title}</p>}
                          </div>
                           <div className="absolute right-[-35px] top-0 h-full flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
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
                          <p className="text-sm"><span className="font-semibold">Duration:</span> {format(taskStart, 'PPP')} - {format(taskEnd, 'PPP')}</p>
                          <div className="flex items-center gap-2 mt-2">
                              {assignee && <Avatar className="h-6 w-6">
                                  <AvatarImage src={assignee.avatarUrl} data-ai-hint="person portrait" />
                                  <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
                              </Avatar>}
                              <div>
                                  <p className="font-semibold">{assignee?.name || 'Unassigned'}</p>
                                  <p className="text-sm"><span className="font-semibold">Status:</span> {task.status}</p>
                              </div>
                          </div>
                      </TooltipContent>
                  </Tooltip>
                  );
              })}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
