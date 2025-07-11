
'use client';

import { useState } from 'react';
import type { Project, Task, User, SubProject } from '@/lib/types';
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
  UploadCloud,
  Paperclip,
  Folder,
  Pencil,
  FileUp,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Progress } from './ui/progress';
import { EditProjectDialog } from './edit-project-dialog';
import { AddTaskDialog } from './add-task-dialog';
import { AddSubProjectDialog } from './add-subproject-dialog';
import { EditTaskDialog } from './edit-task-dialog';
import { EditSubProjectDialog } from './edit-subproject-dialog';
import { useToast } from '@/hooks/use-toast';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"

type ProjectDetailsPageProps = {
  project: Project;
  users: User[];
};

export function ProjectDetailsPage({ project: initialProject, users }: ProjectDetailsPageProps) {
  const [project, setProject] = useState<Project>(initialProject);
  const [tasks, setTasks] = useState<Task[]>(initialProject.tasks);
  const [subProjects, setSubProjects] = useState<SubProject[]>(initialProject.subProjects || []);
  const [documents, setDocuments] = useState<Project['documents']>(initialProject.documents);
  const { toast } = useToast();

  const handleProjectUpdate = (updatedProject: Project) => {
    setProject(updatedProject);
  };

  const handleTaskAdd = (newTask: Task) => {
    setTasks([...tasks, newTask]);
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(tasks.map(task => task.id === updatedTask.id ? updatedTask : task));
  }

  const handleSubProjectAdd = (newSubProject: SubProject) => {
    setSubProjects([...subProjects, newSubProject]);
  }

  const handleSubProjectUpdate = (updatedSubProject: SubProject) => {
    setSubProjects(subProjects.map(sub => sub.id === updatedSubProject.id ? updatedSubProject : sub));
  }

  const handleFileUpload = (source: 'Computer' | 'Google Drive' | 'OneDrive') => {
    const newDocument = {
        id: `doc-${Date.now()}`,
        name: `Document from ${source}.pdf`,
        type: 'PDF' as const,
        uploadDate: new Date().toISOString(),
        url: '#',
    };
    setDocuments([...documents, newDocument]);
    toast({
        title: "Upload Successful",
        description: `Document from ${source} has been added (simulation).`,
    });
  }

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
  
  const subProjectStatusStyles: { [key in SubProject['status']]: string } = {
    'On Track': 'border-transparent bg-blue-500 text-white',
    'At Risk': 'border-transparent bg-yellow-500 text-white',
    'Off Track': 'border-transparent bg-red-500 text-white',
    'Completed': 'border-transparent bg-green-500 text-white',
  }

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
        <EditProjectDialog project={project} onProjectUpdate={handleProjectUpdate} allUsers={users} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ClipboardList /> Tasks
              </CardTitle>
              <AddTaskDialog onTaskAdd={handleTaskAdd} teamMembers={project.team} />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.length > 0 ? tasks.map((task) => {
                    const assignee = findUserById(task.assigneeId);
                    return (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">
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
                        <TableCell>
                          <Badge variant="outline" className={cn("text-xs font-semibold", statusStyles[task.status])}>
                            {task.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <EditTaskDialog task={task} teamMembers={project.team} onTaskUpdate={handleTaskUpdate} />
                        </TableCell>
                      </TableRow>
                    );
                  }) : (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">No tasks yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
             <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <Paperclip /> Project Documents
                </CardTitle>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button>
                            <FileUp className="mr-2 h-4 w-4" /> Upload Document
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleFileUpload('Computer')}>
                            <UploadCloud className="mr-2 h-4 w-4" />
                            <span>From Computer</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleFileUpload('Google Drive')}>
                            <svg className="mr-2 h-4 w-4" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Google Drive</title><path d="M19.14 7.5L12 18.27l-7.14-10.77h14.28zM6.18 6l5.82-3.87L17.82 6H6.18zM3.86 8.53L1.53 12.4l5.82 3.87.79-1.2-4.28-2.54zM20.14 8.53l-2.62 3.96-4.28 2.54.79 1.2 5.82-3.87z"/></svg>
                            <span>From Google Drive</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleFileUpload('OneDrive')}>
                             <svg className="mr-2 h-4 w-4" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Microsoft OneDrive</title><path d="M4.464 14.802c-2.005-.73-3.06-2.204-3.06-3.805 0-2.35 2.05-3.957 4.573-3.957 1.18 0 2.12.33 2.872.937l-1.89 1.803c-.34-.311-.699-.48-1.077-.48-.96 0-1.638.646-1.638 1.62 0 .937.525 1.48 1.481 1.83l2.844 1.02c2.478.885 3.515 2.08 3.515 3.929 0 2.512-1.92 4.29-4.803 4.29-1.574 0-2.91-.553-3.77-1.39l1.83-1.86c.466.45 1.08.72 1.77.72 1.11 0 1.83-.67 1.83-1.742.001-.937-.53-1.54-1.638-1.944zM23.616 9.155c-.24-.22-2.13-1.98-2.13-1.98s-3.4-.3-3.64-.33c-.238-.03-2.122-1.98-2.122-1.98s-.24.21-.3.3l-1.95 2.1c-.06.09.21.36.21.36s2.06 1.9 2.12 1.98c.06.08 3.63.3 3.63.3s2.13 1.98 2.13 1.98.3-.21.36-.3l1.95-2.1c.06-.09-.21-.36-.21-.36zm-6.21 4.23s-2.06-1.9-2.12-1.98c-.06-.08-3.63-.3-3.63-.3s-2.13-1.98-2.13-1.98-.3.21-.36.3l-1.95 2.1s.21.27.21.36 2.06 1.9 2.12 1.98c.06.08 3.63.3 3.63.3s2.13 1.98 2.13 1.98.3-.21.36-.3l1.95-2.1s-.21-.27-.21-.36z"/></svg>
                            <span>From OneDrive</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
             </CardHeader>
             <CardContent>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {documents.map((doc) => (
                          <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                            {getDocumentIcon(doc.type)}
                            <div className="flex-1">
                                <p className="font-medium truncate">{doc.name}</p>
                                <p className="text-xs text-muted-foreground">Uploaded: {format(parseISO(doc.uploadDate), 'PPP')}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                </div>
             </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <Folder /> Sub-Projects
                </CardTitle>
                <AddSubProjectDialog onSubProjectAdd={handleSubProjectAdd} />
            </CardHeader>
            <CardContent>
              {subProjects.length > 0 ? (
                <div className="space-y-4">
                  {subProjects.map(sub => (
                    <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-semibold">{sub.name}</p>
                        <p className="text-sm text-muted-foreground">{sub.description}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className={cn("text-xs font-semibold", subProjectStatusStyles[sub.status])}>
                            {sub.status}
                        </Badge>
                        <EditSubProjectDialog subProject={sub} onSubProjectUpdate={handleSubProjectUpdate} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No sub-projects yet.</p>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Summary</CardTitle>
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
                <span className="text-muted-foreground">Project Manager</span>
                <span className="font-medium">{projectManager?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Start</span>
                <span className="font-medium">{format(parseISO(project.startDate), 'PPP')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">End</span>
                <span className="font-medium">{format(parseISO(project.endDate), 'PPP')}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users /> Team Involved
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.team.map(user => (
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
