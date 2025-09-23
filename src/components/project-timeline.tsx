

'use client';

import * as React from 'react';
import {
  format,
  parseISO,
  eachMonthOfInterval,
  differenceInDays,
  isToday,
  startOfISOWeek,
  endOfISOWeek,
  eachDayOfInterval,
  isSameMonth,
  max,
  min,
  addMonths,
  startOfDay,
  eachWeekOfInterval,
  getISOWeek,
  differenceInCalendarISOWeeks,
} from 'date-fns';
import { cn } from '@/lib/utils';
import type { Task, User } from '@/lib/types';
import { ListTodo } from 'lucide-react';
import { findUserById } from '@/lib/data-utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { EditTaskDialog } from './edit-task-dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';

type ProjectTimelineProps = {
  projectId: string;
  projectType: 'Rulemaking' | 'Tim Kerja';
  tasks: Task[];
  teamMembers: User[];
  onTaskUpdate: (updatedTasks: Task[]) => void;
};

type ViewMode = 'week' | 'day';

const ROW_MIN_HEIGHT = 52;
const HEADER_HEIGHT = 64;
const MONTH_HEADER_HEIGHT = 32;
const DETAIL_HEADER_HEIGHT = 32;

// Flattens the task tree into a single array
const flattenTasks = (tasks: Task[]): Task[] => {
  let allTasks: Task[] = [];
  tasks.forEach(task => {
    allTasks.push(task);
    if (task.subTasks) {
      allTasks = allTasks.concat(flattenTasks(task.subTasks));
    }
  });
  return allTasks;
};

export function ProjectTimeline({ projectId, projectType, tasks, teamMembers, onTaskUpdate }: ProjectTimelineProps) {
  const timelineContainerRef = React.useRef<HTMLDivElement>(null);
  const todayRef = React.useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = React.useState<ViewMode>('week');
  const taskRowRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const [rowHeights, setRowHeights] = React.useState<number[]>([]);
  
  const flattenedTasks = React.useMemo(() => flattenTasks(tasks), [tasks]);

  const { sortedTasks, months, days, weeks, timelineStart, timelineEnd, totalDays, totalWeeks } = React.useMemo(() => {
    const validTasks = flattenedTasks?.filter(t => t.startDate && t.dueDate) || [];
    
    const sorted = [...validTasks].sort((a, b) => {
        const dateA = parseISO(a.startDate).getTime();
        const dateB = parseISO(b.startDate).getTime();
        if (dateA === dateB) {
            return (a.title || '').localeCompare(b.title || '');
        }
        return dateA - dateB;
    });

    const now = new Date();
    let tStart = startOfISOWeek(addMonths(now, -1));
    let tEnd = endOfISOWeek(addMonths(now, 2));

    if (validTasks.length > 0) {
      const allDates = validTasks.flatMap(t => [parseISO(t.startDate), parseISO(t.dueDate)]);
      const earliestDate = min(allDates);
      const latestDate = max(allDates);
      tStart = min([startOfISOWeek(addMonths(earliestDate, -1)), tStart]);
      tEnd = max([endOfISOWeek(addMonths(latestDate, 1)), tEnd]);
    }
    
    return { 
        sortedTasks: sorted, 
        months: eachMonthOfInterval({ start: tStart, end: tEnd }), 
        days: eachDayOfInterval({ start: tStart, end: tEnd }), 
        weeks: eachWeekOfInterval({ start: tStart, end: tEnd }, { weekStartsOn: 1 }),
        timelineStart: tStart, 
        timelineEnd: tEnd, 
        totalDays: differenceInDays(tEnd, tStart) + 1,
        totalWeeks: differenceInCalendarISOWeeks(tEnd, tStart) + 1
    };
  }, [flattenedTasks]);
  
  React.useEffect(() => {
    const calculateRowHeights = () => {
        const heights = taskRowRefs.current.map(el => Math.max(ROW_MIN_HEIGHT, el?.offsetHeight || 0));
        setRowHeights(heights);
    };

    calculateRowHeights();
    const resizeObserver = new ResizeObserver(calculateRowHeights);
    taskRowRefs.current.forEach(el => {
        if(el) resizeObserver.observe(el);
    });
    
    return () => {
        resizeObserver.disconnect();
    };
}, [sortedTasks.length]);

  React.useEffect(() => {
    if (todayRef.current && timelineContainerRef.current) {
      const container = timelineContainerRef.current;
      const todayPosition = todayRef.current.offsetLeft;
      container.scrollTo({
        left: todayPosition - container.offsetWidth / 3,
        behavior: 'smooth',
      });
    }
  }, [viewMode, weeks, days]);

  const statusConfig: { [key in Task['status']]: { color: string; label: string } } = {
    'Done': { color: 'bg-green-500 hover:bg-green-600', label: 'Done' },
    'In Progress': { color: 'bg-blue-500 hover:bg-blue-600', label: 'In Progress' },
    'To Do': { color: 'bg-gray-400 hover:bg-gray-500', label: 'To Do' },
    'Blocked': { color: 'bg-red-500 hover:bg-red-500', label: 'Blocked' },
  };
  
  const DAY_WIDTH_DAY_VIEW = 40;
  const WEEK_WIDTH = 60;
  const TASK_LIST_WIDTH = 200;
  const dayWidth = viewMode === 'day' ? DAY_WIDTH_DAY_VIEW : 0;
  const totalGridWidth = viewMode === 'day' ? totalDays * dayWidth : totalWeeks * WEEK_WIDTH;
  const totalTimelineHeight = rowHeights.reduce((acc, h) => acc + h, 0);

  if (tasks.length === 0) {
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
      <div className="p-4 border-t flex justify-between items-center">
        <RadioGroup defaultValue={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="flex items-center gap-4">
          <div>
            <RadioGroupItem value="week" id="r-week-my" className="peer sr-only" />
            <Label htmlFor="r-week-my" className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer">Week View</Label>
          </div>
          <div>
            <RadioGroupItem value="day" id="r-day-my" className="peer sr-only" />
            <Label htmlFor="r-day-my" className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer">Day View</Label>
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
        <div 
          ref={timelineContainerRef} 
          className="w-full border-t overflow-auto relative"
        >
          <div className="flex" style={{ width: 'min-content' }}>
            <div className="sticky left-0 z-40 bg-card">
              <div className="flex items-center px-4 font-semibold border-b border-r bg-card" style={{height: `${HEADER_HEIGHT}px`, minWidth: `${TASK_LIST_WIDTH}px`}}>
                Tasks
              </div>
              {sortedTasks.map((task, index) => (
                <div 
                    key={task.id} 
                    ref={el => taskRowRefs.current[index] = el}
                    className="flex flex-col justify-center px-2 py-2 border-b border-r" 
                    style={{ minHeight: `${ROW_MIN_HEIGHT}px`, width: `${TASK_LIST_WIDTH}px`, paddingLeft: `${(task.parentId ? 1.5 : 0) + 0.5}rem` }}
                >
                  <p className="text-xs font-semibold whitespace-normal leading-tight">{task.title}</p>
                </div>
              ))}
            </div>

            <div className="relative" style={{ width: `${totalGridWidth}px` }}>
              <div className="sticky top-0 z-30 bg-card">
                {viewMode === 'week' && (
                  <div className="flex border-b" style={{ height: `${MONTH_HEADER_HEIGHT}px` }}>
                      {months.map((month) => {
                          const weeksInMonth = weeks.filter(w => isSameMonth(w, month));
                          const monthWidth = weeksInMonth.length * WEEK_WIDTH;
                          if (monthWidth === 0) return null;
                          return (
                              <div key={month.toString()} className="flex-shrink-0 text-center font-semibold text-sm flex items-center justify-center border-r" style={{ width: `${monthWidth}px` }}>
                                  {format(month, 'MMMM yyyy')}
                              </div>
                          );
                      })}
                  </div>
                )}
                <div className="flex border-b" style={{ height: `${viewMode === 'week' ? DETAIL_HEADER_HEIGHT : HEADER_HEIGHT}px` }}>
                    {viewMode === 'week' ? (
                        weeks.map((week) => (
                            <div key={week.toString()} className="flex-shrink-0 flex items-center justify-center text-xs font-normal text-muted-foreground border-r last:border-r-0" style={{ width: `${WEEK_WIDTH}px`}}>
                                W{getISOWeek(week)}
                            </div>
                        ))
                    ) : (
                        days.map((day) => {
                            const isMonthStart = day.getDate() === 1;
                            return (
                                <div key={day.toISOString()} className="flex-shrink-0 flex flex-col items-center justify-center border-r relative" style={{ width: `${DAY_WIDTH_DAY_VIEW}px` }}>
                                    {isMonthStart && <span className="absolute -top-4 left-1 text-center font-semibold text-xs whitespace-nowrap">{format(day, 'MMMM')}</span>}
                                    <span className={cn("text-xs", { 'font-bold text-primary': isToday(day) })}>{format(day, 'd')}</span>
                                    <span className="text-xs text-muted-foreground">{format(day, 'E')[0]}</span>
                                </div>
                            );
                        })
                    )}
                </div>
              </div>
              
              <div className="relative" style={{ height: `${totalTimelineHeight}px` }}>
                 <div className="absolute top-0 left-0 w-full h-full z-0">
                    {viewMode === 'day' ? (
                        days.map((day, index) => {
                            const isMonthStart = day.getDate() === 1;
                            return (
                                <div key={`v-line-${index}`} 
                                    className={cn(
                                        "absolute top-0 h-full w-px",
                                        isMonthStart ? "bg-border" : "bg-transparent border-l border-dashed border-border/80"
                                    )}
                                    style={{ left: `${(index * dayWidth) + dayWidth -1}px`}} 
                                />
                            );
                        })
                    ) : (
                        weeks.map((week, index) => {
                            const isMonthStart = week.getDate() <= 7;
                            return (
                                <div key={`v-line-${index}`} 
                                    className={cn(
                                        "absolute top-0 h-full w-px",
                                        isMonthStart ? "bg-border" : "bg-transparent border-l border-dashed border-border/80"
                                    )}
                                    style={{ left: `${(index * WEEK_WIDTH) + WEEK_WIDTH - 1}px`}} 
                                />
                            );
                        })
                    )}
                </div>

                {rowHeights.reduce<React.ReactNode[]>((acc, height, index) => {
                    const top = index === 0 ? 0 : acc.reduce((sum, h, i) => i < index ? sum + (rowHeights[i] || 0) : sum, 0);
                    acc.push(
                        <div key={`h-line-${index}`} className="absolute w-full border-b border-border/50 z-0" style={{ top: `${top + height -1}px`, height: '1px' }} />
                    );
                    return acc;
                }, [])}
                
                {(() => {
                    const today = startOfDay(new Date());
                    if(today < timelineStart || today > timelineEnd) return null;
                    
                    let todayLeft;
                    if (viewMode === 'day') {
                        const todayOffsetDays = differenceInDays(today, timelineStart);
                        todayLeft = todayOffsetDays * dayWidth;
                    } else { 
                        const todayOffsetWeeks = differenceInCalendarISOWeeks(today, timelineStart);
                        todayLeft = todayOffsetWeeks * WEEK_WIDTH;
                    }

                    return (
                        <div ref={todayRef} className="absolute top-0 bottom-0 w-0.5 bg-primary z-20" style={{ left: `${todayLeft}px` }} >
                            <div className="sticky top-0 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-b-md">
                                Today
                            </div>
                        </div>
                    );
                })()}
                
                <div className="absolute top-0 left-0 w-full h-full z-10">
                {sortedTasks.map((task, index) => {
                  const taskStart = parseISO(task.startDate);
                  const taskEnd = parseISO(task.dueDate);

                  let left, width;
                  if (viewMode === 'day') {
                    const startOffset = differenceInDays(taskStart, timelineStart);
                    const duration = differenceInDays(taskEnd, taskStart) + 1;
                    left = startOffset * dayWidth;
                    width = duration * dayWidth - 2;
                  } else { 
                    const startOffset = differenceInCalendarISOWeeks(taskStart, timelineStart);
                    const duration = differenceInCalendarISOWeeks(taskEnd, taskStart) + 1;
                    left = startOffset * WEEK_WIDTH;
                    width = duration * WEEK_WIDTH - 4;
                  }
                  
                  const topPosition = rowHeights.slice(0, index).reduce((acc, h) => acc + h, 0);
                  const height = rowHeights[index] || ROW_MIN_HEIGHT;

                  return (
                    <Tooltip key={task.id}>
                      <TooltipTrigger asChild>
                        <div className="absolute group flex items-start z-10" style={{ top: `${topPosition + 6}px`, left: `${left}px`, height: `${height - 12}px`, width: `${width}px` }}>
                          <div className={cn("h-full w-full rounded-md text-white flex items-start justify-start gap-2 px-3 py-1 cursor-pointer shadow-sm", statusConfig[task.status].color)}>
                            {(width > 50) && <p className='text-xs font-bold whitespace-normal leading-tight text-white/90'>{task.title}</p>}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-bold">{task.title}</p>
                        <p className="text-sm"><span className="font-semibold">Duration:</span> {format(taskStart, 'PPP')} - {format(taskEnd, 'PPP')}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
                </div>
              </div>
            </div>
          </div>
        </div>
    </TooltipProvider>
  );
}
