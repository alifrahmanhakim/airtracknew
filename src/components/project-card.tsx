import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
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
import { ListTodo } from 'lucide-react';

type ProjectCardProps = {
  project: Project;
};

export function ProjectCard({ project }: ProjectCardProps) {
  const { name, status, endDate, tasks, notes, team } = project;
  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter((task) => task.status === 'Done').length || 0;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  const statusStyles: { [key in Project['status']]: string } = {
    'On Track': 'border-blue-500 bg-blue-50 text-blue-700',
    'At Risk': 'border-yellow-500 bg-yellow-50 text-yellow-700',
    'Off Track': 'border-red-500 bg-red-50 text-red-700',
    'Completed': 'border-green-500 bg-green-50 text-green-700',
  }

  return (
    <Card className="flex flex-col hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold leading-snug">
             <Link href={`/projects/${project.id}`} className="hover:underline hover:text-primary">
                {name}
            </Link>
          </CardTitle>
          <Badge
            variant="outline"
            className={cn("text-xs font-bold whitespace-nowrap", statusStyles[status])}
          >
            {status}
          </Badge>
        </div>
        <CardDescription>
          Due: {format(parseISO(endDate), 'PPP')}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
             <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ListTodo className="w-4 h-4"/>
                Tasks
             </span>
             <span className="text-sm font-bold">{completedTasks}/{totalTasks}</span>
          </div>
          <Progress value={progress} />
        </div>
        <div>
            <span className="text-sm font-medium text-muted-foreground">Team</span>
            <div className="flex items-center space-x-2 mt-2">
                 <div className="flex -space-x-2 overflow-hidden">
                    {team.slice(0, 4).map(user => (
                        <Avatar key={user.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-white">
                            <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="person portrait" />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    ))}
                </div>
                {team.length > 4 && (
                    <span className="text-xs font-medium text-muted-foreground">+{team.length - 4} more</span>
                )}
            </div>
        </div>
      </CardContent>
      <CardFooter>
        <AiSummaryDialog
          taskCompletion={progress.toFixed(0)}
          notes={notes || ''}
        />
      </CardFooter>
    </Card>
  );
}
