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

type ProjectCardProps = {
  project: Project;
};

export function ProjectCard({ project }: ProjectCardProps) {
  const { name, status, endDate, tasks, notes } = project;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === 'Done').length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const statusVariant: { [key in Project['status']]: 'default' | 'destructive' | 'secondary' | 'outline' } = {
    'On Track': 'default',
    'At Risk': 'secondary',
    'Off Track': 'destructive',
    'Completed': 'outline',
  };
  
  const statusColor: { [key in Project['status']]: string } = {
    'On Track': 'bg-blue-500',
    'At Risk': 'bg-yellow-500',
    'Off Track': 'bg-red-500',
    'Completed': 'bg-green-500',
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">
             <Link href={`/projects/${project.id}`} className="hover:underline">
                {name}
            </Link>
          </CardTitle>
          <Badge
            variant={statusVariant[status]}
            className={cn({
              'bg-yellow-400 text-yellow-900': status === 'At Risk',
              'bg-green-100 text-green-800 border-green-300': status === 'Completed',
            })}
          >
            {status}
          </Badge>
        </div>
        <CardDescription>
          Deadline: {format(parseISO(endDate), 'PPP')}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
          <Progress value={progress} className="flex-1" />
        </div>
      </CardContent>
      <CardFooter>
        <AiSummaryDialog
          taskCompletion={progress.toFixed(0)}
          notes={notes}
        />
      </CardFooter>
    </Card>
  );
}
