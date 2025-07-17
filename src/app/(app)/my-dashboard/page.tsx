
'use client';

import * as React from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Project, Task, User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectCard } from '@/components/project-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { format, parseISO, differenceInDays } from 'date-fns';
import { Folder, AlertTriangle, ListTodo, FolderKanban, CalendarClock, Bell, ClipboardCheck, CircleHelp, GitCompareArrows, BookText, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { InteractiveTimeline } from '@/components/interactive-timeline';
import { Button } from '@/components/ui/button';

type AssignedTask = Task & {
  projectId: string;
  projectName: string;
  projectType: Project['projectType'];
  projectTags?: string[];
};

type WorkspaceAnalytics = {
  ccefod: number;
  pqs: number;
  gapAnalysis: number;
  glossary: number;
}

export default function MyDashboardPage() {
  const [assignedTasks, setAssignedTasks] = React.useState<AssignedTask[]>([]);
  const [myProjects, setMyProjects] = React.useState<Project[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [workspaceAnalytics, setWorkspaceAnalytics] = React.useState<WorkspaceAnalytics>({
      ccefod: 0,
      pqs: 0,
      gapAnalysis: 0,
      glossary: 0,
  });

  React.useEffect(() => {
    const id = localStorage.getItem('loggedInUserId');
    setUserId(id);
  }, []);

  React.useEffect(() => {
    if (!userId) {
      setIsLoading(false);
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
        const ccefodPromise = getDocs(collection(db, 'ccefodRecords'));
        const pqsPromise = getDocs(collection(db, 'pqsRecords'));
        const gapAnalysisPromise = getDocs(collection(db, 'gapAnalysisRecords'));
        const glossaryPromise = getDocs(collection(db, 'glossaryRecords'));


        const [
            timKerjaSnapshot, 
            rulemakingSnapshot,
            ccefodSnapshot,
            pqsSnapshot,
            gapAnalysisSnapshot,
            glossarySnapshot,
        ] = await Promise.all([
            timKerjaPromise, 
            rulemakingPromise,
            ccefodPromise,
            pqsPromise,
            gapAnalysisPromise,
            glossaryPromise
        ]);
        
        setWorkspaceAnalytics({
            ccefod: ccefodSnapshot.size,
            pqs: pqsSnapshot.size,
            gapAnalysis: gapAnalysisSnapshot.size,
            glossary: glossarySnapshot.size,
        });

        const allProjects: Project[] = [
          ...timKerjaSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), projectType: 'Tim Kerja' } as Project)),
          ...rulemakingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), projectType: 'Rulemaking' } as Project))
        ];
        
        const tasksForUser: AssignedTask[] = [];
        const projectsForUser: Project[] = [];

        allProjects.forEach(project => {
          if (project.team && project.team.some(member => member.id === userId)) {
            projectsForUser.push(project);
            (project.tasks || []).forEach(task => {
              if (task.assigneeIds && task.assigneeIds.includes(userId)) {
                tasksForUser.push({
                  ...task,
                  projectId: project.id,
                  projectName: project.name,
                  projectType: project.projectType,
                  projectTags: project.tags,
                });
              }
            });
          }
        });
        
        tasksForUser.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        projectsForUser.sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        
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
  
  const statusStyles: { [key in Task['status']]: string } = {
    'Done': 'border-transparent bg-green-100 text-green-800',
    'In Progress': 'border-transparent bg-blue-100 text-blue-800',
    'To Do': 'border-transparent bg-gray-100 text-gray-800',
    'Blocked': 'border-transparent bg-red-100 text-red-800',
  };

  const openTasksCount = assignedTasks.filter(t => t.status !== 'Done').length;
  const atRiskProjectsCount = myProjects.filter(p => p.status === 'At Risk' || p.status === 'Off Track').length;
  const upcomingTasks = assignedTasks
    .filter(t => t.status !== 'Done' && new Date(t.dueDate) >= new Date())
    .slice(0, 3);
    
  const workspaceCards = [
    { title: "CC/EFOD", value: workspaceAnalytics.ccefod, icon: ClipboardCheck, href: "/ccefod", color: "text-blue-500" },
    { title: "PQs", value: workspaceAnalytics.pqs, icon: CircleHelp, href: "/pqs", color: "text-green-500" },
    { title: "GAP Analysis", value: workspaceAnalytics.gapAnalysis, icon: GitCompareArrows, href: "/gap-analysis", color: "text-yellow-500" },
    { title: "Glossary", value: workspaceAnalytics.glossary, icon: BookText, href: "/glossary", color: "text-purple-500" },
  ]

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <Skeleton className="h-9 w-72 mb-2" />
        <Skeleton className="h-5 w-96 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
                <Skeleton className="h-10 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Skeleton className="h-48" />
                    <Skeleton className="h-48" />
                </div>
            </div>
            <div className="lg:col-span-1 space-y-4">
                <Skeleton className="h-32" />
                <Skeleton className="h-48" />
            </div>
        </div>
      </div>
    );
  }

  return (
    <main className="p-4 md:p-8">
      <div className="mb-8 p-4 rounded-lg bg-card/80 backdrop-blur-sm">
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {currentUser?.name || 'User'}. Here is your personal overview.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 xl:col-span-3">
            <Tabs defaultValue="projects" className="w-full">
                <TabsList className="mb-4">
                <TabsTrigger value="projects">My Projects ({myProjects.length})</TabsTrigger>
                <TabsTrigger value="tasks">My Tasks ({assignedTasks.length})</TabsTrigger>
                <TabsTrigger value="timeline">My Timeline</TabsTrigger>
                </TabsList>

                <TabsContent value="projects">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {myProjects.length > 0 ? (
                            myProjects.map(project => <ProjectCard key={project.id} project={project} />)
                        ) : (
                            <div className="col-span-full text-center text-muted-foreground py-16 bg-muted/50 rounded-lg">
                                <FolderKanban className="mx-auto h-12 w-12 mb-4" />
                                <p className="font-semibold">No Projects Assigned</p>
                                <p className="text-sm">You are not a member of any projects yet.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>
                <TabsContent value="tasks">
                <Card>
                    <CardHeader>
                    <CardTitle>My Assigned Tasks</CardTitle>
                    <CardDescription>All tasks assigned to you across all projects, sorted by due date.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Task</TableHead>
                            <TableHead>Project</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {assignedTasks.length > 0 ? (
                            assignedTasks.map(task => (
                            <TableRow key={task.id}>
                                <TableCell className="font-medium">{task.title}</TableCell>
                                <TableCell>
                                <Link href={`/projects/${task.projectId}?type=${task.projectType === 'Rulemaking' ? 'rulemaking' : 'timkerja'}`} className="flex items-center gap-2 hover:underline text-muted-foreground hover:text-primary">
                                    <Folder className="h-4 w-4" />
                                    {task.projectName}
                                </Link>
                                </TableCell>
                                <TableCell>{format(parseISO(task.dueDate), 'PPP')}</TableCell>
                                <TableCell>
                                <Badge variant="outline" className={cn("text-xs font-semibold", statusStyles[task.status])}>
                                    {task.status}
                                </Badge>
                                </TableCell>
                            </TableRow>
                            ))
                        ) : (
                            <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                You have no assigned tasks.
                            </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                    </CardContent>
                </Card>
                </TabsContent>
                <TabsContent value="timeline">
                    <InteractiveTimeline tasks={assignedTasks} />
                </TabsContent>
            </Tabs>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1 xl:col-span-1 space-y-6 mt-14">
            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-2 h-16">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground"><FolderKanban className="h-4 w-4" /> My Projects</CardTitle>
                    </CardHeader>
                    <CardContent><div className="text-3xl font-bold">{myProjects.length}</div></CardContent>
                </Card>
                 <Card>
                    <CardHeader className="pb-2 h-16">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground"><ListTodo className="h-4 w-4" /> Open Tasks</CardTitle>
                    </CardHeader>
                    <CardContent><div className="text-3xl font-bold">{openTasksCount}</div></CardContent>
                </Card>
                 <Card className="col-span-2">
                    <CardHeader className="pb-2 h-16">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground"><AlertTriangle className="h-4 w-4 text-yellow-500" /> Projects at Risk</CardTitle>
                    </CardHeader>
                    <CardContent><div className="text-3xl font-bold text-yellow-500">{atRiskProjectsCount}</div></CardContent>
                </Card>
            </div>
             <Card className="border-primary">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary"><Bell className="h-5 w-5"/> Upcoming Tasks</CardTitle>
                    <CardDescription>Your next 3 deadlines.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {upcomingTasks.length > 0 ? (
                        upcomingTasks.map((task, index) => {
                             const daysLeft = differenceInDays(parseISO(task.dueDate), new Date());
                             const dueDateColor = daysLeft < 3 ? 'text-red-500' : daysLeft < 7 ? 'text-yellow-600' : 'text-muted-foreground';
                            return (
                                <React.Fragment key={task.id}>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <p className="font-semibold leading-tight">{task.title}</p>
                                            <p className="text-xs text-muted-foreground">{task.projectName}</p>
                                        </div>
                                        <div className="text-right">
                                             <p className={cn("text-sm font-bold", dueDateColor)}>{format(parseISO(task.dueDate), 'dd MMM')}</p>
                                             <p className={cn("text-xs", dueDateColor)}>
                                                {daysLeft <= 0 ? 'Today' : `${daysLeft}d left`}
                                             </p>
                                        </div>
                                    </div>
                                    {index < upcomingTasks.length - 1 && <Separator />}
                                </React.Fragment>
                            )
                        })
                    ) : (
                        <div className="text-center text-sm text-muted-foreground py-4">
                            <CalendarClock className="mx-auto h-8 w-8 mb-2" />
                            No upcoming tasks. You're all caught up!
                        </div>
                    )}
                </CardContent>
             </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Workspace Overview</CardTitle>
                    <CardDescription>At-a-glance view of key modules.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    {workspaceCards.map(item => (
                        <Link href={item.href} key={item.title}>
                            <div className="p-3 rounded-lg border bg-background hover:bg-muted/80 hover:shadow-sm transition-all text-center">
                                <item.icon className={cn("h-8 w-8 mx-auto mb-2", item.color)} />
                                <p className="font-bold text-lg">{item.value}</p>
                                <p className="text-xs font-medium text-muted-foreground">{item.title}</p>
                            </div>
                        </Link>
                    ))}
                </CardContent>
             </Card>
        </aside>
      </div>
    </main>
  );
}
