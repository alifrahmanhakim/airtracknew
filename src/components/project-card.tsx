
'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from './ui/progress';
import type { Project, Task, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format, parseISO, isAfter, differenceInDays, startOfToday } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ListTodo, Users, Calendar, CheckCircle, Clock, AlertTriangle, User as UserIcon, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { countAllTasks } from '@/lib/data-utils';


type ProjectCardProps = {
  project: Project;
  allUsers: User[];
};

export function ProjectCard({ project, allUsers }: ProjectCardProps) {
  const { name, status, endDate, startDate, tasks, notes, team, projectType, annex, casr, tags } = project;

  const { total: totalTasks, completed: completedTasks, hasCritical } = countAllTasks(tasks || []);
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  const getEffectiveStatus = (): Project['status'] => {
    // 1. If progress is 100% or status is manually set to Completed, it's Completed.
    if (progress === 100 || status === 'Completed') {
      return 'Completed';
    }
  
    const today = startOfToday();
    const projectEnd = parseISO(endDate);
  
    // 2. Highest priority after completion: If the end date is in the past, it's Off Track.
    if (isAfter(today, projectEnd)) {
      return 'Off Track';
    }
  
    // 3. If there is a critical issue, it's At Risk.
    if (hasCritical) {
      return 'At Risk';
    }
    
    const projectStart = parseISO(startDate);
    const totalDuration = differenceInDays(projectEnd, projectStart);
  
    // 4. If progress is significantly behind the time elapsed, it's At Risk.
    if (totalDuration > 0) {
      const elapsedDuration = differenceInDays(today, projectStart);
      const timeProgress = (elapsedDuration / totalDuration) * 100;
  
      if (progress < timeProgress - 20) {
        return 'At Risk';
      }
    }
    
    // 5. If none of the above severe conditions are met, it's On Track.
    return 'On Track';
  };
  
  const effectiveStatus = getEffectiveStatus();

  const statusConfig = {
    'Completed': { icon: CheckCircle, style: 'border-transparent bg-green-100 text-green-800', label: 'Completed' },
    'On Track': { icon: Clock, style: 'border-transparent bg-blue-100 text-blue-800', label: 'On Track' },
    'At Risk': { icon: AlertTriangle, style: 'border-transparent bg-yellow-100 text-yellow-800', label: 'At Risk' },
    'Off Track': { icon: AlertCircle, style: 'border-transparent bg-red-100 text-red-800', label: 'Off Track' },
  };

  const currentStatus = statusConfig[effectiveStatus] || statusConfig['On Track'];

  const getTagColor = (tag: string) => {
    if (tag.toLowerCase().includes('priority')) return 'bg-red-100 text-red-800';
    if (tag.toLowerCase().includes('review')) return 'bg-yellow-100 text-yellow-800';
    if (tag.toLowerCase().includes('core')) return 'bg-blue-100 text-blue-800';
    if (tag.toLowerCase().includes('finalized')) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const displayName = projectType === 'Rulemaking' ? `CASR ${casr}` : name;
  const displayDescription = projectType === 'Rulemaking' ? `Annex ${annex} - ${name}` : project.description;
  const projectLink = projectType === 'Rulemaking' ? `/projects/${project.id}?type=rulemaking` : `/projects/${project.id}?type=timkerja`;
  
  const daysLeft = differenceInDays(parseISO(endDate), new Date());

  return (
    <TooltipProvider>
      <Link href={projectLink} className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg block h-full group">
        <Card className="flex flex-col hover:shadow-lg transition-shadow duration-300 h-full overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start gap-2">
              <CardTitle className="text-lg font-bold leading-snug">
                {displayName}
              </CardTitle>
               <Badge variant="outline" className={cn("text-xs font-semibold gap-1.5 pl-1.5", currentStatus.style)}>
                  <currentStatus.icon className="h-3.5 w-3.5" />
                  {currentStatus.label}
              </Badge>
            </div>
            <CardDescription className="text-sm text-muted-foreground truncate h-10">{displayDescription}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col justify-center items-center space-y-1">
                    <div className="relative h-20 w-20">
                        <svg className="h-full w-full" viewBox="0 0 36 36">
                            <path
                                d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                                className="text-muted/50"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                            />
                            <path
                                d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                                className="text-primary"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeDasharray={`${progress}, 100`}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-bold">{Math.round(progress)}%</span>
                        </div>
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                        <ListTodo className="h-5 w-5 text-muted-foreground"/>
                        <div>
                            <p className="font-bold">{completedTasks}/{totalTasks}</p>
                            <p className="text-xs text-muted-foreground">Tasks Done</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-3 text-sm">
                        <Users className="h-5 w-5 text-muted-foreground"/>
                        <div className="flex items-center -space-x-2">
                            {team.slice(0, 3).map((member) => {
                                const fullUser = allUsers.find(u => u.id === member.id);
                                const isOnline = fullUser?.lastOnline ? (new Date().getTime() - new Date(fullUser.lastOnline).getTime()) / (1000 * 60) < 5 : false;
                                return (
                                    <Tooltip key={member.id}>
                                        <TooltipTrigger asChild>
                                            <Avatar className="h-7 w-7 border-2 border-background" online={isOnline}>
                                                <AvatarImage src={member.avatarUrl} alt={member.name} data-ai-hint="person portrait" />
                                                <AvatarFallback>
                                                    <UserIcon className="h-4 w-4" />
                                                </AvatarFallback>
                                            </Avatar>
                                        </TooltipTrigger>
                                        <TooltipContent><p>{member.name}</p></TooltipContent>
                                    </Tooltip>
                                )}
                            )}
                            {team.length > 3 && (
                                <Avatar className="h-7 w-7 border-2 border-background">
                                    <AvatarFallback>+{team.length - 3}</AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    </div>
                     <div className="flex items-center gap-3 text-sm">
                        <Calendar className="h-5 w-5 text-muted-foreground"/>
                        <div>
                            <p className="font-bold">{format(parseISO(endDate), 'dd MMM yyyy')}</p>
                             <p className={cn("text-xs", daysLeft < 0 && effectiveStatus !== 'Completed' ? "text-destructive" : "text-muted-foreground")}>
                                {effectiveStatus === 'Completed' ? 'Project completed' : (daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days remaining`)}
                             </p>
                        </div>
                    </div>
                </div>
              </div>
          </CardContent>
          <CardFooter className="pt-2 flex-wrap gap-2 mt-auto">
            {tags?.map(tag => (
                <Badge key={tag} variant="outline" className={cn("font-medium", getTagColor(tag))}>
                    {tag}
                </Badge>
            ))}
            <div className="ml-auto" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
            </div>
          </CardFooter>
        </Card>
      </Link>
    </TooltipProvider>
  );
}
