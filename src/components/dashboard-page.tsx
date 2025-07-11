'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  BarChart,
  CheckCircle,
  FolderKanban,
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
import { Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';

type DashboardPageProps = {
  projects: Project[];
  users: User[];
};

export function DashboardPage({ projects, users }: DashboardPageProps) {
  const totalProjects = projects.length;
  const completedTasks = projects.flatMap(p => p.tasks).filter(t => t.status === 'Done').length;
  const totalTasks = projects.flatMap(p => p.tasks).length;

  const projectStatusData = useMemo(() => {
    const statusCounts = projects.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {} as Record<Project['status'], number>);

    return [
      { name: 'On Track', count: statusCounts['On Track'] || 0, fill: 'var(--color-on-track)' },
      { name: 'At Risk', count: statusCounts['At Risk'] || 0, fill: 'var(--color-at-risk)' },
      { name: 'Off Track', count: statusCounts['Off Track'] || 0, fill: 'var(--color-off-track)' },
      { name: 'Completed', count: statusCounts['Completed'] || 0, fill: 'var(--color-completed)' },
    ];
  }, [projects]);

  const chartConfig = {
    count: { label: 'Projects' },
    'on-track': { label: 'On Track', color: 'hsl(217.2 91.2% 59.8%)' },
    'at-risk': { label: 'At Risk', color: 'hsl(43 74% 66%)' },
    'off-track': { label: 'Off Track', color: 'hsl(0 84.2% 60.2%)' },
    'completed': { label: 'Completed', color: 'hsl(142.1 76.2% 36.3%)' },
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks} / {totalTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks > 0 ? `${Math.round((completedTasks/totalTasks)*100)}%` : 'N/A'}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Project Status Overview</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] w-full">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <ResponsiveContainer>
                <BarChart data={projectStatusData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="count" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">All Projects</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </main>
  );
}
