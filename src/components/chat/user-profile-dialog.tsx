
'use client';

import * as React from 'react';
import type { User, Task, Project } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { User as UserIcon, Briefcase, Mail, Calendar, Building, ListTodo, ExternalLink, ChevronDown, FolderKanban } from 'lucide-react';
import { format, parseISO, differenceInDays, startOfToday } from 'date-fns';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';


type AssignedTask = Task & {
  projectId: string;
  projectName: string;
  projectType: 'Rulemaking' | 'Tim Kerja';
};

interface UserProfileDialogProps {
  user: User | null;
  assignedTasks: AssignedTask[];
  projects: Project[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TaskItem = ({ task }: { task: AssignedTask }) => {
    const dueDate = parseISO(task.dueDate);
    const today = startOfToday();
    const daysLeft = differenceInDays(dueDate, today);

    const dueDateColor =
        daysLeft < 0 ? 'text-destructive' :
        daysLeft < 7 ? 'text-yellow-500' :
        'text-muted-foreground';

    return (
        <div className="flex items-start justify-between gap-4 p-3 rounded-md border bg-background/50 hover:bg-muted/50 transition-colors">
            <div className="flex-1">
                <p className="font-semibold text-sm">{task.title}</p>
                <p className="text-xs text-muted-foreground">{task.projectName}</p>
            </div>
            <div className="text-right flex-shrink-0">
                <Badge variant="outline" className={cn("text-xs mb-1", dueDateColor)}>
                    Due: {format(dueDate, 'dd MMM yyyy')}
                </Badge>
                <div className="flex justify-end">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                                <Link href={`/projects/${task.projectId}?type=${task.projectType.toLowerCase().replace(' ', '')}`}>
                                    <ExternalLink className="h-4 w-4" />
                                </Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Go to Project</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </div>
        </div>
    );
};

export function UserProfileDialog({ user, assignedTasks, projects, open, onOpenChange }: UserProfileDialogProps) {
    const [isTasksExpanded, setIsTasksExpanded] = React.useState(false);
    if (!user) return null;

    const isOnline = user.lastOnline ? (new Date().getTime() - new Date(user.lastOnline).getTime()) / (1000 * 60) < 5 : false;

    const openTasks = assignedTasks.filter(t => t.status !== 'Done');
    
    const tasksToShow = isTasksExpanded ? openTasks : openTasks.slice(0, 3);
    
    const rulemakingProjects = projects.filter(p => p.projectType === 'Rulemaking');
    const timKerjaProjects = projects.filter(p => p.projectType === 'Tim Kerja');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader className="text-center items-center pt-8">
                <Avatar className="h-24 w-24 border-4 border-background ring-2 ring-primary shadow-lg" online={isOnline}>
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback className="text-3xl">
                        <UserIcon />
                    </AvatarFallback>
                </Avatar>
                <DialogTitle className="text-2xl pt-2">{user.name}</DialogTitle>
                <DialogDescription>{user.role}</DialogDescription>
            </DialogHeader>
            <TooltipProvider>
                <ScrollArea className="max-h-[60vh] pr-4">
                    <div className="space-y-6 py-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <UserIcon className="h-4 w-4" /> About
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span>{user.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Building className="h-4 w-4 text-muted-foreground" />
                                    <span>{user.department || 'N/A'}</span>
                                </div>
                            </CardContent>
                        </Card>

                         <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <FolderKanban className="h-4 w-4" /> Project Memberships ({projects.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {projects.length > 0 ? (
                                    <>
                                        {rulemakingProjects.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold text-sm mb-2">Rulemaking Projects</h4>
                                                <div className="space-y-2">
                                                {rulemakingProjects.map(p => (
                                                    <Link key={p.id} href={`/projects/${p.id}?type=rulemaking`} className="block p-2 rounded-md bg-muted/50 hover:bg-muted">
                                                        <p className="font-medium text-sm">{p.name}</p>
                                                    </Link>
                                                ))}
                                                </div>
                                            </div>
                                        )}
                                        {timKerjaProjects.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold text-sm mb-2">Tim Kerja Projects</h4>
                                                <div className="space-y-2">
                                                {timKerjaProjects.map(p => (
                                                    <Link key={p.id} href={`/projects/${p.id}?type=timkerja`} className="block p-2 rounded-md bg-muted/50 hover:bg-muted">
                                                        <p className="font-medium text-sm">{p.name}</p>
                                                    </Link>
                                                ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">Not a member of any projects.</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                <ListTodo className="h-4 w-4" /> Assigned Tasks ({openTasks.length} open)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                            {openTasks.length > 0 ? (
                                <>
                                    {tasksToShow.map(task => <TaskItem key={task.id} task={task} />)}
                                    {openTasks.length > 3 && (
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => setIsTasksExpanded(!isTasksExpanded)}
                                        >
                                            {isTasksExpanded ? 'Show Less' : `Show ${openTasks.length - 3} More`}
                                            <ChevronDown className={cn("ml-2 h-4 w-4 transition-transform", isTasksExpanded && "rotate-180")} />
                                        </Button>
                                    )}
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">No open tasks assigned.</p>
                            )}
                            </CardContent>
                        </Card>
                    </div>
                </ScrollArea>
            </TooltipProvider>
        </DialogContent>
        </Dialog>
    );
}
