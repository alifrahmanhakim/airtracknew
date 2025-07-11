
'use client';

import * as React from 'react';
import { useState } from 'react';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Calendar as CalendarIcon, Filter, Info } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Task } from '@/lib/types';
import { Badge } from './ui/badge';

type TimelineTask = Task & { projectName: string };

type InteractiveTimelineProps = {
  tasks: TimelineTask[];
};

const statusConfig: { [key in Task['status']]: { color: string; label: string } } = {
  'Done': { color: 'bg-green-500', label: 'Done' },
  'In Progress': { color: 'bg-blue-500', label: 'In Progress' },
  'To Do': { color: 'bg-gray-400', label: 'To Do' },
  'Blocked': { color: 'bg-red-500', label: 'Blocked' },
};

export function InteractiveTimeline({ tasks }: InteractiveTimelineProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 3)),
    to: new Date(),
  });

  const filteredTasks = React.useMemo(() => {
    return tasks
      .filter((task) => {
        if (!dateRange?.from) return true;
        const taskDueDate = parseISO(task.dueDate);
        const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
        return isWithinInterval(taskDueDate, { start: startOfDay(dateRange.from), end: end });
      })
      .sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime());
  }, [tasks, dateRange]);

  return (
    <TooltipProvider>
      <div className="p-4 md:p-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <CardTitle>Interactive Project Timeline</CardTitle>
                <CardDescription>A centralized timeline of all tasks across projects. Filter by date.</CardDescription>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={'outline'}
                    className={cn(
                      'w-full sm:w-[300px] justify-start text-left font-normal',
                      !dateRange && 'text-muted-foreground'
                    )}
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                        </>
                      ) : (
                        format(dateRange.from, 'LLL dd, y')
                      )
                    ) : (
                      <span>Filter by date range...</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 items-center mt-4 pt-4 border-t">
              <span className="text-sm font-semibold">Legend:</span>
              {Object.entries(statusConfig).map(([status, { color, label }]) => (
                <div key={status} className="flex items-center gap-2">
                  <div className={cn('h-3 w-3 rounded-full', color)}></div>
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </CardHeader>
          <CardContent className="h-[60vh] overflow-y-auto">
            <div className="relative pl-6 before:absolute before:left-[1.10rem] before:top-0 before:h-full before:w-0.5 before:bg-border">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <div key={task.id} className="relative mb-8 flex items-start">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={cn("absolute -left-1.5 top-1.5 h-8 w-8 rounded-full border-4 border-background flex items-center justify-center cursor-pointer transition-transform hover:scale-110", statusConfig[task.status].color)}>
                           <Info className="h-4 w-4 text-white" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                          <p className="font-bold">{task.title}</p>
                          <p><span className="font-semibold">Project:</span> {task.projectName}</p>
                          <p><span className="font-semibold">Status:</span> {task.status}</p>
                          <p><span className="font-semibold">Due:</span> {format(parseISO(task.dueDate), 'PPP')}</p>
                      </TooltipContent>
                    </Tooltip>
                    <div className="pl-12 w-full">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">{format(parseISO(task.dueDate), 'PPP')}</p>
                         <Badge variant="outline" className="font-semibold">
                          {task.status}
                        </Badge>
                      </div>
                      <h4 className="font-semibold">{task.title}</h4>
                      <p className="text-sm text-muted-foreground">{task.projectName}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <p>No tasks found within the selected date range.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
