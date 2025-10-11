

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

type ProjectTimelineProps = {
  projectId: string;
  projectType: 'Rulemaking' | 'Tim Kerja';
  tasks: Task[];
  teamMembers: User[];
  onTaskUpdate: (updatedTasks: Task[]) => void;
};

type ViewMode = 'week' | 'day';

const ROW_MIN_HEIGHT = 44; 
const HEADER_HEIGHT = 64;
const MONTH_HEADER_HEIGHT = 32;
const DETAIL_HEADER_HEIGHT = 32;
const TASK_LIST_WIDTH = 200;
const WEEK_WIDTH = 60;
const DAY_WIDTH_DAY_VIEW = 40;


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
  const [searchTerm, setSearchTerm] = React.useState('');
  const [assigneeFilter, setAssigneeFilter] = React.useState('all');
  
  const flattenedTasks = React.useMemo(() => flattenTasks(tasks), [tasks]);

  const { sortedTasks, months, days, weeks, timelineStart, timelineEnd, totalDays, totalWeeks } = React.useMemo(() => {
    let filtered = flattenedTasks.filter(t => t.startDate && t.dueDate);

    if (searchTerm) {
        filtered = filtered.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (assigneeFilter !== 'all') {
        filtered = filtered.filter(t => t.assigneeIds?.includes(assigneeFilter));
    }
    
    const sorted = [...filtered].sort((a, b) => {
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

    if (filtered.length > 0) {
      const allDates = filtered.flatMap(t => [parseISO(t.startDate), parseISO(t.dueDate)]);
      const earliestDate = min(allDates);
      const latestDate = max(allDates);
      tStart = min([startOfISOWeek(addMonths(earliestDate, -1)), tStart]);
      tEnd = max([endOfISOWeek(addMonths(latestDate, 1)), tEnd]);
    }
    
    const dayCount = differenceInDays(tEnd, tStart) + 1;
    const weekCount = differenceInCalendarISOWeeks(tEnd, tStart) + 1;

    return { 
        sortedTasks: sorted, 
        months: eachMonthOfInterval({ start: tStart, end: tEnd }), 
        days: eachDayOfInterval({ start: tStart, end: tEnd }), 
        weeks: eachWeekOfInterval({ start: tStart, end: tEnd }, { weekStartsOn: 1 }),
        timelineStart: tStart, 
        timelineEnd: tEnd, 
        totalDays: dayCount,
        totalWeeks: weekCount,
    };
  }, [flattenedTasks, searchTerm, assigneeFilter]);

  React.useEffect(() => {
    const container = timelineContainerRef.current;
    const todayMarker = todayRef.current;
    if (!container || !todayMarker) return;
  
    // --- Vertical Scroll ---
    const today = startOfDay(new Date());
    const firstActiveTaskIndex = sortedTasks.findIndex(task => 
      isWithinInterval(today, { start: parseISO(task.startDate), end: parseISO(task.dueDate) })
    );
  
    let verticalScrollPosition = 0;
    if (firstActiveTaskIndex !== -1) {
      // Calculate scroll position to bring the task into view
      const taskTop = firstActiveTaskIndex * ROW_MIN_HEIGHT;
      verticalScrollPosition = taskTop - container.offsetHeight / 4; // Center it a bit
    }
  
    // --- Horizontal Scroll ---
    const todayPosition = todayMarker.offsetLeft;
    const horizontalScrollPosition = todayPosition - container.offsetWidth / 3;
  
    // --- Execute Scroll ---
    container.scrollTo({
      top: verticalScrollPosition,
      left: horizontalScrollPosition,
      behavior: 'auto',
    });
  }, [sortedTasks]);

  const statusConfig: { [key in Task['status']]: { color: string; label: string } } = {
    'Done': { color: 'bg-green-500 hover:bg-green-600', label: 'Done' },
    'In Progress': { color: 'bg-blue-500 hover:bg-blue-600', label: 'In Progress' },
    'To Do': { color: 'bg-gray-400 hover:bg-gray-500', label: 'To Do' },
    'Blocked': { color: 'bg-red-500 hover:bg-red-500', label: 'Blocked' },
  };
  
  const dayWidth = viewMode === 'day' ? DAY_WIDTH_DAY_VIEW : 0;
  const gridWidth = viewMode === 'day' ? totalDays * dayWidth : totalWeeks * WEEK_WIDTH;

  const resetFilters = () => {
    setSearchTerm('');
    setAssigneeFilter('all');
  };

  const areFiltersActive = searchTerm !== '' || assigneeFilter !== 'all';

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
      <div className="p-4 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <RadioGroup defaultValue={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="flex items-center gap-2">
              <div>
                <RadioGroupItem value="week" id="r-week-project" className="peer sr-only" />
                <Label htmlFor="r-week-project" className="flex items-center justify-between rounded-md border-2 border-muted bg-popover px-3 py-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer text-sm">Week View</Label>
              </div>
              <div>
                <RadioGroupItem value="day" id="r-day-project" className="peer sr-only" />
                <Label htmlFor="r-day-project" className="flex items-center justify-between rounded-md border-2 border-muted bg-popover px-3 py-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer text-sm">Day View</Label>
              </div>
            </RadioGroup>
            <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-full sm:w-[180px]"
                />
            </div>
            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter by assignee..." /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Assignees</SelectItem>
                    {teamMembers.map(member => (
                        <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {areFiltersActive && (
                <Button variant="ghost" onClick={resetFilters} className="w-full sm:w-auto">
                    <RotateCcw className="mr-2 h-4 w-4" /> Reset
                </Button>
            )}
        </div>
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
          style={{ maxHeight: `${HEADER_HEIGHT + (10.5 * ROW_MIN_HEIGHT)}px` }}
        >
          {sortedTasks.length > 0 ? (
            <div className="relative" style={{ width: `calc(${TASK_LIST_WIDTH}px + ${gridWidth}px)`}}>
                {/* Headers */}
                <div className="sticky top-0 z-30 flex bg-card">
                    <div className="sticky left-0 bg-inherit border-b border-r flex items-center px-4 font-semibold z-10" style={{ width: `${TASK_LIST_WIDTH}px`, height: `${HEADER_HEIGHT}px` }}>
                        Tasks
                    </div>
                    <div className="flex-grow border-b">
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
                                            {isMonthStart && <span className="absolute -top-4 left-1 text-center font-semibold text-xs whitespace-nowrap">{format(day, 'MMMM')}</span>}
                                            <span className={cn("text-xs", { 'font-bold text-primary': isToday(day) })}>{format(day, 'd')}</span>
                                            <span className="text-xs text-muted-foreground">{format(day, 'E')[0]}</span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Grid Body */}
                <div className="relative grid" style={{ gridTemplateColumns: `${TASK_LIST_WIDTH}px 1fr`}}>
                    {/* Task List */}
                    <div className="border-r" style={{ gridColumn: 1 }}>
                        {sortedTasks.map((task) => (
                            <div key={task.id} className="sticky left-0 bg-card flex flex-col justify-center px-2 py-2 border-b z-20" style={{ minHeight: `${ROW_MIN_HEIGHT}px`}}>
                                 <p className="text-xs font-semibold whitespace-normal leading-tight">{task.title}</p>
                            </div>
                        ))}
                    </div>

                    {/* Timeline */}
                    <div className="relative" style={{ gridColumn: 2, width: `${gridWidth}px` }}>
                        {/* Vertical Lines */}
                        {viewMode === 'day' ? (
                            days.map((_, index) => (
                                <div key={`v-line-${index}`} className="absolute top-0 h-full w-px bg-transparent border-l border-dashed border-border/80" style={{ left: `${index * dayWidth}px`}} />
                            ))
                        ) : (
                            weeks.map((_, index) => (
                                <div key={`v-line-${index}`} className="absolute top-0 h-full w-px bg-transparent border-l border-dashed border-border/80" style={{ left: `${index * WEEK_WIDTH}px`}} />
                            ))
                        )}
                        {/* Horizontal Lines */}
                        {sortedTasks.map((_, index) => (
                           <div key={`h-line-${index}`} className="w-full border-b" style={{ height: `${ROW_MIN_HEIGHT}px` }} />
                        ))}
                        
                        {/* Today Indicator */}
                        {(() => {
                            const today = startOfDay(new Date());
                            if(today < timelineStart || today > timelineEnd) return null;
                            const todayOffset = viewMode === 'day'
                                ? differenceInDays(today, timelineStart) * dayWidth
                                : differenceInCalendarISOWeeks(today, timelineStart) * WEEK_WIDTH;
                            return (
                                <div ref={todayRef} className="absolute top-0 bottom-0 w-0.5 bg-primary z-20" style={{ left: `${todayOffset}px` }} >
                                    <div className="sticky top-0 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-b-md">
                                        Today
                                    </div>
                                </div>
                            );
                        })()}

                         {/* Task Bars */}
                        {sortedTasks.map((task, index) => {
                            const taskStart = parseISO(task.startDate);
                            const taskEnd = parseISO(task.dueDate);
                            
                            let left, width;
                            if(viewMode === 'day') {
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

                            return (
                                <Tooltip key={task.id}>
                                <TooltipTrigger asChild>
                                    <div className="absolute group z-10" style={{ top: `${index * ROW_MIN_HEIGHT + 6}px`, left: `${left}px`, width: `${width}px`, height: `${ROW_MIN_HEIGHT - 12}px` }}>
                                        <div className={cn("h-full w-full rounded-md text-white flex items-start justify-center overflow-hidden py-1 px-2 cursor-pointer shadow-sm", statusConfig[task.status].color)}>
                                            <p className="text-[10px] text-center font-bold text-white/90 leading-tight">
                                                {format(taskStart, 'dd MMM')} - {format(taskEnd, 'dd MMM')}
                                            </p>
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
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-10 text-muted-foreground">
              <ListTodo className="h-12 w-12 mb-4" />
              <p className="font-semibold">No Tasks Found</p>
              <p className="text-sm">No tasks match the current filter criteria.</p>
            </div>
          )}
        </div>
    </TooltipProvider>
  );
}
