
'use client';

import * as React from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Project, Task, User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Clock, Folder, Flag } from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ProjectCard } from '@/components/project-card';
import { InteractiveTimeline } from '@/components/interactive-timeline';

type AssignedTask = Task & {
  projectId: string;
  projectName: string;
  projectType: Project['projectType'];
  projectTags?: string[];
};

export default function MyDashboardPage() {
  const [assignedTasks, setAssignedTasks] = React.useState<AssignedTask[]>([]);
  const [myProjects, setMyProjects] = React.useState<Project[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [userId, setUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const id = localStorage.getItem('loggedInUserId');
    setUserId(id);
  }, []);

  React.useEffect(() => {
    if (!userId) {
      setIsLoading(false); // If no user ID, stop loading
      return;
    };

    const fetchUserData = async () => {
      setIsLoading(true);
      
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setCurrentUser({ id: userSnap.id, ...userSnap.data() } as User);
      }

      try {
        const timKerjaPromise = getDocs(collection(db, 'timKerjaProjects'));
        const rulemakingPromise = getDocs(collection(db, 'rulemakingProjects'));

        const [timKerjaSnapshot, rulemakingSnapshot] = await Promise.all([timKerjaPromise, rulemakingPromise]);

        const allProjects: Project[] = [
          ...timKerjaSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), projectType: 'Tim Kerja' } as Project)),
          ...rulemakingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), projectType: 'Rulemaking' } as Project))
        ];
        
        const tasksForUser: AssignedTask[] = [];
        const projectsForUser: Project[] = [];

        allProjects.forEach(project => {
          // Check for assigned tasks
          (project.tasks || []).forEach(task => {
            if (task.assigneeId === userId) {
              tasksForUser.push({
                ...task,
                projectId: project.id,
                projectName: project.name,
                projectType: project.projectType,
                projectTags: project.tags,
              });
            }
          });

          // Check for project membership
          if (project.team.some(member => member.id === userId)) {
            projectsForUser.push(project);
          }
        });
        
        tasksForUser.sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime());
        projectsForUser.sort((a,b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime());
        
        setAssignedTasks(tasksForUser);
        setMyProjects(projectsForUser);

      } catch (error) {
        console.error("Failed to fetch assigned data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);
  
  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <Skeleton className="h-9 w-72 mb-2" />
        <Skeleton className="h-5 w-96 mb-8" />
        <Skeleton className="h-64 w-full mb-8" />
        <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
            </div>
        </div>
      </div>
    );
  }

  return (
    <main className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {currentUser?.name || 'User'}. Here are your assigned projects and tasks.
        </p>
      </div>
      
      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="projects">My Projects ({myProjects.length})</TabsTrigger>
          <TabsTrigger value="tasks">My Timeline ({assignedTasks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                 {myProjects.length > 0 ? (
                    myProjects.map(project => <ProjectCard key={project.id} project={project} />)
                ) : (
                    <p className="col-span-full text-center text-muted-foreground py-10">You are not a member of any projects yet.</p>
                )}
            </div>
        </TabsContent>
        
        <TabsContent value="tasks">
          <InteractiveTimeline tasks={assignedTasks} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
