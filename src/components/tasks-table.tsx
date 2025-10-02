

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
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
  Eye,
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
import { Separator } from './ui/separator';

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => {
    if (!value) return null;
    return (
        <div className="grid grid-cols-3 gap-2 py-2 border-b">
            <dt className="font-semibold text-muted-foreground">{label}</dt>
            <dd className="col-span-2 text-sm">{value}</dd>
        </div>
    );
};

const TaskDetailDialog = ({ task, teamMembers, open, onOpenChange }: { task: Task | null; teamMembers: User[]; open: boolean; onOpenChange: (open: boolean) => void; }) => {
    if (!task) return null;

    const assignees = (task.assigneeIds || []).map(id => findUserById(id, teamMembers)).filter(Boolean) as User[];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Task Details</DialogTitle>
                    <DialogDescription>{task.title}</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-4">
                    <dl className="space-y-2">
                        <DetailRow label="Nama Surat" value={task.namaSurat || '-'} />
                        <DetailRow label="Perihal Surat" value={task.perihalSurat || '-'} />
                        <DetailRow label="Tanggal Pelaksanaan" value={task.tanggalPelaksanaan ? format(parseISO(task.tanggalPelaksanaan), 'PPP') : '-'} />
                        <Separator className="my-2" />
                        <DetailRow label="Assignees" value={
                            assignees.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {assignees.map(a => (
                                        <Badge key={a.id} variant="secondary" className="gap-2">
                                            <Avatar className="h-4 w-4">
                                                <AvatarImage src={a.avatarUrl} />
                                                <AvatarFallback><UserIcon className="h-3 w-3" /></AvatarFallback>
                                            </Avatar>
                                            {a.name}
                                        </Badge>
                                    ))}
                                </div>
                            ) : <span className="text-muted-foreground">Unassigned</span>
                        } />
                        <DetailRow label="Start Date" value={task.startDate ? format(parseISO(task.startDate), 'PPP') : 'N/A'} />
                        <DetailRow label="Due Date" value={task.dueDate ? format(parseISO(task.dueDate), 'PPP') : 'N/A'} />
                        <DetailRow label="Status" value={<Badge variant="outline" className={cn({ 'border-transparent bg-green-100 text-green-800': task.status === 'Done', 'border-transparent bg-blue-100 text-blue-800': task.status === 'In Progress', 'border-transparent bg-gray-100 text-gray-800': task.status === 'To Do', 'border-transparent bg-red-100 text-red-800': task.status === 'Blocked' })}>{task.status}</Badge>} />
                         {task.doneDate && <DetailRow label="Completed On" value={format(parseISO(task.doneDate), 'PPP')} />}
                         {task.criticalIssue && <DetailRow label="Critical Issue" value={<span className="text-destructive font-semibold">{task.criticalIssue}</span>} />}
                        <Separator className="my-2" />
                        <DetailRow label="Attachments" value={
                            (task.attachments || []).length > 0 ? (
                                <div className="flex flex-col gap-2">
                                    {(task.attachments || []).map(att => (
                                        <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                                            <LinkIcon className="h-4 w-4" /> {att.name}
                                        </a>
                                    ))}
                                </div>
                            ) : <span className="text-muted-foreground">No attachments</span>
                        } />
                    </dl>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};


type TaskRowProps = {
  task: Task;
  level: number;
  teamMembers: User[];
  projectId: string;
  projectType: Project['projectType'];
  onTaskUpdate: (tasks: Task[]) => void;
  onTaskDelete: (taskId: string) => void;
  onViewTask: (task: Task) => void;
  isDeleting: boolean;
};

const TaskRow = ({ task, level, teamMembers, projectId, projectType, onTaskUpdate, onTaskDelete, onViewTask, isDeleting }: TaskRowProps) => {
    const [isSubtaskDialogOpen, setIsSubtaskDialogOpen] = React.useState(false);
    const [isOpen, setIsOpen] = React.useState(true);
    
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
                    <div className="flex items-center gap-2">
                        <span>{task.title}</span>
                        {task.criticalIssue && (
                             <Tooltip>
                                <TooltipTrigger>
                                    <AlertTriangle className="h-4 w-4 text-destructive" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="font-semibold">Critical Issue:</p>
                                    <p>{task.criticalIssue}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>
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
                <TableCell>{task.dueDate ? format(parseISO(task.dueDate), 'PPP') : 'N/A'}</TableCell>
                <TableCell>
                    <Badge variant="outline" className={cn("text-xs font-semibold", statusStyles[task.status])}>
                        {task.status}
                    </Badge>
                </TableCell>
                <TableCell className="text-right flex justify-end items-center gap-1 print:hidden">
                     <Tooltip>
                        <TooltipTrigger asChild>
                             <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onViewTask(task)}>
                                <Eye className="h-4 w-4"/>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>View Details</TooltipContent>
                    </Tooltip>
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
                    onViewTask={onViewTask}
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
    const [taskToView, setTaskToView] = React.useState<Task | null>(null);


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
                        <Table className="min-w-[900px]">
                            <TableHeader>
                                <TableRow>
                                <TableHead className="w-[40%]">Task</TableHead>
                                <TableHead>Assignee</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Status</TableHead>
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
                                        onViewTask={setTaskToView}
                                        isDeleting={isDeleting && taskToDelete?.id === task.id}
                                    />
                                )) : (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center text-muted-foreground h-24">No tasks yet.</TableCell>
                                </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <TaskDetailDialog 
                task={taskToView}
                teamMembers={teamMembers}
                open={!!taskToView}
                onOpenChange={(open) => !open && setTaskToView(null)}
            />

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
