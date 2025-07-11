
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  BarChart as BarChartIcon,
  CheckCircle,
  FolderKanban,
  Users,
  ListTodo,
  Frown,
  AlarmClockOff,
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';
import { AddProjectDialog } from './add-project-dialog';

type DashboardPageProps = {
  projects: Project[];
  users: User[];
};

export function DashboardPage({ projects, users }: DashboardPageProps) {
  const totalProjects = projects.length;
  const completedTasks = projects.flatMap(p => p.tasks).filter(t => t.status === 'Done').length;
  const totalTasks = projects.flatMap(p => p.tasks).length;
  const atRiskProjects = projects.filter(p => p.status === 'At Risk').length;
  const offTrackProjects = projects.filter(p => p.status === 'Off Track').length;

  const projectStatusData = useMemo(() => {
    const statusCounts = projects.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {} as Record<Project['status'], number>);

    return [
      { name: 'On Track', count: statusCounts['On Track'] || 0, fill: 'var(--chart-1)' },
      { name: 'At Risk', count: statusCounts['At Risk'] || 0, fill: 'var(--chart-2)' },
      { name: 'Off Track', count: statusCounts['Off Track'] || 0, fill: 'var(--chart-3)' },
      { name: 'Completed', count: statusCounts['Completed'] || 0, fill: 'var(--chart-4)' },
    ];
  }, [projects]);

  const chartConfig = {
    count: { label: 'Projects' },
    'On Track': { label: 'On Track', color: 'hsl(var(--chart-1))' },
    'At Risk': { label: 'At Risk', color: 'hsl(var(--chart-2))' },
    'Off Track': { label: 'Off Track', color: 'hsl(var(--chart-3))' },
    Completed: { label: 'Completed', color: 'hsl(var(--chart-4))' },
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
       <div className="flex items-center justify-between mb-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Tim Kerja Dashboard</h1>
                <p className="text-muted-foreground">An overview of all team-based projects.</p>
            </div>
            <AddProjectDialog allUsers={users} />
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
        <Card className="lg:col-span-2">
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
      </div>

      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Active Projects</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.filter(p => p.status !== 'Completed').map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
      
       <div>
        <h2 className="text-2xl font-bold tracking-tight mt-8 mb-4">Completed Projects</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.filter(p => p.status === 'Completed').map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </main>
  );
}
