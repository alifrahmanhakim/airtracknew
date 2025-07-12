
'use client';

import * as React from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Project, Task } from '@/lib/types';
import { InteractiveTimeline } from '@/components/interactive-timeline';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

type TimelineTask = Task & { projectName: string };

export default function ReportsPage() {
  const [allTasks, setAllTasks] = React.useState<TimelineTask[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchAllTasks = async () => {
      setIsLoading(true);
      try {
        const timKerjaProjectsSnapshot = await getDocs(collection(db, 'timKerjaProjects'));
        const rulemakingProjectsSnapshot = await getDocs(collection(db, 'rulemakingProjects'));

        const allProjects: Project[] = [
          ...timKerjaProjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)),
          ...rulemakingProjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project))
        ];

        const tasks: TimelineTask[] = allProjects.flatMap(project =>
          (project.tasks || []).map(task => ({
            ...task,
            projectName: project.name,
          }))
        );
        
        setAllTasks(tasks);
      } catch (error) {
        console.error("Failed to fetch tasks for timeline:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllTasks();
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <Skeleton className="h-8 w-72 mb-2" />
                <Skeleton className="h-5 w-96" />
              </div>
              <Skeleton className="h-10 w-full sm:w-[300px]" />
            </div>
            <div className="mt-4 pt-4 border-t">
              <Skeleton className="h-5 w-48" />
            </div>
          </CardHeader>
          <CardContent className="h-[60vh] space-y-8 pl-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="pl-12 w-full space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-5 w-1/2" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return <InteractiveTimeline tasks={allTasks} />;
}
