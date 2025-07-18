
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
} from 'lucide-react';
import type { Project, User } from '@/lib/types';
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

// Note: This component is now dynamically imported by `dashboard-wrapper.tsx`
// with SSR turned off. This is the key to fixing the build error.

export function DashboardPage() {
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const loggedInUserId = localStorage.getItem('loggedInUserId');
    setUserId(loggedInUserId);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      if (userId) {
        try {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            setCurrentUser({ id: userDoc.id, ...userDoc.data() } as User);
          }

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
        } catch (error) {
          console.error("Error fetching data from Firestore:", error);
        }
      }
      setIsLoading(false);
    };

    if (userId) {
        fetchData();
    } else {
        setIsLoading(false);
    }
  }, [userId]);


  const totalProjects = allProjects.length;
  const completedTasks = allProjects.flatMap(p => p.tasks || []).filter(t => t.status === 'Done').length;
  const totalTasks = allProjects.flatMap(p => p.tasks || []).length;
  const atRiskProjects = allProjects.filter(p => p.status === 'At Risk').length;
  const offTrackProjects = allProjects.filter(p => p.status === 'Off Track').length;

  const { projectStatusData, teamWorkloadData } = useMemo(() => {
    const statusCounts = allProjects.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {} as Record<Project['status'], number>);

    const workloadCounts: { [userId: string]: { name: string, tasks: number } } = {};
    allProjects.forEach(project => {
        (project.tasks || []).forEach(task => {
            (task.assigneeIds || []).forEach(userId => {
                if (!workloadCounts[userId]) {
                    const user = allUsers.find(u => u.id === userId);
                    workloadCounts[userId] = { name: user?.name || 'Unknown', tasks: 0 };
                }
                workloadCounts[userId].tasks += 1;
            });
        });
    });

    return {
      projectStatusData: [
        { name: 'On Track', count: statusCounts['On Track'] || 0, fill: 'var(--color-On Track)' },
        { name: 'At Risk', count: statusCounts['At Risk'] || 0, fill: 'var(--color-At Risk)' },
        { name: 'Off Track', count: statusCounts['Off Track'] || 0, fill: 'var(--color-Off Track)' },
        { name: 'Completed', count: statusCounts['Completed'] || 0, fill: 'var(--color-Completed)' },
      ],
      teamWorkloadData: Object.values(workloadCounts).sort((a,b) => b.tasks - a.tasks),
    };
  }, [allProjects, allUsers]);
  
  const chartConfig = {
    count: { label: 'Projects' },
    'On Track': { label: 'On Track', color: 'hsl(var(--chart-1))' },
    'At Risk': { label: 'At Risk', color: 'hsl(var(--chart-2))' },
    'Off Track': { label: 'Off Track', color: 'hsl(var(--chart-3))' },
    'Completed': { label: 'Completed', color: 'hsl(var(--chart-4))' },
    tasks: { label: 'Tasks', color: 'hsl(var(--chart-1))' },
  };
  
  const isAdmin = currentUser?.role === 'Sub-Directorate Head' || currentUser?.email === 'admin@admin2023.com';

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
      // Force a reload to reflect the empty state
      router.refresh();
      setAllProjects([]); // Also clear local state immediately
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error || 'Failed to delete all projects.',
      });
    }
  };

  return (
    <>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between mb-4">
              <div className="p-4 rounded-lg bg-card/80 backdrop-blur-sm">
                  <h1 className="text-3xl font-bold tracking-tight">Tim Kerja Dashboard</h1>
                  <p className="text-muted-foreground">An overview of all team-based projects.</p>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)} disabled={allProjects.length === 0}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete All Projects
                  </Button>
                )}
                <AddTimKerjaProjectDialog allUsers={allUsers} />
              </div>
          </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProjects}</div>
              <p className="text-xs text-muted-foreground">All active and completed projects</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <ListTodo className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTasks}</div>
              <p className="text-xs text-muted-foreground">{completedTasks} tasks completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">At Risk</CardTitle>
              <AlarmClockOff className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{atRiskProjects}</div>
              <p className="text-xs text-muted-foreground">Projects needing attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Off Track</CardTitle>
              <Frown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{offTrackProjects}</div>
              <p className="text-xs text-muted-foreground">Projects with critical issues</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
          <Card>
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
                    <Bar dataKey="count" radius={8} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
                <CardTitle>Team Workload</CardTitle>
                <CardDescription>Distribution of tasks among team members.</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px] w-full pl-2">
                <ChartContainer config={chartConfig} className="h-full w-full">
                    <ResponsiveContainer>
                        <BarChart data={teamWorkloadData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                            <CartesianGrid horizontal={false} />
                            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={10} width={80} />
                            <XAxis dataKey="tasks" type="number" hide />
                            <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                            <Bar dataKey="tasks" radius={5}>
                                {teamWorkloadData.map((_entry, index) => (
                                    <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">Active Projects</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {allProjects.filter(p => p.status !== 'Completed').map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold tracking-tight mt-8 mb-4">Completed Projects</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {allProjects.filter(p => p.status === 'Completed').map((project) => (
              <ProjectCard key={project.id} project={project} />
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
              <span className="font-semibold"> {allProjects.length} Tim Kerja projects</span> and all of their associated data.
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
