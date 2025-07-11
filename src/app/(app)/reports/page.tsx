import { InteractiveTimeline } from '@/components/interactive-timeline';
import { projects } from '@/lib/data';

export default function ReportsPage() {
  const allTasks = projects.flatMap(project => 
    project.tasks.map(task => ({ ...task, projectName: project.name }))
  );

  return <InteractiveTimeline tasks={allTasks} />;
}
