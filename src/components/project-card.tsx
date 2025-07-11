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
  
  const statusStyles: { [key in Project['status']]: string } = {
    'On Track': 'bg-blue-500 hover:bg-blue-600 text-white border-transparent',
    'At Risk': 'bg-yellow-500 hover:bg-yellow-600 text-white border-transparent',
    'Off Track': 'bg-red-500 hover:bg-red-600 text-white border-transparent',
    'Completed': 'bg-green-500 hover:bg-green-600 text-white border-transparent',
  }

  return (
    <Card className="flex flex-col hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold">
             <Link href={`/projects/${project.id}`} className="hover:underline">
                {name}
            </Link>
          </CardTitle>
          <Badge
            className={cn("text-xs font-bold", statusStyles[status])}
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
          <span className="text-sm font-semibold text-muted-foreground w-12 text-right">{Math.round(progress)}%</span>
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
