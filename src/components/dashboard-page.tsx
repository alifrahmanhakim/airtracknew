
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  AlarmClockOff,
  Frown,
  FolderKanban,
  ListTodo,
  Trash2,
  AlertTriangle,
  Loader2,
  Users,
  Calendar,
  User as UserIcon,
  Clock,
  CheckCircle,
  AlertCircle,
  CalendarClock,
  CalendarX,
  ChevronDown,
  History,
} from 'lucide-react';
import type { Project, User, Task } from '@/lib/types';
import { ProjectCard } from './project-card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip, ComposedChart, Line, Legend } from 'recharts';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AddTimKerjaProjectDialog } from './add-tim-kerja-project-dialog';
import { Button } from './ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { deleteAllTimKerjaProjects, updateTask } from '@/lib/actions/project';
import { collection, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Progress } from './ui/progress';
import { parseISO, getYear, isAfter, differenceInDays, startOfToday, format, max as maxDate, min as minDate } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { cn } from '@/lib/utils';
import { countAllTasks } from '@/lib/data-utils';
import { Separator } from './ui/separator';
import Link from 'next/link';
import { Badge } from './ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';


const getEffectiveStatus = (project: Project): Project['status'] => {
    const { total, completed, hasCritical } = countAllTasks(project.tasks || []);
    const progress = total > 0 ? (completed / total) * 100 : 0;
  
    if (progress === 100 || project.status === 'Completed') {
      return 'Completed';
    }
  
    const today = startOfToday();
    const projectEnd = parseISO(project.endDate);
  
    if (isAfter(today, projectEnd)) {
      return 'Off Track';
    }
  
    if (hasCritical) {
      return 'At Risk';
    }
    
    const projectStart = parseISO(project.startDate);
    const totalDuration = differenceInDays(projectEnd, projectStart);
  
    if (totalDuration > 0) {
      const elapsedDuration = differenceInDays(today, projectStart);
      const timeProgress = (elapsedDuration / totalDuration) * 100;
  
      if (progress < timeProgress - 20) {
        return 'At Risk';
      }
    }
    
    return 'On Track';
};

type AssignedTask = Task & {
  projectName: string;
  projectId: string;
  projectType: Project['projectType'];
};

type WorkloadStatus = 'Overload' | 'Underload' | 'Normal';

type DashboardPageProps = {
  initialProjects: Project[];
  initialUsers: User[];
};


export function DashboardPage({ initialProjects, initialUsers }: DashboardPageProps) {
  const [allProjects, setAllProjects] = useState<Project[]>(initialProjects);
  const [allUsers, setAllUsers] = useState<User[]>(initialUsers);
  const [isLoading, setIsLoading] = useState(false); // No longer loading initially
  const [userId, setUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [taskToComplete, setTaskToComplete] = useState<AssignedTask | null>(null);
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const loggedInUserId = localStorage.getItem('loggedInUserId');
    setUserId(loggedInUserId);

    const user = initialUsers.find(u => u.id === loggedInUserId);
    if(user) setCurrentUser(user);

    // Set up Firestore listeners for real-time updates
    const projectsUnsub = onSnapshot(collection(db, "timKerjaProjects"), (snapshot) => {
        const projectsFromDb: Project[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), projectType: 'Tim Kerja' } as Project));
        setAllProjects(projectsFromDb);
    });
    
    const usersUnsub = onSnapshot(collection(db, "users"), (snapshot) => {
        const usersFromDb: User[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setAllUsers(usersFromDb);
    });

    return () => {
      projectsUnsub();
      usersUnsub();
    };
  }, [initialUsers]);
  
  const handleCompleteTask = async () => {
    if (!taskToComplete) return;

    setIsUpdatingTask(true);
    const updatedTask: Task = {
        ...taskToComplete,
        status: 'Done',
        doneDate: format(new Date(), 'yyyy-MM-dd'),
    };

    // This destructuring is important. We only want to pass properties that exist on the base Task type.
    const { projectId, projectName, projectType, ...baseTask } = updatedTask;

    const result = await updateTask(projectId, baseTask, projectType, userId || '');
    
    if (result.success && result.tasks) {
        // Optimistic update handled by Firestore listener
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


  const yearOptions = useMemo(() => {
    const years = new Set(allProjects.map(p => getYear(parseISO(p.startDate))));
    return ['all', ...Array.from(years).sort((a, b) => b - a)];
  }, [allProjects]);

  const filteredProjects = useMemo(() => {
    if (selectedYear === 'all') {
      return allProjects;
    }
    return allProjects.filter(p => getYear(parseISO(p.startDate)) === parseInt(selectedYear, 10));
  }, [allProjects, selectedYear]);

  const { projectStatusData, teamWorkloadData, stats, offTrackTasks, recentlyAddedProjects } = useMemo(() => {
      const today = startOfToday();
      const statusCounts: Record<Project['status'], number> = {
          'On Track': 0, 'At Risk': 0, 'Off Track': 0, 'Completed': 0,
      };
      
      const taskStatusCounts = { 
          'To Do': 0, 'In Progress': 0, 'Done': 0, 'Blocked': 0, 'Off Track': 0,
          'todoOnTrack': 0, 'todoAtRisk': 0, 'todoOffTrack': 0,
      };

      let totalTasksCount = 0;
      const overdueTasks: AssignedTask[] = [];

      filteredProjects.forEach(project => {
          const effectiveStatus = getEffectiveStatus(project);
          statusCounts[effectiveStatus]++;

          const tasks = project.tasks || [];
          (function countTasksRecursively(tasks: Task[]) {
              tasks.forEach(task => {
                  totalTasksCount++;
                  const dueDate = parseISO(task.dueDate);
                  const isOverdue = isAfter(today, dueDate) && task.status !== 'Done';

                  if (isOverdue) {
                      taskStatusCounts['Off Track']++;
                      overdueTasks.push({ ...task, projectName: project.name, projectId: project.id, projectType: project.projectType });
                  } else {
                      taskStatusCounts[task.status]++;
                  }

                  if (task.status === 'To Do' && !isOverdue) {
                      const daysUntilDue = differenceInDays(dueDate, today);
                      if (daysUntilDue <= 7) {
                          taskStatusCounts.todoAtRisk++;
                      } else {
                          taskStatusCounts.todoOnTrack++;
                      }
                  }
              });
          })(tasks);
      });
      
      const workloadCounts: { [userId: string]: { user: User; openTasks: number; doneTasks: number; workloadScore: number } } = {};
      allUsers.forEach(user => {
          workloadCounts[user.id] = { user, openTasks: 0, doneTasks: 0, workloadScore: 0 };
      });
      
      const getTaskPressure = (task: Task): number => {
          const daysUntilDue = differenceInDays(parseISO(task.dueDate), today);
          if (daysUntilDue < 0) return 5;
          if (daysUntilDue <= 3) return 4;
          if (daysUntilDue <= 7) return 3;
          if (daysUntilDue <= 30) return 2;
          return 1;
      };

      filteredProjects.forEach(p => {
        const tasks = p.tasks || [];
        (function processWorkload(tasks: Task[]) {
            tasks.forEach(task => {
                const pressure = getTaskPressure(task);
                (task.assigneeIds || []).forEach(assigneeId => {
                    if (workloadCounts[assigneeId]) {
                        if (task.status === 'Done') {
                            workloadCounts[assigneeId].doneTasks++;
                        } else {
                            workloadCounts[assigneeId].openTasks++;
                            workloadCounts[assigneeId].workloadScore += pressure;
                        }
                    }
                });
                if (task.subTasks) processWorkload(task.subTasks);
            });
        })(tasks);
      });

      const finalWorkloadData = Object.values(workloadCounts).filter(item => item.user.role !== 'Sub-Directorate Head' || (item.openTasks + item.doneTasks) > 0).map(item => {
          let workloadStatus: WorkloadStatus = 'Normal';
          if (item.workloadScore >= 15) workloadStatus = 'Overload';
          else if (item.workloadScore === 0 && item.openTasks === 0) workloadStatus = 'Underload';
          return { ...item, workloadStatus };
      }).sort((a,b) => b.workloadScore - a.workloadScore);

      const projectStats = {
          totalProjects: filteredProjects.length,
          atRiskProjects: statusCounts['At Risk'],
          offTrackProjects: statusCounts['Off Track'],
          taskStatusCounts,
          totalTasks: totalTasksCount
      };
      
      const chartData = [
          { name: 'On Track', projects: statusCounts['On Track'], tasks: taskStatusCounts['In Progress'], 'To Do': taskStatusCounts.todoOnTrack, fill: 'hsl(var(--chart-1))' },
          { name: 'At Risk', projects: statusCounts['At Risk'], tasks: taskStatusCounts['Blocked'], 'To Do': taskStatusCounts.todoAtRisk, fill: 'hsl(var(--chart-2))' },
          { name: 'Off Track', projects: statusCounts['Off Track'], tasks: taskStatusCounts['Off Track'], 'To Do': taskStatusCounts.todoOffTrack, fill: 'hsl(var(--chart-3))' },
          { name: 'Completed', projects: statusCounts['Completed'], tasks: taskStatusCounts['Done'], 'To Do': undefined, fill: 'hsl(var(--chart-4))' },
      ];
      
       const recentProjects = [...allProjects]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());


      return {
        projectStatusData: chartData,
        teamWorkloadData: finalWorkloadData,
        stats: projectStats,
        offTrackTasks: overdueTasks.sort((a,b) => parseISO(b.dueDate).getTime() - parseISO(a.dueDate).getTime()),
        recentlyAddedProjects: recentProjects,
      };
    }, [filteredProjects, allUsers, allProjects]);
  
  const chartConfig = {
    projects: { label: 'Projects', color: 'hsl(var(--chart-1))' },
    tasks: { label: 'Active/Overdue', color: 'hsl(var(--chart-5))' },
    'To Do': { label: 'To Do', color: 'hsl(var(--destructive))' }
  };
  
  const isAdmin = currentUser?.role === 'Sub-Directorate Head' || currentUser?.email === 'admin@admin2023.com' || currentUser?.email === 'hakimalifrahman@gmail.com' || currentUser?.email === 'rizkywirapratama434@gmail.com';

  const handleDeleteAll = async () => {
    setIsDeleting(true);
    const result = await deleteAllTimKerjaProjects();
    setIsDeleting(false);
    setShowDeleteConfirm(false);

    if (result.success) {
      toast({
        title: 'All Projects Deleted',
        description: `${result.count} Tim Kerja projects have been removed.`,
      });
      // Firestore listener will update the state
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error || 'Failed to delete all projects.',
      });
    }
  };

  const maxWorkloadScore = teamWorkloadData.length > 0 ? Math.max(...teamWorkloadData.map(item => item.workloadScore)) : 0;
  
  const cardHoverClasses = "transition-all duration-300 hover:shadow-lg hover:border-primary group-hover:bg-gradient-to-b group-hover:from-primary/10 dark:group-hover:from-primary/20";


  return (
    <>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
              <div className="p-4 rounded-lg bg-card/80 backdrop-blur-sm">
                  <h1 className="text-3xl font-bold tracking-tight">Tim Kerja Dashboard</h1>
                  <p className="text-muted-foreground">An overview of all team-based projects.</p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                 <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Select a year..." />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map(year => (
                        <SelectItem key={year} value={String(year)}>
                          {year === 'all' ? 'All Years' : year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                {isAdmin && (
                  <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)} disabled={allProjects.length === 0}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete All
                  </Button>
                )}
                <AddTimKerjaProjectDialog allUsers={allUsers} />
              </div>
          </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className={cn(cardHoverClasses)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProjects}</div>
              <p className="text-xs text-muted-foreground">All active and completed projects</p>
            </CardContent>
          </Card>
          <Card className={cn(cardHoverClasses, "flex flex-col")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Task Overview</CardTitle>
                <ListTodo className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-center">
                <div className="text-2xl font-bold">{stats.totalTasks} Total</div>
                 <div className="mt-2 space-y-1">
                    <p className="text-xs text-green-500">
                      {stats.taskStatusCounts['Done']} Completed ({stats.totalTasks > 0 ? ((stats.taskStatusCounts['Done'] / stats.totalTasks) * 100).toFixed(0) : 0}%)
                    </p>
                    <p className="text-xs text-blue-500">
                      {stats.taskStatusCounts['In Progress']} In Progress ({stats.totalTasks > 0 ? ((stats.taskStatusCounts['In Progress'] / stats.totalTasks) * 100).toFixed(0) : 0}%)
                    </p>
                    <p className="text-xs text-gray-500">
                      {stats.taskStatusCounts['To Do']} To Do ({stats.totalTasks > 0 ? ((stats.taskStatusCounts['To Do'] / stats.totalTasks) * 100).toFixed(0) : 0}%)
                    </p>
                     <p className="text-xs text-yellow-500">
                      {stats.taskStatusCounts['Off Track']} Off Track ({stats.totalTasks > 0 ? ((stats.taskStatusCounts['Off Track'] / stats.totalTasks) * 100).toFixed(0) : 0}%)
                    </p>
                    <p className="text-xs text-destructive">
                      {stats.taskStatusCounts['Blocked']} Blocked ({stats.totalTasks > 0 ? ((stats.taskStatusCounts['Blocked'] / stats.totalTasks) * 100).toFixed(0) : 0}%)
                    </p>
                </div>
            </CardContent>
        </Card>
          <Card className={cn(cardHoverClasses)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">At Risk</CardTitle>
              <AlarmClockOff className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{stats.atRiskProjects}</div>
              <p className="text-xs text-muted-foreground">Projects needing attention</p>
            </CardContent>
          </Card>
          <Card className={cn(cardHoverClasses)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Off Track</CardTitle>
              <Frown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{stats.offTrackProjects}</div>
              <p className="text-xs text-muted-foreground">Projects with critical issues</p>
            </CardContent>
          </Card>
        </div>
        
        {offTrackTasks.length > 0 && (
            <Collapsible defaultOpen={offTrackTasks.length <= 3}>
                <Card className="border-yellow-400 bg-yellow-50 dark:bg-yellow-950/80 dark:border-yellow-700/60">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
                                    <CalendarX /> Off Track Tasks ({offTrackTasks.length})
                                </CardTitle>
                                <CardDescription className="text-yellow-700/80 dark:text-yellow-400/80">
                                    These tasks have passed their due date but are not completed.
                                </CardDescription>
                            </div>
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost">
                                    Show all <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </CollapsibleTrigger>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {offTrackTasks.slice(0, 3).map((task, index) => {
                            const daysOverdue = differenceInDays(new Date(), parseISO(task.dueDate));
                            return (
                                <div key={task.id}>
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <span className="font-bold text-yellow-700 dark:text-yellow-300 mt-1">{index + 1}.</span>
                                            <div>
                                                <p className="font-semibold text-sm">{task.title}</p>
                                                <p className="text-xs text-muted-foreground">{task.projectName}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="destructive" className="whitespace-nowrap">
                                                {daysOverdue} day{daysOverdue > 1 ? 's' : ''} overdue
                                            </Badge>
                                            <Button size="sm" variant="outline" onClick={() => setTaskToComplete(task)}>
                                                Done
                                            </Button>
                                        </div>
                                    </div>
                                    {index < offTrackTasks.slice(0, 3).length - 1 && <Separator className="mt-4 bg-yellow-200 dark:bg-yellow-800/50" />}
                                </div>
                            )
                        })}
                    </CardContent>
                    <CollapsibleContent>
                        <CardContent className="space-y-4 pt-0">
                             {offTrackTasks.length > 3 && <Separator className="mb-4 bg-yellow-200 dark:bg-yellow-800/50" />}
                             {offTrackTasks.slice(3).map((task, index) => {
                                const daysOverdue = differenceInDays(new Date(), parseISO(task.dueDate));
                                return (
                                    <div key={task.id}>
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                <span className="font-bold text-yellow-700 dark:text-yellow-300 mt-1">{index + 4}.</span>
                                                <div>
                                                    <p className="font-semibold text-sm">{task.title}</p>
                                                    <p className="text-xs text-muted-foreground">{task.projectName}</p>
                                                </div>
                                            </div>
                                             <div className="flex items-center gap-2">
                                                <Badge variant="destructive" className="whitespace-nowrap">
                                                    {daysOverdue} day{daysOverdue > 1 ? 's' : ''} overdue
                                                </Badge>
                                                <Button size="sm" variant="outline" onClick={() => setTaskToComplete(task)}>
                                                    Done
                                                </Button>
                                            </div>
                                        </div>
                                        {index < offTrackTasks.slice(3).length - 1 && <Separator className="mt-4 bg-yellow-200 dark:bg-yellow-800/50" />}
                                    </div>
                                )
                            })}
                        </CardContent>
                    </CollapsibleContent>
                </Card>
            </Collapsible>
        )}

        {recentlyAddedProjects.length > 0 && (
            <Card className="border-blue-400 bg-blue-50 dark:bg-blue-950/80 dark:border-blue-700/60">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
                        <History /> Recently Added Projects
                    </CardTitle>
                    <CardDescription className="text-blue-700/80 dark:text-blue-400/80">
                        The most recently created projects.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {recentlyAddedProjects.slice(0, 5).map((project, index) => (
                        <div key={project.id}>
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <span className="font-bold text-blue-700 dark:text-blue-300 mt-1">{index + 1}.</span>
                                    <div>
                                        <p className="font-semibold text-sm">{project.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Created {format(new Date(project.createdAt), 'dd MMM yyyy')}
                                        </p>
                                    </div>
                                </div>
                                <Button asChild size="sm" variant="outline">
                                    <Link href={`/projects/${project.id}?type=timkerja`}>
                                        View Project <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                            {index < recentlyAddedProjects.slice(0, 5).length - 1 && <Separator className="mt-4 bg-blue-200 dark:bg-blue-800/50" />}
                        </div>
                    ))}
                </CardContent>
            </Card>
        )}


        <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
          <Card className={cn(cardHoverClasses)}>
             <CardHeader>
              <CardTitle>Project & Task Status Overview</CardTitle>
              <CardDescription>A combined look at project and task health.</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px] w-full pl-2">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <ResponsiveContainer>
                   <ComposedChart data={projectStatusData} margin={{ top: 20, right: 20, bottom: 20, left: -10 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--chart-1))" tickLine={false} axisLine={false} />
                        <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--chart-5))" tickLine={false} axisLine={false} />
                        <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                        <Legend />
                        <Bar dataKey="projects" yAxisId="left" radius={8}>
                             {projectStatusData.map((entry) => (
                                <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                            ))}
                        </Bar>
                        <Line type="monotone" dataKey="tasks" name="Active Tasks" yAxisId="right" strokeWidth={2} stroke="hsl(var(--chart-5))" />
                        <Line type="monotone" dataKey="To Do" yAxisId="right" strokeWidth={2} stroke="hsl(var(--destructive))" connectNulls={false} />
                    </ComposedChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card className={cn(cardHoverClasses)}>
            <CardHeader>
                <CardTitle>Team Workload</CardTitle>
                <CardDescription>Distribution of open tasks among team members based on due date proximity.</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px] overflow-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Member</TableHead>
                            <TableHead className="text-center">Open Tasks</TableHead>
                            <TableHead className="text-center">Done</TableHead>
                            <TableHead className="text-center">Workload Status</TableHead>
                            <TableHead className="w-[120px]">Workload Score</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {teamWorkloadData.map(({ user, openTasks, doneTasks, workloadStatus, workloadScore }) => {
                             const isOnline = user.lastOnline ? (new Date().getTime() - new Date(user.lastOnline).getTime()) / (1000 * 60) < 5 : false;
                            return (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8" online={isOnline}>
                                                <AvatarImage src={user.avatarUrl} alt={user.name} />
                                                <AvatarFallback>
                                                    <UserIcon className="h-4 w-4" />
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-sm">{user.name}</p>
                                                <p className="text-xs text-muted-foreground">{user.role}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-bold text-center">{openTasks}</TableCell>
                                    <TableCell className="font-bold text-green-600 text-center">{doneTasks}</TableCell>
                                    <TableCell className="text-center">
                                         <Badge variant="outline" className={cn({
                                            'border-red-500/50 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/60': workloadStatus === 'Overload',
                                            'border-blue-500/50 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/60': workloadStatus === 'Underload',
                                            'border-green-500/50 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/60': workloadStatus === 'Normal',
                                        })}>{workloadStatus}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Progress value={maxWorkloadScore > 0 ? (workloadScore / maxWorkloadScore) * 100 : 0} className="h-2" />
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">Active Projects</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.filter(p => getEffectiveStatus(p) !== 'Completed').map((project) => (
              <ProjectCard key={project.id} project={project} allUsers={allUsers}/>
            ))}
          </div>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold tracking-tight mt-8 mb-4">Completed Projects</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.filter(p => getEffectiveStatus(p) === 'Completed').map((project) => (
              <ProjectCard key={project.id} project={project} allUsers={allUsers}/>
            ))}
          </div>
        </div>
      </main>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader className="text-center items-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-2">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all
              <span className="font-semibold"> {filteredProjects.length} Tim Kerja projects</span> and all of their associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={handleDeleteAll}
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Yes, delete everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!taskToComplete} onOpenChange={(open) => !open && setTaskToComplete(null)}>
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
    </>
  );
}
