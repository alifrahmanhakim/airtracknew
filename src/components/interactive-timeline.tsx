
'use client';

import * as React from 'react';
import {
  format,
  parseISO,
  eachMonthOfInterval,
  differenceInDays,
  addDays,
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
import { findUserById } from '@/lib/data';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type TimelineTask = Task & { projectName?: string };
type InteractiveTimelineProps = { tasks: TimelineTask[] };
type ViewMode = 'week' | 'day';

const TASK_LIST_WIDTH = 250;
const WEEK_WIDTH = 60;
const DAY_WIDTH_DAY_VIEW = 40;
const ROW_HEIGHT = 52;
const HEADER_HEIGHT = 64;

export function InteractiveTimeline({ tasks }: InteractiveTimelineProps) {
  const timelineContainerRef = React.useRef<HTMLDivElement>(null);
  const todayRef = React.useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = React.useState<ViewMode>('week');
  const allUsers = React.useMemo(() => [], []);

  const { sortedTasks, months, days, weeks, timelineStart, timelineEnd, totalDays, totalWeeks } = React.useMemo(() => {
    const validTasks = tasks?.filter(t => t.startDate && t.dueDate) || [];
    const sorted = [...validTasks].sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime());

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
  }, [tasks]);

  React.useEffect(() => {
    if (todayRef.current && timelineContainerRef.current) {
      const container = timelineContainerRef.current;
      const todayPosition = todayRef.current.offsetLeft;
      container.scrollTo({
        left: todayPosition - container.offsetWidth / 3,
        behavior: 'smooth',
      });
    }
  }, [viewMode, weeks, days]); // Rerun when viewMode or date ranges change

  const statusConfig: { [key in Task['status']]: { color: string; label: string } } = {
    'Done': { color: 'bg-green-500 hover:bg-green-600', label: 'Done' },
    'In Progress': { color: 'bg-blue-500 hover:bg-blue-600', label: 'In Progress' },
    'To Do': { color: 'bg-gray-400 hover:bg-gray-500', label: 'To Do' },
    'Blocked': { color: 'bg-red-500 hover:bg-red-500', label: 'Blocked' },
  };
  
  const dayWidth = viewMode === 'day' ? DAY_WIDTH_DAY_VIEW : 0;
  const totalGridWidth = viewMode === 'day' ? totalDays * dayWidth : totalWeeks * WEEK_WIDTH;
  const bodyHeight = sortedTasks.length * ROW_HEIGHT;

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle>My Timeline</CardTitle>
          <CardDescription>A centralized timeline of all your assigned tasks across all projects.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 border-y flex justify-between items-center">
            <RadioGroup defaultValue={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="flex items-center gap-4">
              <div>
                <RadioGroupItem value="week" id="r-week" className="peer sr-only" />
                <Label htmlFor="r-week" className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer">Week View</Label>
              </div>
              <div>
                <RadioGroupItem value="day" id="r-day" className="peer sr-only" />
                <Label htmlFor="r-day" className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer">Day View</Label>
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
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20 text-muted-foreground">
              <ListTodo className="h-12 w-12 mb-4" />
              <p className="font-semibold">No Tasks Yet</p>
              <p className="text-sm">You have no assigned tasks with a due date.</p>
            </div>
          ) : (
            <div ref={timelineContainerRef} className="overflow-auto relative" style={{ maxHeight: '70vh' }}>
              <div className="flex relative" style={{ width: 'min-content' }}>
                {/* --- 1. Task List Column (Sticky) --- */}
                <div className="sticky left-0 z-20 bg-card">
                  <div className="sticky top-0 z-10 h-16 flex items-center px-4 font-semibold border-b border-r bg-card">
                    Tasks / Project
                  </div>
                  <div className="border-r">
                    {sortedTasks.map((task) => (
                      <div key={task.id} className="flex flex-col justify-center px-2 border-b" style={{ height: `${ROW_HEIGHT}px` }}>
                        <p className="text-xs font-semibold truncate">{task.title}</p>
                        <p className="text-xs truncate text-muted-foreground">{task.projectName}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* --- 2. Timeline Grid (Scrollable) --- */}
                <div className="flex-grow">
                  <div className="sticky top-0 z-10 flex h-16 bg-card border-b">
                    {viewMode === 'day' ? days.map((day) => (
                      <div key={day.toISOString()} className="flex-shrink-0 flex flex-col items-center justify-center border-r" style={{ width: `${DAY_WIDTH_DAY_VIEW}px` }}>
                        <span className={cn("text-xs", { 'font-bold text-primary': isToday(day) })}>{format(day, 'd')}</span>
                        <span className="text-xs text-muted-foreground">{format(day, 'E')[0]}</span>
                      </div>
                    )) : months.map((month) => {
                      const weeksInMonth = weeks.filter(w => isSameMonth(w, month));
                      const monthWidth = weeksInMonth.length * WEEK_WIDTH;
                      if (monthWidth === 0) return null;
                      return (
                        <div key={month.toISOString()} className="flex-shrink-0 text-center font-semibold text-sm flex flex-col justify-end border-r" style={{ width: `${monthWidth}px` }}>
                          <div className="h-1/2 flex items-center justify-center">{format(month, 'MMMM yyyy')}</div>
                          <div className="h-1/2 flex border-t">
                            {weeksInMonth.map((week) => (
                              <div key={week.toISOString()} className="flex-1 flex items-center justify-center text-xs font-normal text-muted-foreground border-r last:border-r-0">
                                W{getISOWeek(week)}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="relative" style={{ width: `${totalGridWidth}px`, height: `${bodyHeight}px` }}>
                    {/* Vertical Grid Lines */}
                    {(viewMode === 'day' ? days : weeks).map((date, index) => (
                      <div key={date.toISOString()} className="absolute top-0 h-full w-px bg-border/50 border-l border-dashed" style={{ left: `${index * (viewMode === 'day' ? DAY_WIDTH_DAY_VIEW : WEEK_WIDTH)}px` }} />
                    ))}
                    {/* Horizontal Grid Lines */}
                    {sortedTasks.map((_, index) => (
                      <div key={index} className="absolute w-full border-b" style={{ top: `${(index + 1) * ROW_HEIGHT -1}px` }} />
                    ))}
                    {/* Today Marker */}
                    {(() => {
                      const today = startOfDay(new Date());
                      if (today < timelineStart || today > timelineEnd) return null;
                      let left;
                      if (viewMode === 'day') {
                          left = differenceInDays(today, timelineStart) * dayWidth;
                      } else {
                          left = differenceInCalendarISOWeeks(today, timelineStart) * WEEK_WIDTH;
                      }
                      return <div ref={todayRef} className="absolute top-0 bottom-0 w-0.5 bg-primary z-20" style={{ left: `${left}px` }} />;
                    })()}
                    {/* Task Bars */}
                    {sortedTasks.map((task, index) => {
                      const taskStart = parseISO(task.startDate);
                      const taskEnd = parseISO(task.dueDate);
                      let left, width;
                      if (viewMode === 'day') {
                        left = differenceInDays(taskStart, timelineStart) * dayWidth;
                        width = (differenceInDays(taskEnd, taskStart) + 1) * dayWidth - 2;
                      } else {
                        left = differenceInCalendarISOWeeks(taskStart, timelineStart) * WEEK_WIDTH;
                        width = (differenceInCalendarISOWeeks(taskEnd, taskStart) + 1) * WEEK_WIDTH - 4;
                      }
                      return (
                        <Tooltip key={task.id}>
                          <TooltipTrigger asChild>
                            <div className="absolute group flex items-center z-10" style={{ top: `${index * ROW_HEIGHT + 6}px`, left: `${left}px`, height: `${ROW_HEIGHT - 12}px`, width: `${width}px` }}>
                              <div className={cn("h-full w-full rounded-md text-white flex items-center justify-start gap-2 px-3 cursor-pointer shadow-sm", statusConfig[task.status].color)}>
                                {(width > 50) && <p className='text-xs font-bold truncate text-white/90'>{task.title}</p>}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-bold">{task.title}</p>
                            <p className="text-sm"><span className="font-semibold">Project:</span> {task.projectName}</p>
                            <p className="text-sm"><span className="font-semibold">Duration:</span> {format(taskStart, 'PPP')} - {format(taskEnd, 'PPP')}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
