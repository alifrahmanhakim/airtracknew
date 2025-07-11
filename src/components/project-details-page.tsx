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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  FileText,
  FileSpreadsheet,
  FileImage,
  FileQuestion,
  File,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

type ProjectDetailsPageProps = {
  project: Project;
  users: User[];
};

export function ProjectDetailsPage({ project, users }: ProjectDetailsPageProps) {
  const [tasks, setTasks] = useState<Task[]>(project.tasks);

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
  }

  const statusStyles: { [key in Task['status']]: string } = {
    'Done': 'border-transparent bg-green-500 text-white',
    'In Progress': 'border-transparent bg-blue-500 text-white',
    'To Do': 'border-transparent bg-gray-400 text-white',
    'Blocked': 'border-transparent bg-red-500 text-white',
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">{project.name}</CardTitle>
          <CardDescription className="text-lg">{project.description}</CardDescription>
          <div className="flex gap-4 text-sm text-muted-foreground pt-2">
            <span>Start: {format(parseISO(project.startDate), 'PPP')}</span>
            <span>Deadline: {format(parseISO(project.endDate), 'PPP')}</span>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="tasks">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>
            <TabsContent value="tasks" className="mt-4">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => {
                      const assignee = findUserById(task.assigneeId);
                      const isCompleted = task.status === 'Done';
                      return (
                        <TableRow key={task.id} className={cn(isCompleted && 'bg-gray-50/50')}>
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
              </Card>
            </TabsContent>
            <TabsContent value="documents" className="mt-4">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[70px]">Type</TableHead>
                      <TableHead>Document Name</TableHead>
                      <TableHead>Upload Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {project.documents.map((doc) => (
                      <TableRow key={doc.id}>
                          <TableCell>{getDocumentIcon(doc.type)}</TableCell>
                          <TableCell className="font-medium">{doc.name}</TableCell>
                          <TableCell>{format(parseISO(doc.uploadDate), 'PPP')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  );
}
