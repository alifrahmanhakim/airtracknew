
'use client';

import { useState } from 'react';
import type { Project, Task, User } from '@/lib/types';
import { findUserById } from '@/lib/data';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  FileText,
  FileSpreadsheet,
  FileImage,
  FileQuestion,
  File,
  Users,
  Calendar,
  ClipboardList,
  Upload,
  Paperclip,
  Folder,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Progress } from './ui/progress';

type ProjectDetailsPageProps = {
  project: Project;
  users: User[];
};

export function ProjectDetailsPage({ project: initialProject, users }: ProjectDetailsPageProps) {
  const [project, setProject] = useState<Project>(initialProject);
  const [tasks, setTasks] = useState<Task[]>(initialProject.tasks);

  const handleTaskCompletionChange = (taskId: string, completed: boolean) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId
          ? { ...task, status: completed ? 'Done' : 'In Progress' }
          : task
      )
    );
  };

  const getDocumentIcon = (type: Project['documents'][0]['type']) => {
    switch (type) {
      case 'PDF':
        return <FileText className="h-6 w-6 text-red-600" />;
      case 'Word':
        return <File className="h-6 w-6 text-blue-600" />;
      case 'Excel':
        return <FileSpreadsheet className="h-6 w-6 text-green-600" />;
      case 'Image':
        return <FileImage className="h-6 w-6 text-purple-600" />;
      default:
        return <FileQuestion className="h-6 w-6 text-gray-500" />;
    }
  };

  const statusStyles: { [key in Task['status']]: string } = {
    'Done': 'border-transparent bg-green-500 text-white',
    'In Progress': 'border-transparent bg-blue-500 text-white',
    'To Do': 'border-transparent bg-gray-400 text-white',
    'Blocked': 'border-transparent bg-red-500 text-white',
  };

  const projectManager = findUserById(project.tasks[0]?.assigneeId || users[0].id);
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === 'Done').length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        <Button>Edit Project</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList /> Tahapan Kegiatan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Tugas</TableHead>
                    <TableHead>Penanggung Jawab</TableHead>
                    <TableHead>Batas Waktu</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => {
                    const assignee = findUserById(task.assigneeId);
                    const isCompleted = task.status === 'Done';
                    return (
                      <TableRow key={task.id} className={cn(isCompleted && 'bg-gray-50/50 dark:bg-gray-900/50')}>
                        <TableCell>
                          <Checkbox
                            checked={isCompleted}
                            onCheckedChange={(checked) =>
                              handleTaskCompletionChange(task.id, !!checked)
                            }
                          />
                        </TableCell>
                        <TableCell className={cn("font-medium", isCompleted && 'line-through text-muted-foreground')}>
                          {task.title}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={assignee?.avatarUrl} data-ai-hint="person portrait" />
                              <AvatarFallback>
                                {assignee?.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{assignee?.name || 'Unassigned'}</span>
                          </div>
                        </TableCell>
                        <TableCell>{format(parseISO(task.dueDate), 'PPP')}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className={cn("text-xs font-semibold", statusStyles[task.status])}>
                            {task.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
             <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Paperclip /> Dokumen Kegiatan
                </CardTitle>
             </CardHeader>
             <CardContent>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {project.documents.map((doc) => (
                          <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                            {getDocumentIcon(doc.type)}
                            <div className="flex-1">
                                <p className="font-medium truncate">{doc.name}</p>
                                <p className="text-xs text-muted-foreground">Uploaded: {format(parseISO(doc.uploadDate), 'PPP')}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                    <div className="mt-4 flex items-center justify-center w-full">
                        <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Klik untuk unggah</span> atau seret dan lepas</p>
                                <p className="text-xs text-muted-foreground">PDF, DOCX, XLSX, PNG, JPG</p>
                            </div>
                            <input id="file-upload" type="file" className="hidden" />
                        </label>
                    </div>
                </div>
             </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Folder /> Sub-Proyek
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Fitur untuk menambah dan mengelola sub-proyek akan tersedia di sini.</p>
                {/* Placeholder for sub-projects list */}
            </CardContent>
          </Card>

        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Proyek</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                      <span className="font-medium">Progress</span>
                      <span className="text-muted-foreground">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
              </div>
               <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline" className={cn("text-xs font-semibold", {
                    'border-transparent bg-blue-500 text-white': project.status === 'On Track',
                    'border-transparent bg-yellow-500 text-white': project.status === 'At Risk',
                    'border-transparent bg-red-500 text-white': project.status === 'Off Track',
                    'border-transparent bg-green-500 text-white': project.status === 'Completed',
                })}>{project.status}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Manajer Proyek</span>
                <span className="font-medium">{projectManager?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Mulai</span>
                <span className="font-medium">{format(parseISO(project.startDate), 'PPP')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Selesai</span>
                <span className="font-medium">{format(parseISO(project.endDate), 'PPP')}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users /> Tim yang Terlibat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {users.slice(0, 5).map(user => (
                  <div key={user.id} className="flex items-center gap-4">
                      <Avatar>
                          <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="person portrait" />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.role}</p>
                      </div>
                  </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

