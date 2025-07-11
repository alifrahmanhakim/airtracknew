
'use client';

import * as React from 'react';
import { useState } from 'react';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Calendar as CalendarIcon, Filter } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { Task } from '@/lib/types';

type TimelineTask = Task & { projectName: string };

type InteractiveTimelineProps = {
  tasks: TimelineTask[];
};

export function InteractiveTimeline({ tasks }: InteractiveTimelineProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 3)),
    to: new Date(),
  });

  const filteredTasks = React.useMemo(() => {
    return tasks
      .filter((task) => {
        if (!dateRange?.from || !dateRange?.to) return true;
        const taskDueDate = parseISO(task.dueDate);
        return isWithinInterval(taskDueDate, { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) });
      })
      .sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime());
  }, [tasks, dateRange]);
  
  const statusColor: { [key in Task['status']]: string } = {
    'Done': 'bg-green-500',
    'In Progress': 'bg-blue-500',
    'To Do': 'bg-gray-400',
    'Blocked': 'bg-red-500',
  }

  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Project Timeline</CardTitle>
              <CardDescription>An interactive timeline of all project tasks. Filter by date.</CardDescription>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={'outline'}
                  className={cn(
                    'w-[300px] justify-start text-left font-normal',
                    !dateRange && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                      </>
                    ) : (
                      format(dateRange.from, 'LLL dd, y')
                    )
                  ) : (
                    <span>Pick a date range</span>
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
        </CardHeader>
        <CardContent>
          <div className="relative pl-6 before:absolute before:left-6 before:top-0 before:h-full before:w-0.5 before:bg-border">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task, index) => (
                <div key={task.id} className="relative mb-8 flex items-start">
                  <div className="absolute -left-2.5 top-1.5 h-5 w-5 rounded-full bg-background border-2 border-primary"></div>
                  <div className="pl-8 w-full">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">{format(parseISO(task.dueDate), 'PPP')}</p>
                       <span className={cn("text-xs font-semibold px-2 py-1 rounded-full text-white", statusColor[task.status])}>
                        {task.status}
                      </span>
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
  );
}
