
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AiSummaryDialog } from './ai-summary-dialog';
import type { Project } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ListTodo, CheckCircle, Clock } from 'lucide-react';

type ProjectCardProps = {
  project: Project;
};

export function ProjectCard({ project }: ProjectCardProps) {
  const { name, status, endDate, tasks, notes, team, projectType, annex, casr, tags } = project;
  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter((task) => task.status === 'Done').length || 0;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  const statusConfig = {
    'Completed': { icon: CheckCircle, color: 'text-green-500', label: 'Completed' },
    'On Track': { icon: Clock, color: 'text-blue-500', label: 'On Track' },
    'At Risk': { icon: Clock, color: 'text-yellow-500', label: 'At Risk' },
    'Off Track': { icon: Clock, color: 'text-red-500', label: 'Off Track' },
  };

  const currentStatus = statusConfig[status] || statusConfig['On Track'];

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

  return (
    <Link href={projectLink} className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg block h-full">
      <Card className="flex flex-col hover:shadow-lg transition-shadow duration-300 h-full">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-bold leading-snug">
              {displayName}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <currentStatus.icon className={cn("h-4 w-4", currentStatus.color)} />
              <span className={currentStatus.color}>{currentStatus.label}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground truncate">{displayDescription}</p>
        </CardHeader>
        <CardContent className="flex-grow space-y-4 pt-2">
            <div className="flex items-center justify-between mb-1">
               <span className="text-sm font-medium text-muted-foreground">Progress</span>
               <span className="text-sm font-bold">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                  <Avatar className="h-6 w-6">
                      <AvatarImage src={team[0]?.avatarUrl} alt={team[0]?.name} data-ai-hint="person portrait" />
                      <AvatarFallback>{team[0]?.name?.charAt(0) || team[0]?.email?.charAt(0) || '?'}</AvatarFallback>
                  </Avatar>
                  <span>{team[0]?.name}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                   <Clock className="h-4 w-4" />
                   <span>{format(parseISO(endDate), 'yyyy-MM-dd')}</span>
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
               <AiSummaryDialog
                  taskCompletion={progress.toFixed(0)}
                  notes={notes || ''}
               />
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
