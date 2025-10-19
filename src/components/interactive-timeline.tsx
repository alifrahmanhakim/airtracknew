
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
const TASK_LIST_WIDTH = 250; // Increased width for more text
const WEEK_WIDTH = 60;
const DAY_WIDTH_DAY_VIEW = 40;

export function InteractiveTimeline({ tasks }: InteractiveTimelineProps) {
  const timelineContainerRef = React.useRef<HTMLDivElement>(null);
  const todayRef = React.useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = React.useState<ViewMode>('week');
  
  const { sortedTasks, months, days, weeks, timelineStart, timelineEnd, totalGridWidth } = React.useMemo(() => {
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

    return { 
        sortedTasks: sorted, 
        months: eachMonthOfInterval({ start: tStart, end: tEnd }), 
        days: dayData,
        weeks: weekData,
        timelineStart: tStart, 
        timelineEnd: tEnd, 
        totalGridWidth: viewMode === 'day' ? dayData.length * DAY_WIDTH_DAY_VIEW : weekData.length * WEEK_WIDTH,
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
                <div className="relative grid" style={{
                    width: 'min-content',
                    gridTemplateColumns: `${TASK_LIST_WIDTH}px ${totalGridWidth}px`,
                    gridTemplateRows: `${HEADER_HEIGHT}px repeat(${sortedTasks.length}, ${ROW_HEIGHT}px)`,
                }}>
                  {/* HEADER - Task List */}
                  <div className="sticky top-0 left-0 z-40 bg-card border-b border-r flex items-center px-4 font-semibold" style={{ gridRow: 1, gridColumn: 1 }}>
                      Tasks / Project
                  </div>

                  {/* HEADER - Timeline */}
                  <div className="sticky top-0 z-30 flex-shrink-0 border-b bg-card" style={{ gridRow: 1, gridColumn: 2 }}>
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

                  {/* BODY - Task List */}
                  {sortedTasks.map((task, index) => (
                    <div key={task.id} className="sticky left-0 z-20 bg-card flex flex-col justify-center px-2 py-1 border-b border-r" style={{ gridRow: index + 2, gridColumn: 1 }}>
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

                  {/* BODY - Timeline Grid */}
                  <div className="relative" style={{ gridRow: '2 / -1', gridColumn: 2 }}>
                    {/* Vertical Grid Lines */}
                    {viewMode === 'day' ? (
                        days.map((_, index) => (
                            <div key={`v-line-${index}`} className="absolute top-0 h-full w-px bg-border/50" style={{ left: `${index * DAY_WIDTH_DAY_VIEW}px`}} />
                        ))
                    ) : (
                        weeks.map((_, index) => (
                            <div key={`v-line-${index}`} className="absolute top-0 h-full w-px bg-border/50" style={{ left: `${index * WEEK_WIDTH}px`}} />
                        ))
                    )}
                  </div>

                  {/* Today Marker & Task Bars */}
                  <div className="relative z-10" style={{ gridRow: '2 / -1', gridColumn: 2 }}>
                    {(() => {
                        const today = startOfDay(new Date());
                        if (today < timelineStart || today > timelineEnd) return null;
                        
                        let todayLeft;
                        if (viewMode === 'day') {
                            const todayOffsetDays = differenceInDays(today, timelineStart);
                            todayLeft = todayOffsetDays * DAY_WIDTH_DAY_VIEW;
                        } else { 
                            const todayOffsetWeeks = differenceInCalendarISOWeeks(today, timelineStart);
                            todayLeft = todayOffsetWeeks * WEEK_WIDTH;
                        }
                        return (
                            <div ref={todayRef} className="absolute top-0 bottom-0 w-0.5 bg-primary z-30" style={{ left: `${todayLeft}px` }} >
                                <div className="sticky top-0 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-b-md">
                                    Today
                                </div>
                            </div>
                        );
                    })()}

                    {sortedTasks.map((task, index) => {
                        const taskStart = parseISO(task.startDate);
                        const taskEnd = parseISO(task.dueDate);

                        let left, width;
                        if (viewMode === 'day') {
                            const startOffset = differenceInDays(taskStart, timelineStart);
                            const duration = differenceInDays(taskEnd, taskStart) + 1;
                            left = startOffset * DAY_WIDTH_DAY_VIEW;
                            width = duration * DAY_WIDTH_DAY_VIEW - 2;
                        } else { 
                            const startOffset = differenceInCalendarISOWeeks(taskStart, timelineStart);
                            const duration = differenceInCalendarISOWeeks(taskEnd, taskStart) + 1;
                            left = startOffset * WEEK_WIDTH;
                            width = duration * WEEK_WIDTH - 4;
                        }
                        
                        return (
                            <Tooltip key={task.id}>
                                <TooltipTrigger asChild>
                                    <div className="absolute group" style={{ top: `${index * ROW_HEIGHT + 8}px`, left: `${left}px`, width: `${width}px`, height: `${ROW_HEIGHT - 16}px` }}>
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
          )}
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}

    