
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

function TaskCard({ task }: { task: AssignedTask }) {
  const isOverdue = isPast(parseISO(task.dueDate)) && task.status !== 'Done';
  const isHighPriority = task.projectTags?.some(tag => tag.toLowerCase().includes('priority'));
  const projectLink = task.projectType === 'Rulemaking' ? `/projects/${task.projectId}?type=rulemaking` : `/projects/${task.projectId}?type=timkerja`;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        {isHighPriority && (
            <Badge variant="destructive" className="w-fit mb-2">
                <Flag className="h-3 w-3 mr-1.5"/>
                High Priority
            </Badge>
        )}
        <CardTitle className="text-base">{task.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <Link href={projectLink} className="flex items-center gap-1.5 hover:text-primary transition-colors">
            <Folder className="h-3 w-3" />
            <span className='truncate max-w-[200px]'>{task.projectName}</span>
          </Link>
          <div className={cn("flex items-center gap-1.5", isOverdue && "text-destructive font-semibold")}>
            <Clock className="h-3 w-3" />
            <span>Due: {format(parseISO(task.dueDate), 'PPP')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


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
  
  const tasksByStatus = React.useMemo(() => {
    return {
      todo: assignedTasks.filter(t => t.status === 'To Do' || t.status === 'Blocked'),
      inProgress: assignedTasks.filter(t => t.status === 'In Progress'),
      done: assignedTasks.filter(t => t.status === 'Done').sort((a,b) => parseISO(b.dueDate).getTime() - parseISO(a.dueDate).getTime()),
    }
  }, [assignedTasks]);

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

      <div className="mb-8">
        <InteractiveTimeline tasks={assignedTasks} />
      </div>
      
      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="projects">My Projects ({myProjects.length})</TabsTrigger>
          <TabsTrigger value="tasks">My Tasks ({assignedTasks.length})</TabsTrigger>
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
          <Tabs defaultValue="todo" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="todo">To Do ({tasksByStatus.todo.length})</TabsTrigger>
              <TabsTrigger value="inProgress">In Progress ({tasksByStatus.inProgress.length})</TabsTrigger>
              <TabsTrigger value="done">Completed ({tasksByStatus.done.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="todo">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tasksByStatus.todo.length > 0 ? (
                        tasksByStatus.todo.map(task => <TaskCard key={task.id} task={task} />)
                    ) : (
                        <p className="col-span-full text-center text-muted-foreground py-10">You have no tasks to do. Great job!</p>
                    )}
                </div>
            </TabsContent>
            <TabsContent value="inProgress">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tasksByStatus.inProgress.length > 0 ? (
                        tasksByStatus.inProgress.map(task => <TaskCard key={task.id} task={task} />)
                    ) : (
                        <p className="col-span-full text-center text-muted-foreground py-10">No tasks are currently in progress.</p>
                    )}
                </div>
            </TabsContent>
            <TabsContent value="done">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tasksByStatus.done.length > 0 ? (
                        tasksByStatus.done.map(task => <TaskCard key={task.id} task={task} />)
                    ) : (
                        <p className="col-span-full text-center text-muted-foreground py-10">You have not completed any tasks yet.</p>
                    )}
                </div>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </main>
  );
}
