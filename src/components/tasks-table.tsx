

'use client';

import * as React from 'react';
import type { Task, User, Project } from '@/lib/types';
import { findUserById } from '@/lib/data-utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Trash2,
  Loader2,
  AlertTriangle,
  ClipboardList,
  ChevronRight,
  Network,
  Link as LinkIcon,
  User as UserIcon,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { EditTaskDialog } from './edit-task-dialog';
import { AddTaskDialog } from './add-task-dialog';
import { deleteTask } from '@/lib/actions/project';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import Link from 'next/link';
import { ScrollArea } from './ui/scroll-area';

type TaskRowProps = {
  task: Task;
  level: number;
  teamMembers: User[];
  projectId: string;
  projectType: Project['projectType'];
  onTaskUpdate: (tasks: Task[]) => void;
  onTaskDelete: (taskId: string) => void;
  isDeleting: boolean;
};

const TaskRow = ({ task, level, teamMembers, projectId, projectType, onTaskUpdate, onTaskDelete, isDeleting }: TaskRowProps) => {
    const [isSubtaskDialogOpen, setIsSubtaskDialogOpen] = React.useState(false);
    const [isOpen, setIsOpen] = React.useState(false);
    
    const assignees = (task.assigneeIds || []).map(id => findUserById(id, teamMembers)).filter(Boolean);
    const hasSubtasks = task.subTasks && task.subTasks.length > 0;
    
    const statusStyles: { [key in Task['status']]: string } = {
        'Done': 'border-transparent bg-green-100 text-green-800',
        'In Progress': 'border-transparent bg-blue-100 text-blue-800',
        'To Do': 'border-transparent bg-gray-100 text-gray-800',
        'Blocked': 'border-transparent bg-red-100 text-red-800',
    };

    return (
        <React.Fragment>
            <TableRow className="border-b">
                <TableCell style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }} className="font-medium">
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(!isOpen)} disabled={!hasSubtasks}>
                        {hasSubtasks ? (
                            <ChevronRight className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-90")} />
                        ) : (
                           <span className='w-4 h-4'></span>
                        )}
                    </Button>
                    <span>{task.title}</span>
                </div>
                </TableCell>
                <TableCell>
                    <div className="flex items-center -space-x-2">
                        {assignees.map((assignee) => (
                            assignee && (
                            <Tooltip key={assignee.id}>
                                <TooltipTrigger asChild>
                                <Avatar className="h-6 w-6 border-2 border-background">
                                    <AvatarImage src={assignee.avatarUrl} data-ai-hint="person portrait" />
                                    <AvatarFallback>
                                      <UserIcon className="h-3 w-3" />
                                    </AvatarFallback>
                                </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>{assignee.name}</TooltipContent>
                            </Tooltip>
                            )
                        ))}
                        {assignees.length === 0 && <span className="text-sm text-muted-foreground">Unassigned</span>}
                    </div>
                </TableCell>
                <TableCell>{task.startDate ? format(parseISO(task.startDate), 'PPP') : 'N/A'}</TableCell>
                <TableCell>{task.dueDate ? format(parseISO(task.dueDate), 'PPP') : 'N/A'}</TableCell>
                <TableCell>
                    <Badge variant="outline" className={cn("text-xs font-semibold", statusStyles[task.status])}>
                        {task.status}
                    </Badge>
                </TableCell>
                <TableCell>
                    <div className="flex flex-col gap-1">
                        {(task.attachments || []).map(att => (
                            <Tooltip key={att.id}>
                                <TooltipTrigger asChild>
                                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary hover:underline">
                                        <LinkIcon className="h-3 w-3" />
                                        <span className="truncate">{att.name}</span>
                                    </a>
                                </TooltipTrigger>
                                <TooltipContent><p>{att.url}</p></TooltipContent>
                            </Tooltip>
                        ))}
                    </div>
                </TableCell>
                <TableCell className="text-right flex justify-end items-center gap-1 print:hidden">
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsSubtaskDialogOpen(true)}>
                                <Network className="h-4 w-4"/>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Add Subtask</TooltipContent>
                    </Tooltip>
                    <EditTaskDialog projectId={projectId} projectType={projectType} task={task} teamMembers={teamMembers} onTaskUpdate={onTaskUpdate} />
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onTaskDelete(task.id)} disabled={isDeleting}>
                                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete Task</TooltipContent>
                    </Tooltip>
                </TableCell>
            </TableRow>
            {isOpen && hasSubtasks && task.subTasks.map(subTask => (
                <TaskRow
                    key={subTask.id}
                    task={subTask}
                    level={level + 1}
                    teamMembers={teamMembers}
                    projectId={projectId}
                    projectType={projectType}
                    onTaskUpdate={onTaskUpdate}
                    onTaskDelete={onTaskDelete}
                    isDeleting={isDeleting}
                />
            ))}
            <AddTaskDialog 
                open={isSubtaskDialogOpen}
                onOpenChange={setIsSubtaskDialogOpen}
                projectId={projectId} 
                projectType={projectType}
                teamMembers={teamMembers}
                onTasksChange={onTaskUpdate}
                parentId={task.id}
            />
        </React.Fragment>
    );
};


type TasksTableProps = {
    projectId: string;
    projectType: Project['projectType'];
    tasks: Task[];
    teamMembers: User[];
    onTasksChange: (tasks: Task[]) => void;
};

export function TasksTable({ projectId, projectType, tasks, teamMembers, onTasksChange }: TasksTableProps) {
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [taskToDelete, setTaskToDelete] = React.useState<Task | null>(null);

    const handleDeleteRequest = (taskId: string) => {
        const findTask = (tasks: Task[], id: string): Task | null => {
            for (const task of tasks) {
                if (task.id === id) return task;
                if (task.subTasks) {
                    const found = findTask(task.subTasks, id);
                    if (found) return found;
                }
            }
            return null;
        }
        const task = findTask(tasks, taskId);
        setTaskToDelete(task);
    }
    
    const confirmDeleteTask = async () => {
        if (!taskToDelete) return;
    
        setIsDeleting(true);
        const result = await deleteTask(projectId, taskToDelete.id, projectType);
    
        if (result.success && result.tasks) {
          onTasksChange(result.tasks);
          toast({
            title: "Task Deleted",
            description: `"${taskToDelete.title}" has been removed.`,
          });
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: result.error || "Failed to delete task.",
          });
        }
        setTaskToDelete(null);
        setIsDeleting(false);
      }

    return (
        <TooltipProvider>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <ClipboardList /> Tasks
                    </CardTitle>
                    <AddTaskDialog 
                        projectId={projectId}
                        projectType={projectType}
                        teamMembers={teamMembers}
                        onTasksChange={onTasksChange}
                    />
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="w-full overflow-x-auto">
                        <Table className="min-w-[800px]">
                            <TableHeader>
                                <TableRow>
                                <TableHead className="w-[40%]">Task</TableHead>
                                <TableHead>Assignee</TableHead>
                                <TableHead>Start Date</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Attachments</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tasks.length > 0 ? tasks.map((task) => (
                                    <TaskRow 
                                        key={task.id}
                                        task={task}
                                        level={0}
                                        teamMembers={teamMembers}
                                        projectId={projectId}
                                        projectType={projectType}
                                        onTaskUpdate={onTasksChange}
                                        onTaskDelete={handleDeleteRequest}
                                        isDeleting={isDeleting && taskToDelete?.id === task.id}
                                    />
                                )) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground h-24">No tasks yet.</TableCell>
                                </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            <AlertDialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader className="text-center items-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-2">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the task
                            <span className="font-semibold"> "{taskToDelete?.title}"</span> and all of its subtasks.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteTask} className={buttonVariants({ variant: 'destructive' })}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </TooltipProvider>
    )
}
