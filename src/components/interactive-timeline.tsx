
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
  isWithinInterval,
  getYear,
} from 'date-fns';
import { cn } from '@/lib/utils';
import type { Task, User } from '@/lib/types';
import { ListTodo, Search, RotateCcw } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type TimelineTask = Task & { projectName?: string };
type InteractiveTimelineProps = { tasks: TimelineTask[] };
type ViewMode = 'week' | 'day';

const ROW_HEIGHT = 44; 
const HEADER_HEIGHT = 64;
const MONTH_HEADER_HEIGHT = 32;
const DETAIL_HEADER_HEIGHT = 32;
const TASK_LIST_WIDTH = 250;
const WEEK_WIDTH = 60;
const DAY_WIDTH_DAY_VIEW = 40;

export function InteractiveTimeline({ tasks }: InteractiveTimelineProps) {
  const timelineContainerRef = React.useRef<HTMLDivElement>(null);
  const todayRef = React.useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = React.useState<ViewMode>('week');
  
  const { sortedTasks, months, days, weeks, timelineStart, timelineEnd, totalGridWidth, totalGridColumns } = React.useMemo(() => {
    const validTasks = tasks?.filter(t => t.startDate && t.dueDate) || [];
    
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
    
    const dayData = eachDayOfInterval({ start: tStart, end: tEnd });
    const weekData = eachWeekOfInterval({ start: tStart, end: tEnd }, { weekStartsOn: 1 });
    const gridColumns = viewMode === 'day' ? dayData.length : weekData.length;

    return { 
        sortedTasks: sorted, 
        months: eachMonthOfInterval({ start: tStart, end: tEnd }), 
        days: dayData,
        weeks: weekData,
        timelineStart: tStart, 
        timelineEnd: tEnd, 
        totalGridWidth: viewMode === 'day' ? gridColumns * DAY_WIDTH_DAY_VIEW : gridColumns * WEEK_WIDTH,
        totalGridColumns: gridColumns,
    };
  }, [tasks, viewMode]);

  React.useEffect(() => {
    const container = timelineContainerRef.current;
    const todayMarker = todayRef.current;
    if (!container || !todayMarker) return;
  
    const today = startOfDay(new Date());
    const firstActiveTaskIndex = sortedTasks.findIndex(task => 
      isWithinInterval(today, { start: parseISO(task.startDate), end: parseISO(task.dueDate) })
    );
  
    let verticalScrollPosition = 0;
    if (firstActiveTaskIndex !== -1) {
      const taskTop = firstActiveTaskIndex * ROW_HEIGHT;
      verticalScrollPosition = taskTop - container.offsetHeight / 4;
    }
  
    const todayPosition = todayMarker.offsetLeft;
    const horizontalScrollPosition = todayPosition - container.offsetWidth / 3;
  
    container.scrollTo({
      top: verticalScrollPosition,
      left: horizontalScrollPosition,
      behavior: 'auto',
    });
  }, [sortedTasks, viewMode]);

  const statusConfig: { [key in Task['status']]: { color: string; label: string } } = {
    'Done': { color: 'bg-green-500 hover:bg-green-600', label: 'Done' },
    'In Progress': { color: 'bg-blue-500 hover:bg-blue-600', label: 'In Progress' },
    'To Do': { color: 'bg-gray-400 hover:bg-gray-500', label: 'To Do' },
    'Blocked': { color: 'bg-red-500 hover:bg-red-500', label: 'Blocked' },
  };
  
  return (
    <Card>
      <CardContent className="p-0">
        <TooltipProvider>
          <div className="p-4 border-b flex justify-between items-center">
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
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20 text-muted-foreground">
              <ListTodo className="h-12 w-12 mb-4" />
              <p className="font-semibold">No Tasks Yet</p>
              <p className="text-sm">You have no assigned tasks with a due date.</p>
            </div>
          ) : (
            <div 
              ref={timelineContainerRef} 
              className="w-full border-t overflow-auto relative max-h-[70vh]"
            >
              <div className="relative" style={{ width: `${TASK_LIST_WIDTH + totalGridWidth}px`}}>
                  {/* Headers */}
                  <div className="sticky top-0 z-20 flex bg-card">
                      <div className="sticky left-0 z-10 bg-inherit border-b border-r flex items-center px-4 font-semibold" style={{ width: `${TASK_LIST_WIDTH}px`, height: `${HEADER_HEIGHT}px` }}>
                          Tasks / Project
                      </div>
                      <div className="flex-shrink-0 border-b" style={{ width: `${totalGridWidth}px` }}>
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
                          <div className="flex" style={{ height: `${viewMode === 'week' ? DETAIL_HEADER_HEIGHT : HEADER_HEIGHT}px` }}>
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
                                              {isMonthStart && <span className="absolute -top-4 left-1 text-center font-semibold text-xs whitespace-nowrap">{format(day, 'MMMM yyyy')}</span>}
                                              <span className={cn("text-xs", { 'font-bold text-primary': isToday(day) })}>{format(day, 'd')}</span>
                                              <span className="text-xs text-muted-foreground">{format(day, 'E')[0]}</span>
                                          </div>
                                      );
                                  })
                              )}
                          </div>
                      </div>
                  </div>

                  {/* Body Grid */}
                  <div className="grid" style={{ gridTemplateColumns: `${TASK_LIST_WIDTH}px 1fr`, gridTemplateRows: `repeat(${sortedTasks.length}, ${ROW_HEIGHT}px)` }}>
                      {/* Task List */}
                      <div className="contents">
                          {sortedTasks.map((task, index) => (
                              <div key={task.id} className="sticky left-0 z-10 bg-card flex flex-col justify-center px-2 py-1 border-b border-r" style={{ gridRow: index + 1, gridColumn: 1 }}>
                                  <Tooltip>
                                      <TooltipTrigger asChild>
                                          <p className="text-xs font-semibold whitespace-nowrap overflow-hidden text-ellipsis">{task.title}</p>
                                      </TooltipTrigger>
                                      <TooltipContent align="start"><p>{task.title}</p></TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                      <TooltipTrigger asChild>
                                          <p className="text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">{task.projectName}</p>
                                      </TooltipTrigger>
                                      <TooltipContent align="start"><p>{task.projectName}</p></TooltipContent>
                                  </Tooltip>
                              </div>
                          ))}
                      </div>

                      {/* Timeline Bars */}
                      <div className="relative" style={{ gridColumn: 2, gridRow: `1 / span ${sortedTasks.length}` }}>
                          {/* Vertical Grid Lines */}
                          <div className="absolute inset-0 z-0 grid" style={{ gridTemplateColumns: `repeat(${totalGridColumns}, 1fr)` }}>
                            {Array.from({ length: totalGridColumns }).map((_, index) => (
                                <div key={`v-line-${index}`} className="h-full w-full border-r" />
                            ))}
                          </div>
                          
                          {(() => {
                              const today = startOfDay(new Date());
                              if (today < timelineStart || today > timelineEnd) return null;
                              
                              let todayLeft;
                              if (viewMode === 'day') {
                                  const todayOffsetDays = differenceInDays(today, timelineStart);
                                  todayLeft = (todayOffsetDays / days.length) * 100;
                              } else { 
                                  const todayOffsetWeeks = differenceInCalendarISOWeeks(today, timelineStart);
                                  todayLeft = (todayOffsetWeeks / weeks.length) * 100;
                              }
                              return (
                                  <div ref={todayRef} className="absolute top-0 bottom-0 w-0.5 bg-primary z-20" style={{ left: `${todayLeft}%` }} >
                                      <div className="sticky top-0 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-b-md">
                                          Today
                                      </div>
                                  </div>
                              );
                          })()}

                          {/* Task bars */}
                           <div className="relative w-full h-full z-10 grid" style={{ gridTemplateRows: `repeat(${sortedTasks.length}, ${ROW_HEIGHT}px)`}}>
                              {sortedTasks.map((task, index) => {
                                  const taskStart = parseISO(task.startDate);
                                  const taskEnd = parseISO(task.dueDate);

                                  let startColumn, endColumn;

                                  if (viewMode === 'day') {
                                      startColumn = differenceInDays(taskStart, timelineStart) + 1;
                                      endColumn = differenceInDays(taskEnd, timelineStart) + 2;
                                  } else { 
                                      startColumn = differenceInCalendarISOWeeks(taskStart, timelineStart) + 1;
                                      endColumn = differenceInCalendarISOWeeks(taskEnd, timelineStart) + 2;
                                  }
                                  
                                  return (
                                      <Tooltip key={task.id}>
                                          <TooltipTrigger asChild>
                                              <div className="h-full py-2 px-1" style={{ gridRow: index + 1, gridColumn: `${startColumn} / ${endColumn}` }}>
                                                  <div className={cn("h-full w-full rounded-md text-white flex items-center justify-center overflow-hidden py-1 px-2 cursor-pointer shadow-sm", statusConfig[task.status].color)}>
                                                      <p className="text-[10px] text-center font-bold text-white/90 leading-tight truncate">
                                                         {task.title}
                                                      </p>
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
            </div>
          )}
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}

    