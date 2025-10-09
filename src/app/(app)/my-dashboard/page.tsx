
'use client';

import * as React from 'react';
import { collection, getDocs, doc, getDoc, getCountFromServer } from 'firebase/firestore';
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
import { format, parseISO, differenceInDays, isAfter } from 'date-fns';
import { Folder, AlertTriangle, ListTodo, FolderKanban, CalendarClock, Bell, ClipboardCheck, CircleHelp, GitCompareArrows, BookText, ArrowRight, Loader2, CalendarX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { InteractiveTimeline } from '@/components/interactive-timeline';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { updateTask } from '@/lib/actions/project';

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
  const [allUsers, setAllUsers] = React.useState<User[]>([]);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [workspaceAnalytics, setWorkspaceAnalytics] = React.useState<WorkspaceAnalytics>({
      ccefod: 0,
      pqs: 0,
      gapAnalysis: 0,
      glossary: 0,
  });
  const [taskToComplete, setTaskToComplete] = React.useState<AssignedTask | null>(null);
  const [isUpdatingTask, setIsUpdatingTask] = React.useState(false);
  const { toast } = useToast();

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
        const usersPromise = getDocs(collection(db, 'users'));
        const timKerjaPromise = getDocs(collection(db, 'timKerjaProjects'));
        const rulemakingPromise = getDocs(collection(db, 'rulemakingProjects'));
        
        // Use getCountFromServer for efficient counting
        const ccefodPromise = getCountFromServer(collection(db, 'ccefodRecords'));
        const pqsPromise = getCountFromServer(collection(db, 'pqsRecords'));
        const gapAnalysisPromise = getCountFromServer(collection(db, 'gapAnalysisRecords'));
        const glossaryPromise = getCountFromServer(collection(db, 'glossaryRecords'));

        const [
            usersSnapshot,
            timKerjaSnapshot,
            rulemakingSnapshot,
            ccefodSnapshot,
            pqsSnapshot,
            gapAnalysisSnapshot,
            glossarySnapshot,
        ] = await Promise.all([
            usersPromise,
            timKerjaPromise,
            rulemakingPromise,
            ccefodPromise,
            pqsPromise,
            gapAnalysisPromise,
            glossaryPromise
        ]);

        const usersFromDb: User[] = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setAllUsers(usersFromDb);
        
        setWorkspaceAnalytics({
            ccefod: ccefodSnapshot.data().count,
            pqs: pqsSnapshot.data().count,
            gapAnalysis: gapAnalysisSnapshot.data().count,
            glossary: glossarySnapshot.data().count,
        });

        const timKerjaProjects = timKerjaSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), projectType: 'Tim Kerja' } as Project));
        const rulemakingProjects = rulemakingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), projectType: 'Rulemaking' } as Project));
        const allProjects: Project[] = [...timKerjaProjects, ...rulemakingProjects];
        
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

  const handleCompleteTask = async () => {
    if (!taskToComplete) return;

    setIsUpdatingTask(true);
    const updatedTask: Task = {
        ...taskToComplete,
        status: 'Done',
        doneDate: format(new Date(), 'yyyy-MM-dd'),
    };
    
    // Remove properties that are not part of the base Task type
    const { projectId, projectName, projectType, projectTags, ...baseTask } = updatedTask;

    const result = await updateTask(projectId, baseTask, projectType);
    
    if (result.success) {
        setAssignedTasks(prev => prev.map(t => t.id === taskToComplete.id ? { ...t, status: 'Done' } : t));
        toast({
            title: 'Task Completed!',
            description: `"${taskToComplete.title}" has been marked as done.`,
        });
    } else {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: result.error || "Failed to update task.",
        });
    }

    setTaskToComplete(null);
    setIsUpdatingTask(false);
  }
  
  const statusStyles: { [key in Task['status']]: string } = {
    'Done': 'border-transparent bg-green-100 text-green-800',
    'In Progress': 'border-transparent bg-blue-100 text-blue-800',
    'To Do': 'border-transparent bg-gray-100 text-gray-800',
    'Blocked': 'border-transparent bg-red-100 text-red-800',
  };

  const totalTasks = assignedTasks.length;
  const openTasksCount = assignedTasks.filter(t => t.status !== 'Done').length;
  const completedTasksCount = totalTasks - openTasksCount;
  const completionPercentage = totalTasks > 0 ? (completedTasksCount / totalTasks) * 100 : 0;
  
  const atRiskProjectsCount = React.useMemo(() => {
    return myProjects.filter(p => p.status === 'At Risk').length;
  }, [myProjects]);

  const offTrackProjectsCount = React.useMemo(() => {
    return myProjects.filter(p => {
        const isPastDue = isAfter(new Date(), parseISO(p.endDate)) && p.status !== 'Completed';
        return p.status === 'Off Track' || isPastDue;
    }).length;
  }, [myProjects]);

  const criticalIssuesCount = React.useMemo(() => {
    return myProjects.filter(p => (p.tasks || []).some(task => !!task.criticalIssue)).length;
  }, [myProjects]);
  
  const upcomingTasks = assignedTasks
    .filter(t => t.status !== 'Done')
    .slice(0, 3);
    
  const workspaceCards = [
    { title: "CC/EFOD", value: workspaceAnalytics.ccefod, icon: ClipboardCheck, href: "/ccefod", color: "text-blue-500", description: "Compliance Checklist / Electronic Filing of Differences" },
    { title: "PQs", value: workspaceAnalytics.pqs, icon: CircleHelp, href: "/pqs", color: "text-green-500", description: "Protocol Questions Monitoring" },
    { title: "GAP Analysis", value: workspaceAnalytics.gapAnalysis, icon: GitCompareArrows, href: "/gap-analysis", color: "text-yellow-500", description: "GAP Analysis based on State Letters" },
    { title: "Glossary", value: workspaceAnalytics.glossary, icon: BookText, href: "/glossary", color: "text-purple-500", description: "Centralized Translation Analysis" },
  ]
  
  const projectsNearDeadline = React.useMemo(() => {
    return myProjects.filter(p => {
      const daysLeft = differenceInDays(parseISO(p.endDate), new Date());
      return daysLeft >= 0 && daysLeft <= 14 && p.status !== 'Completed';
    }).sort((a,b) => parseISO(a.endDate).getTime() - parseISO(b.endDate).getTime());
  }, [myProjects]);

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
    <TooltipProvider>
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
                            myProjects.map(project => <ProjectCard key={project.id} project={project} allUsers={allUsers} />)
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
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground"><ListTodo className="h-4 w-4" /> Task Completion</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{completionPercentage.toFixed(0)}%</div>
                        <p className="text-xs text-muted-foreground">{openTasksCount} of {totalTasks} tasks open</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="pb-2 h-16">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground"><AlertTriangle className="h-4 w-4 text-yellow-500" /> Projects at Risk</CardTitle>
                    </CardHeader>
                    <CardContent><div className="text-3xl font-bold text-yellow-500">{atRiskProjectsCount}</div></CardContent>
                </Card>
                 <Card>
                    <CardHeader className="pb-2 h-16">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground"><AlertTriangle className="h-4 w-4 text-red-500" /> Projects Off Track</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-500">{offTrackProjectsCount}</div>
                    </CardContent>
                </Card>
                <Card className="col-span-2">
                    <CardHeader className="pb-2 h-16">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground"><AlertTriangle className="h-4 w-4 text-orange-500" /> Critical Issues</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-orange-500">{criticalIssuesCount}</div>
                      <p className="text-xs text-muted-foreground">Proyek dengan masalah kritis yang perlu perhatian segera.</p>
                    </CardContent>
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
                                        <Checkbox 
                                            id={`task-complete-${task.id}`}
                                            className="mt-1"
                                            checked={taskToComplete?.id === task.id}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setTaskToComplete(task);
                                                } else {
                                                    setTaskToComplete(null);
                                                }
                                            }}
                                        />
                                        <div className="flex-1">
                                            <label htmlFor={`task-complete-${task.id}`} className="font-semibold leading-tight cursor-pointer">{task.title}</label>
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
                    <CardTitle className="flex items-center gap-2 text-destructive"><CalendarX className="h-5 w-5"/> Approaching Deadlines</CardTitle>
                    <CardDescription>Projects due in the next 14 days.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {projectsNearDeadline.length > 0 ? (
                        projectsNearDeadline.map(project => {
                            const daysLeft = differenceInDays(parseISO(project.endDate), new Date());
                            return (
                                <Link key={project.id} href={`/projects/${project.id}?type=${project.projectType.toLowerCase().replace(' ', '')}`} className="block hover:bg-muted/50 p-2 rounded-md">
                                    <div className="flex items-center justify-between gap-4">
                                        <p className="font-semibold truncate flex-1">{project.name}</p>
                                        <Badge variant="destructive" className="whitespace-nowrap">{daysLeft} days left</Badge>
                                    </div>
                                </Link>
                            )
                        })
                    ) : (
                         <div className="text-center text-sm text-muted-foreground py-4">
                            <CalendarClock className="mx-auto h-8 w-8 mb-2" />
                            No projects nearing their deadline.
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
                        <Tooltip key={item.title}>
                           <TooltipTrigger asChild>
                                <Link href={item.href}>
                                    <div className="p-3 rounded-lg border bg-background hover:bg-muted/80 hover:shadow-sm transition-all text-center">
                                        <item.icon className={cn("h-8 w-8 mx-auto mb-2", item.color)} />
                                        <p className="font-bold text-lg">{item.value}</p>
                                        <p className="text-xs font-medium text-muted-foreground">{item.title}</p>
                                    </div>
                                </Link>
                           </TooltipTrigger>
                           <TooltipContent>
                               <p>{item.description}</p>
                           </TooltipContent>
                        </Tooltip>
                    ))}
                </CardContent>
             </Card>
        </aside>
      </div>

       <AlertDialog open={!!taskToComplete} onOpenChange={() => setTaskToComplete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Complete Task?</AlertDialogTitle>
            <AlertDialogDescription>
                Are you sure you want to mark the task <span className="font-semibold">"{taskToComplete?.title}"</span> as done?
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingTask}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCompleteTask} disabled={isUpdatingTask}>
                {isUpdatingTask && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm & Complete
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
        </AlertDialog>

    </main>
    </TooltipProvider>
  );
}
