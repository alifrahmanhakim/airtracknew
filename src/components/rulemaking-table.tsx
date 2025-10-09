
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Project, User } from '@/lib/types';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ArrowUpDown, CheckCircle, Clock, AlertTriangle, AlertCircle, User as UserIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Progress } from './ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import Link from 'next/link';

type SortDescriptor = {
    column: keyof Project | 'progress';
    direction: 'asc' | 'desc';
} | null;

type RulemakingTableProps = {
  projects: Project[];
  sort: SortDescriptor;
  setSort: (sort: SortDescriptor) => void;
};

const statusConfig: { [key in Project['status']]: { icon: React.ElementType, style: string, label: string } } = {
    'Completed': { icon: CheckCircle, style: 'border-transparent bg-green-100 text-green-800', label: 'Completed' },
    'On Track': { icon: Clock, style: 'border-transparent bg-blue-100 text-blue-800', label: 'On Track' },
    'At Risk': { icon: AlertTriangle, style: 'border-transparent bg-yellow-100 text-yellow-800', label: 'At Risk' },
    'Off Track': { icon: AlertCircle, style: 'border-transparent bg-red-100 text-red-800', label: 'Off Track' },
};

export function RulemakingTable({ projects, sort, setSort }: RulemakingTableProps) {
  const router = useRouter();

  const handleSort = (column: keyof Project | 'progress') => {
    setSort(prevSort => {
        if (prevSort?.column === column) {
            return { column, direction: prevSort.direction === 'asc' ? 'desc' : 'asc' };
        }
        return { column, direction: 'asc' };
    });
  };

  const renderSortIcon = (column: keyof Project | 'progress') => {
      if (sort?.column !== column) return <ArrowUpDown className="h-4 w-4 ml-2 opacity-30" />;
      return sort.direction === 'asc' ? <ArrowUpDown className="h-4 w-4 ml-2" /> : <ArrowUpDown className="h-4 w-4 ml-2" />;
  };

  const sortedProjects = React.useMemo(() => {
    let sorted = [...projects];
    if (sort) {
        sorted.sort((a, b) => {
            if (sort.column === 'progress') {
                const progressA = (a.tasks?.filter(t => t.status === 'Done').length || 0) / (a.tasks?.length || 1);
                const progressB = (b.tasks?.filter(t => t.status === 'Done').length || 0) / (b.tasks?.length || 1);
                return sort.direction === 'asc' ? progressA - progressB : progressB - progressA;
            }

            const valA = a[sort.column as keyof Project] ?? '';
            const valB = b[sort.column as keyof Project] ?? '';

            if (sort.column === 'endDate' || sort.column === 'startDate') {
                return sort.direction === 'asc' 
                    ? parseISO(valA as string).getTime() - parseISO(valB as string).getTime()
                    : parseISO(valB as string).getTime() - parseISO(valA as string).getTime();
            }

            return sort.direction === 'asc' ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
        });
    }
    return sorted;
  }, [projects, sort]);


  return (
    <TooltipProvider>
      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => handleSort('casr')}>
                <div className="flex items-center">CASR {renderSortIcon('casr')}</div>
              </TableHead>
              <TableHead className="w-[30%] cursor-pointer" onClick={() => handleSort('name')}>
                <div className="flex items-center">Title {renderSortIcon('name')}</div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                <div className="flex items-center">Status {renderSortIcon('status')}</div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('progress')}>
                <div className="flex items-center">Progress {renderSortIcon('progress')}</div>
              </TableHead>
              <TableHead>Team</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('endDate')}>
                <div className="flex items-center">Due Date {renderSortIcon('endDate')}</div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProjects.map((project) => {
              const totalTasks = project.tasks?.length || 0;
              const completedTasks = project.tasks?.filter((task) => task.status === 'Done').length || 0;
              const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
              const currentStatus = statusConfig[project.status];

              return (
                <TableRow 
                  key={project.id} 
                  onClick={() => router.push(`/projects/${project.id}?type=rulemaking`)}
                  className="cursor-pointer"
                >
                  <TableCell className="font-bold">
                    {project.casr}
                  </TableCell>
                  <TableCell className="font-medium">
                    {project.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-xs font-semibold gap-1.5 pl-1.5", currentStatus.style)}>
                        <currentStatus.icon className="h-3.5 w-3.5" />
                        {currentStatus.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        <Progress value={progress} className="h-1.5 w-20" />
                        <span className="text-xs text-muted-foreground font-mono">{Math.round(progress)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center -space-x-2">
                        {(project.team || []).slice(0, 3).map((member) => (
                            <Tooltip key={member.id}>
                                <TooltipTrigger asChild>
                                    <Avatar className="h-7 w-7 border-2 border-background">
                                        <AvatarImage src={member.avatarUrl} alt={member.name} />
                                        <AvatarFallback>
                                          {member.name ? member.name.charAt(0) : (member.email ? member.email.charAt(0) : 'U')}
                                        </AvatarFallback>
                                    </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>{member.name || member.email}</TooltipContent>
                            </Tooltip>
                        ))}
                        {project.team.length > 3 && (
                            <Avatar className="h-7 w-7 border-2 border-background">
                                <AvatarFallback>+{project.team.length - 3}</AvatarFallback>
                            </Avatar>
                        )}
                    </div>
                  </TableCell>
                  <TableCell>{format(parseISO(project.endDate), 'dd MMM yyyy')}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}
