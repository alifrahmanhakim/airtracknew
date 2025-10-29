
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
import { format, parseISO, differenceInDays, isAfter, isToday, isBefore, startOfDay } from 'date-fns';
import { Folder, AlertTriangle, ListTodo, FolderKanban, CalendarClock, Bell, ClipboardCheck, CircleHelp, GitCompareArrows, BookText, ArrowRight, Loader2, CalendarX, CheckSquare, XSquare, Clock, ExternalLink, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
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
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

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

type MyDashboardPageProps = {
    initialProjects: Project[];
    initialUsers: User[];
}

export function MyDashboardPageComponent({ initialProjects, initialUsers }: MyDashboardPageProps) {
  const [assignedTasks, setAssignedTasks] = React.useState<AssignedTask[]>([]);
  const [myProjects, setMyProjects] = React.useState<Project[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [taskToComplete, setTaskToComplete] = React.useState<AssignedTask | null>(null);
  const [isUpdatingTask, setIsUpdatingTask] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    const userId = localStorage.getItem('loggedInUserId');
    if (!userId) {
      setIsLoading(false);
      // Handle not logged in case, maybe redirect
      return;
    }

    const user = initialUsers.find(u => u.id === userId);
    if(user) setCurrentUser(user);

    const tasksForUser: AssignedTask[] = [];
    const projectsForUser: Project[] = [];

    initialProjects.forEach(project => {
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
    setIsLoading(false);

  }, [initialProjects, initialUsers]); 

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
    const userId = localStorage.getItem('loggedInUserId');
    const result = await updateTask(projectId, baseTask, projectType, userId || '');
    
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

  const todaysFocusStats = React.useMemo(() => {
      const today = startOfDay(new Date());
      const tasksDueToday = assignedTasks.filter(t => t.status !== 'Done' && isToday(parseISO(t.dueDate)));
      const overdueTasks = assignedTasks.filter(t => t.status !== 'Done' && isBefore(parseISO(t.dueDate), today));
      const criticalProjects = myProjects.filter(p => p.status !== 'Completed' && (p.tasks || []).some(t => t.criticalIssue));
      return { tasksDueToday, overdueTasks, criticalProjects };
  }, [assignedTasks, myProjects]);
  
  const upcomingTasks = assignedTasks
    .filter(t => t.status !== 'Done')
    .slice(0, 3);
    
  
  const projectsNearDeadline = React.useMemo(() => {
    return myProjects.filter(p => {
      const daysLeft = differenceInDays(parseISO(p.endDate), new Date());
      return daysLeft >= 0 && p.status !== 'Completed';
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
    <main className="p-4 md:p-8 space-y-8">
      <div 
        className="relative p-6 rounded-xl text-white overflow-hidden"
        style={{
            backgroundImage: "url('https://ik.imagekit.io/avmxsiusm/lspyop.webp')",
            backgroundSize: '50%',
            backgroundPosition: 'right 20%',
            backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10">
            <h1 className="text-3xl font-bold">My Dashboard</h1>
            <p className="text-white/80">
            Welcome back, {currentUser?.name || 'User'}. Here is your personal overview.
            </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-primary/20 via-background to-background">
            <CardHeader>
                <CardTitle>Fokus Hari Ini</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Popover>
                    <PopoverTrigger asChild>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 cursor-pointer hover:bg-muted">
                            <div className='flex items-center gap-3'>
                                <CheckSquare className="h-6 w-6 text-blue-500" />
                                <p className='font-semibold'>Tugas Jatuh Tempo Hari Ini</p>
                            </div>
                            <p className="text-2xl font-bold text-blue-500"><AnimatedCounter endValue={todaysFocusStats.tasksDueToday.length} /></p>
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                        <div className="font-bold mb-2">Tugas Jatuh Tempo Hari Ini</div>
                        {todaysFocusStats.tasksDueToday.length > 0 ? (
                            <ScrollArea className="max-h-60">
                            <div className="space-y-2">
                                {todaysFocusStats.tasksDueToday.map(task => (
                                    <div key={task.id} className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground flex justify-between items-center">
                                          <div>
                                            <p className="font-semibold text-sm">{task.title}</p>
                                            <p className="text-xs text-muted-foreground">{task.projectName}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            </ScrollArea>
                        ) : <p className="text-sm text-muted-foreground">Tidak ada tugas yang jatuh tempo hari ini.</p>}
                    </PopoverContent>
                </Popover>

                <Popover>
                    <PopoverTrigger asChild>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 cursor-pointer hover:bg-muted">
                            <div className='flex items-center gap-3'>
                                <XSquare className="h-6 w-6 text-yellow-500" />
                                <p className='font-semibold'>Tugas Terlambat</p>
                            </div>
                            <p className="text-2xl font-bold text-yellow-500"><AnimatedCounter endValue={todaysFocusStats.overdueTasks.length} /></p>
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                        <div className="font-bold mb-2">Tugas Terlambat</div>
                        {todaysFocusStats.overdueTasks.length > 0 ? (
                            <ScrollArea className="max-h-60">
                            <div className="space-y-2">
                                {todaysFocusStats.overdueTasks.map(task => {
                                    const daysOverdue = differenceInDays(new Date(), parseISO(task.dueDate));
                                    return (
                                        <div key={task.id} className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold text-sm">{task.title}</p>
                                                <p className="text-xs text-muted-foreground">{task.projectName}</p>
                                            </div>
                                            <div className="text-right">
                                                <Badge variant="destructive" className="text-xs">{daysOverdue}d overdue</Badge>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                            </ScrollArea>
                        ) : <p className="text-sm text-muted-foreground">Tidak ada tugas yang terlambat.</p>}
                    </PopoverContent>
                </Popover>

                <Popover>
                    <PopoverTrigger asChild>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 cursor-pointer hover:bg-muted">
                            <div className='flex items-center gap-3'>
                                <AlertTriangle className="h-6 w-6 text-red-500" />
                                <p className='font-semibold'>Proyek Kritis</p>
                            </div>
                            <p className="text-2xl font-bold text-red-500"><AnimatedCounter endValue={todaysFocusStats.criticalProjects.length} /></p>
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                        <div className="font-bold mb-2">Proyek Kritis</div>
                          {todaysFocusStats.criticalProjects.length > 0 ? (
                            <ScrollArea className="max-h-60">
                            <div className="space-y-2">
                                {todaysFocusStats.criticalProjects.map(project => (
                                    <div key={project.id} className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground flex justify-between items-center">
                                        <p className="font-semibold text-sm">{project.name}</p>
                                    </div>
                                ))}
                            </div>
                            </ScrollArea>
                        ) : <p className="text-sm text-muted-foreground">Tidak ada proyek dengan isu kritis.</p>}
                    </PopoverContent>
                </Popover>
            </CardContent>
        </Card>
        <Card className="border-primary">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary"><Bell className="h-5 w-5"/> Upcoming Tasks</CardTitle>
                <CardDescription>Your next 3 deadlines.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {upcomingTasks.length > 0 ? (
                    upcomingTasks.map((task, index) => {
                          const dueDate = parseISO(task.dueDate);
                          const daysLeft = differenceInDays(dueDate, startOfDay(new Date()));
                          const dueDateColor = daysLeft < 3 ? 'text-red-500' : daysLeft < 7 ? 'text-yellow-600' : 'text-muted-foreground';
                          
                          const getRelativeDateText = () => {
                            if (isToday(dueDate)) return 'Today';
                            if (daysLeft < 0) return `${Math.abs(daysLeft)}d overdue`;
                            return `${daysLeft}d left`;
                          };

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
                                          <p className={cn("text-sm font-bold", dueDateColor)}>{format(dueDate, 'dd MMM')}</p>
                                          <p className={cn("text-xs", dueDateColor)}>
                                            {getRelativeDateText()}
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
        <Card className="h-full border-red-500/50 bg-red-50 dark:bg-red-900/20 flex flex-col">
            <CardHeader>
                <CardTitle className='flex items-center gap-2 text-base text-red-800 dark:text-red-300'>
                    <CalendarX />
                    Off Track Projects ({offTrackProjectsCount})
                </CardTitle>
                <CardDescription className='text-red-700/80 dark:text-red-400/80'>Projects that have passed their deadline.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
            {offTrackProjectsCount > 0 ? (
                <div className="space-y-3">
                    {myProjects.filter(p => (isAfter(new Date(), parseISO(p.endDate)) && p.status !== 'Completed') || p.status === 'Off Track').map(project => {
                        const daysOverdue = differenceInDays(new Date(), parseISO(project.endDate));
                        return (
                            <Link key={project.id} href={`/projects/${project.id}?type=${project.projectType.toLowerCase().replace(' ', '')}`} className="block hover:bg-red-100/50 dark:hover:bg-red-900/30 p-2 rounded-md">
                                <div className="flex items-center justify-between gap-4">
                                    <p className="font-semibold break-words flex-1 text-sm">{project.name}</p>
                                    {daysOverdue > 0 && <Badge variant="destructive" className="whitespace-nowrap">{daysOverdue} days overdue</Badge>}
                                </div>
                            </Link>
                        )
                    })}
                </div>
            ) : (
                    <div className="text-center text-sm text-red-700/80 dark:text-red-400/80 py-4 h-full flex flex-col justify-center items-center">
                        <CheckCircle className="mx-auto h-8 w-8 mb-2" />
                        No projects are off track. Great job!
                    </div>
            )}
            </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3">
            <Tabs defaultValue="projects" className="w-full">
            <TabsList className="mb-4">
            <TabsTrigger value="projects">My Projects ({myProjects.length})</TabsTrigger>
            <TabsTrigger value="tasks">My Tasks ({assignedTasks.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="projects">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {myProjects.length > 0 ? (
                        myProjects.map(project => <ProjectCard key={project.id} project={project} allUsers={initialUsers} />)
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
            </Tabs>
        </div>
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

    