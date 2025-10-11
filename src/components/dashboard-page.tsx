

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
} from 'lucide-react';
import type { Project, User, Task } from '@/lib/types';
import { ProjectCard } from './project-card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip } from 'recharts';
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
import { deleteAllTimKerjaProjects } from '@/lib/actions/project';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Progress } from './ui/progress';
import { parseISO, getYear, isAfter, differenceInDays, startOfToday } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { cn } from '@/lib/utils';
import { countAllTasks } from '@/lib/data-utils';
import { Separator } from './ui/separator';

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


export function DashboardPage() {
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const loggedInUserId = localStorage.getItem('loggedInUserId');
    setUserId(loggedInUserId);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const usersQuerySnapshot = await getDocs(collection(db, "users"));
        const usersFromDb: User[] = usersQuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setAllUsers(usersFromDb);

        const projectsQuerySnapshot = await getDocs(collection(db, "timKerjaProjects"));
        const projectsFromDb: Project[] = projectsQuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), projectType: 'Tim Kerja' } as Project));
        
        const projectsWithDefaults = projectsFromDb.map(p => ({
          ...p,
          subProjects: p.subProjects || [],
          documents: p.documents || [],
        }));

        setAllProjects(projectsWithDefaults);

        if (userId) {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            setCurrentUser({ id: userDoc.id, ...userDoc.data() } as User);
          }
        }
      } catch (error) {
        console.error("Error fetching data from Firestore:", error);
      }
      setIsLoading(false);
    };

    fetchData();
  }, [userId]);

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

  const { projectStatusData, teamWorkloadData, stats } = useMemo(() => {
    const statusCounts: Record<Project['status'], number> = {
        'On Track': 0,
        'At Risk': 0,
        'Off Track': 0,
        'Completed': 0,
    };
    
    filteredProjects.forEach(project => {
        const effectiveStatus = getEffectiveStatus(project);
        statusCounts[effectiveStatus]++;
    });

    const workloadCounts: { [userId: string]: { user: User, tasks: number } } = {};
    
    allUsers.forEach(user => {
        workloadCounts[user.id] = { user, tasks: 0 };
    });

    const allTasks = filteredProjects.flatMap(p => p.tasks || []);

    const taskStatusCounts = {
        'To Do': 0,
        'In Progress': 0,
        'Done': 0,
        'Blocked': 0
    };
    
    let offTrackTasksCount = 0;
    const today = startOfToday();

    const countTasksRecursively = (tasks: Task[]) => {
        tasks.forEach(task => {
            taskStatusCounts[task.status]++;
            if(workloadCounts[task.assigneeIds[0]]) {
                workloadCounts[task.assigneeIds[0]].tasks += 1;
            }
            if (task.status !== 'Done' && isAfter(today, parseISO(task.dueDate))) {
                offTrackTasksCount++;
            }
            if (task.subTasks && task.subTasks.length > 0) {
                countTasksRecursively(task.subTasks);
            }
        });
    }

    countTasksRecursively(allTasks);

    const projectStats = {
        totalProjects: filteredProjects.length,
        atRiskProjects: statusCounts['At Risk'],
        offTrackProjects: statusCounts['Off Track'],
        taskStatusCounts,
        offTrackTasks: offTrackTasksCount,
    };

    return {
      projectStatusData: [
        { name: 'On Track', count: statusCounts['On Track'] || 0, fill: 'hsl(var(--chart-1))' },
        { name: 'At Risk', count: statusCounts['At Risk'] || 0, fill: 'hsl(var(--chart-2))' },
        { name: 'Off Track', count: statusCounts['Off Track'] || 0, fill: 'hsl(var(--chart-3))' },
        { name: 'Completed', count: statusCounts['Completed'] || 0, fill: 'hsl(var(--chart-4))' },
      ],
      teamWorkloadData: Object.values(workloadCounts).filter(item => item.tasks > 0).sort((a,b) => b.tasks - a.tasks),
      stats: projectStats,
    };
  }, [filteredProjects, allUsers]);
  
  const chartConfig = {
    count: { label: 'Projects' },
    'On Track': { label: 'On Track', color: 'hsl(var(--chart-1))' },
    'At Risk': { label: 'At Risk', color: 'hsl(var(--chart-2))' },
    'Off Track': { label: 'Off Track', color: 'hsl(var(--chart-3))' },
    'Completed': { label: 'Completed', color: 'hsl(var(--chart-4))' },
    tasks: { label: 'Tasks', color: 'hsl(var(--chart-1))' },
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
      setAllProjects([]);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error || 'Failed to delete all projects.',
      });
    }
  };

  const maxTasks = teamWorkloadData.length > 0 ? Math.max(...teamWorkloadData.map(item => item.tasks)) : 0;
  
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
                <div className="text-2xl font-bold">{stats.taskStatusCounts['To Do'] + stats.taskStatusCounts['In Progress'] + stats.taskStatusCounts['Done'] + stats.taskStatusCounts['Blocked']} Total</div>
                <div className="mt-2 space-y-1">
                    <p className="text-xs text-green-500">{stats.taskStatusCounts['Done']} Completed</p>
                    <p className="text-xs text-blue-500">{stats.taskStatusCounts['In Progress']} In Progress</p>
                    <p className="text-xs text-gray-500">{stats.taskStatusCounts['To Do']} To Do</p>
                    <p className="text-xs text-red-500">{stats.offTrackTasks} Off Track</p>
                    <p className="text-xs text-destructive">{stats.taskStatusCounts['Blocked']} Blocked</p>
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

        <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
          <Card className={cn(cardHoverClasses)}>
            <CardHeader>
              <CardTitle>Project Status Overview</CardTitle>
              <CardDescription>A look at the health of all projects in the portfolio.</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px] w-full pl-2">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <ResponsiveContainer>
                  <BarChart data={projectStatusData} margin={{ top: 20, right: 20, bottom: 20, left: -10 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                    <ChartTooltip 
                      cursor={false}
                      content={<ChartTooltipContent indicator="dot" />} 
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="count" radius={8}>
                        {projectStatusData.map((entry) => (
                            <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card className={cn(cardHoverClasses)}>
            <CardHeader>
                <CardTitle>Team Workload</CardTitle>
                <CardDescription>Distribution of tasks among team members.</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px] overflow-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Member</TableHead>
                            <TableHead>Tasks</TableHead>
                            <TableHead className="w-[120px]">Workload</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {teamWorkloadData.map(({ user, tasks }) => {
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
                                    <TableCell className="text-center font-bold">{tasks}</TableCell>
                                    <TableCell>
                                        <Progress value={maxTasks > 0 ? (tasks / maxTasks) * 100 : 0} className="h-2" />
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
    </>
  );
}
