
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
  eachWeekOfInterval,
  getISOWeek,
  differenceInCalendarISOWeeks,
} from 'date-fns';
import { cn } from '@/lib/utils';
import type { Project, Task, User } from '@/lib/types';
import { ListTodo, GanttChartSquare } from 'lucide-react';
import { findUserById } from '@/lib/data-utils';
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
  projectType: Project['projectType'];
  tasks: Task[];
  teamMembers: User[];
  onTaskUpdate: (updatedTask: Task) => void;
};

type ViewMode = 'week' | 'day';

const TASK_LIST_WIDTH = 250;
const WEEK_WIDTH = 60;
const DAY_WIDTH_DAY_VIEW = 40;
const ROW_HEIGHT = 52;
const HEADER_HEIGHT = 64;

export function ProjectTimeline({ projectId, projectType, tasks, teamMembers, onTaskUpdate }: ProjectTimelineProps) {
  const timelineContainerRef = React.useRef<HTMLDivElement>(null);
  const todayRef = React.useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = React.useState<ViewMode>('week');

  const { sortedTasks, months, days, weeks, timelineStart, timelineEnd, totalDays, totalWeeks } = React.useMemo(() => {
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
    const tStart = startOfISOWeek(addMonths(now, -6));
    const tEnd = endOfISOWeek(addMonths(now, 6));
    
    const monthInterval = eachMonthOfInterval({ start: tStart, end: tEnd });
    const dayInterval = eachDayOfInterval({ start: tStart, end: tEnd });
    const weekInterval = eachWeekOfInterval({ start: tStart, end: tEnd }, { weekStartsOn: 1 });
    
    const diffDays = differenceInDays(tEnd, tStart) + 1;
    const diffWeeks = differenceInCalendarISOWeeks(tEnd, tEnd) + 1;

    return { 
        sortedTasks: sorted, 
        months: monthInterval, 
        days: dayInterval, 
        weeks: weekInterval,
        timelineStart: tStart, 
        timelineEnd: tEnd, 
        totalDays: diffDays,
        totalWeeks: diffWeeks
    };
  }, [tasks]);

   React.useEffect(() => {
    if (todayRef.current && timelineContainerRef.current) {
        const timelineWidth = timelineContainerRef.current.offsetWidth;
        const todayPosition = todayRef.current.offsetLeft;
        
        timelineContainerRef.current.scrollTo({
            left: todayPosition - timelineWidth / 3,
            behavior: 'smooth',
        });
    }
   }, [viewMode, days, weeks]);

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
  
  const dayWidth = viewMode === 'day' ? DAY_WIDTH_DAY_VIEW : 0;
  const totalGridWidth = viewMode === 'day' ? totalDays * dayWidth : totalWeeks * WEEK_WIDTH;
  const bodyHeight = sortedTasks.length * ROW_HEIGHT;
  
  const timelineMaxHeight = HEADER_HEIGHT + (Math.min(sortedTasks.length, 6) * ROW_HEIGHT);

  return (
    <TooltipProvider>
      <div className="p-4 border-t flex justify-between items-center">
        <RadioGroup defaultValue={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)} className="flex items-center gap-4">
           <div>
            <RadioGroupItem value="week" id="r-month" className="peer sr-only" />
            <Label htmlFor="r-month" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
              Week View
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
      <div 
        className="w-full border-t overflow-auto" 
        ref={timelineContainerRef}
        style={{ maxHeight: `${timelineMaxHeight}px` }}
      >
        <div className="flex" style={{ width: 'min-content' }}>
            {/* Task List */}
            <div style={{ width: `${TASK_LIST_WIDTH}px` }}>
                <div className="sticky top-0 z-10 h-16 flex items-center px-4 font-semibold border-b border-r bg-card">
                    Tasks
                </div>
                {sortedTasks.map((task) => (
                    <div
                        key={task.id}
                        className="flex items-center px-2 border-b border-r"
                        style={{ height: `${ROW_HEIGHT}px` }}
                    >
                        <p className="text-xs font-semibold truncate text-foreground">{task.title}</p>
                    </div>
                ))}
            </div>

            {/* Timeline Grid - Scrollable Right */}
            <div className="relative" style={{ width: `${totalGridWidth}px` }}>
                {/* Headers */}
                <div className="sticky top-0 z-10 flex h-16 bg-card border-b">
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
                        const weeksInMonth = weeks.filter(w => isSameMonth(w, month));
                        const monthWidth = weeksInMonth.length * WEEK_WIDTH;
                        if(monthWidth === 0) return null;
                        return (
                            <div key={month.toString()} className="flex-shrink-0 text-center font-semibold text-sm flex flex-col justify-end border-r"
                                style={{ width: `${monthWidth}px` }}
                            >
                                <div className="h-1/2 flex items-center justify-center">{format(month, 'MMMM yyyy')}</div>
                                <div className="h-1/2 flex border-t">
                                    {weeksInMonth.map((week, index) => (
                                        <div key={week.toString()} className="flex-1 flex items-center justify-center text-xs font-normal text-muted-foreground border-r last:border-r-0">
                                            W{getISOWeek(week)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })
                )}
                </div>
                
                <div className="relative" style={{ height: `${bodyHeight}px` }}>
                    {/* Vertical Grid Lines */}
                    <div className="absolute top-0 left-0 w-full h-full">
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

                    {/* Horizontal Grid Lines */}
                    {sortedTasks.map((task, index) => (
                        <div key={`h-line-${task.id}`} className="absolute w-full border-b border-border/50" style={{ top: `${(index * ROW_HEIGHT) + ROW_HEIGHT -1}px`, height: '1px' }} />
                    ))}
                    
                    {/* Today Marker */}
                    {(() => {
                        const today = startOfDay(new Date());
                        if(today < timelineStart || today > timelineEnd) return null;
                        
                        let todayLeft;
                        if (viewMode === 'day') {
                            const todayOffsetDays = differenceInDays(today, timelineStart);
                            todayLeft = todayOffsetDays * dayWidth;
                        } else { // week view
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

                    {/* Task Bars */}
                    <div className="relative w-full h-full z-10">
                    {sortedTasks.map((task, index) => {
                        const assignees = (task.assigneeIds || []).map(id => findUserById(id, teamMembers)).filter(Boolean);
                        const taskStart = parseISO(task.startDate);
                        const taskEnd = parseISO(task.dueDate);

                        let left, width;
                        if (viewMode === 'day') {
                            const startOffset = differenceInDays(taskStart, timelineStart);
                            const duration = differenceInDays(taskEnd, taskStart) + 1;
                            left = startOffset * dayWidth;
                            width = duration * dayWidth - 2; // padding
                        } else { // week view
                            const startOffset = differenceInCalendarISOWeeks(taskStart, timelineStart);
                            const duration = differenceInCalendarISOWeeks(taskEnd, taskStart) + 1;
                            left = startOffset * WEEK_WIDTH;
                            width = duration * WEEK_WIDTH - 4; // padding
                        }
                        
                        return (
                        <Tooltip key={task.id}>
                            <TooltipTrigger asChild>
                            <div
                                className="absolute group flex items-center"
                                style={{
                                    top: `${index * ROW_HEIGHT + 6}px`,
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
                                    {(viewMode === 'day' || width > 50) && <p className='text-xs font-bold truncate text-white/90'>{task.title}</p>}
                                </div>
                                <div className="absolute right-[-35px] top-0 h-full flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <EditTaskDialog
                                        projectId={projectId}
                                        projectType={projectType}
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
                                    <div className="flex items-center -space-x-2">
                                        {assignees.map(assignee => (
                                            <Avatar key={assignee.id} className="h-6 w-6 border-2 border-tooltip">
                                                <AvatarImage src={assignee.avatarUrl} data-ai-hint="person portrait" />
                                                <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                        ))}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{assignees.map(a => a.name).join(', ')}</p>
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
      </div>
    </TooltipProvider>
  );
}
