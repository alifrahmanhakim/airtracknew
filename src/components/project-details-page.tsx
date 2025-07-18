
'use client';

import * as React from 'react';
import { useState } from 'react';
import type { Project, Task, User, SubProject, Document as ProjectDocument, GapAnalysisRecord } from '@/lib/types';
import { rulemakingTaskOptions } from '@/lib/data';
import { findUserById } from '@/lib/data-utils';
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
  FileText,
  FileSpreadsheet,
  FileImage,
  FileQuestion,
  File,
  Users,
  Calendar,
  ClipboardList,
  Paperclip,
  Folder,
  Link as LinkIcon,
  Trash2,
  Loader2,
  GanttChartSquare,
  Info,
  ArrowRight,
  CheckCircle,
  Flag,
  AlertTriangle,
  Pencil,
  GitCompareArrows,
  Eye,
  Printer,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Progress } from './ui/progress';
import { EditProjectDialog } from './edit-project-dialog';
import { AddTaskDialog } from './add-task-dialog';
import { AddSubProjectDialog } from './add-subproject-dialog';
import { EditTaskDialog } from './edit-task-dialog';
import { EditSubProjectDialog } from './edit-subproject-dialog';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AddDocumentLinkDialog } from './add-document-link-dialog';
import { deleteDocument, deleteTask, deleteProject } from '@/lib/actions/project';
import { deleteGapAnalysisRecord } from '@/lib/actions/gap-analysis';
import { useToast } from '@/hooks/use-toast';
import { ProjectTimeline } from './project-timeline';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { ChecklistCard } from './checklist-card';
import { GapAnalysisRecordDetailDialog } from './gap-analysis-record-detail-dialog';
import { RulemakingAnalytics } from './rulemaking-analytics';
import { EditGapAnalysisRecordDialog } from './edit-gap-analysis-record-dialog';
import { ScrollArea } from './ui/scroll-area';

function AssociatedGapAnalysisCard({ 
    records, 
    onDelete,
    onUpdate
}: { 
    records: GapAnalysisRecord[],
    onDelete: (record: GapAnalysisRecord) => void,
    onUpdate: (record: GapAnalysisRecord) => void
}) {
    const [recordToView, setRecordToView] = useState<GapAnalysisRecord | null>(null);

    if (records.length === 0) {
      return null;
    }
  
    return (
      <>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitCompareArrows /> Associated GAP Analysis
            </CardTitle>
            <CardDescription>
              These GAP analysis records are linked to this CASR.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SL Ref. Number</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Annex</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Evaluation Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-semibold">{record.slReferenceNumber}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{record.subject}</TableCell>
                    <TableCell>{record.annex}</TableCell>
                    <TableCell>{record.typeOfStateLetter}</TableCell>
                    <TableCell>
                      <Badge variant={record.statusItem === 'CLOSED' ? 'default' : 'destructive'}>
                        {record.statusItem}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(parseISO(record.dateOfEvaluation), 'PPP')}</TableCell>
                    <TableCell className="text-right print:hidden">
                       <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => setRecordToView(record)}>
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>View Details</p></TooltipContent>
                       </Tooltip>
                       <EditGapAnalysisRecordDialog record={record} onRecordUpdate={onUpdate} />
                       <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => onDelete(record)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Delete Record</p></TooltipContent>
                       </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {recordToView && (
            <GapAnalysisRecordDetailDialog
                record={recordToView}
                open={!!recordToView}
                onOpenChange={(open) => { if(!open) setRecordToView(null) }}
            />
        )}
      </>
    );
  }

type ProjectDetailsPageProps = {
  project: Project;
  users: User[];
  allGapAnalysisRecords: GapAnalysisRecord[];
};

export function ProjectDetailsPage({ project: initialProject, users, allGapAnalysisRecords: initialGapRecords }: ProjectDetailsPageProps) {
  const [project, setProject] = useState<Project>(initialProject);
  const [allGapAnalysisRecords, setAllGapAnalysisRecords] = useState<GapAnalysisRecord[]>(initialGapRecords);

  const [isDeletingDoc, setIsDeletingDoc] = useState<string | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState<string | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState<boolean>(false);
  const [isDeletingGapRecord, setIsDeletingGapRecord] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [docToDelete, setDocToDelete] = useState<ProjectDocument | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [gapRecordToDelete, setGapRecordToDelete] = useState<GapAnalysisRecord | null>(null);

  const router = useRouter();
  const { toast } = useToast();

  const associatedGapRecords = React.useMemo(() => {
    if (project.projectType !== 'Rulemaking' || !project.casr) return [];
    return allGapAnalysisRecords.filter(record => 
        record.evaluations.some(e => e.casrAffected === `CASR ${project.casr}`)
    );
  }, [allGapAnalysisRecords, project.casr, project.projectType]);


  if (!project) {
    return <div>Loading project details...</div>;
  }

  const handleTaskAdd = (newTask: Task) => {
    setProject(prev => ({...prev, tasks: [...(prev.tasks || []), newTask]}));
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    setProject(prev => ({
        ...prev, 
        tasks: (prev.tasks || []).map(task => task.id === updatedTask.id ? updatedTask : task)
    }));
  }

  const handleSubProjectAdd = (newSubProject: SubProject) => {
    setProject(prev => ({...prev, subProjects: [...(prev.subProjects || []), newSubProject]}));
  }

  const handleSubProjectUpdate = (updatedSubProject: SubProject) => {
     setProject(prev => ({
        ...prev,
        subProjects: (prev.subProjects || []).map(sub => sub.id === updatedSubProject.id ? updatedSubProject : sub)
     }));
  }
  
  const handleDocumentAdd = (newDocument: ProjectDocument) => {
    setProject(prev => ({ ...prev, documents: [...(prev.documents || []), newDocument] }));
  }

  const handleDeleteDocument = async () => {
    if (!docToDelete) return;

    setIsDeletingDoc(docToDelete.id);
    const result = await deleteDocument(project.id, docToDelete.id, project.projectType);
    setIsDeletingDoc(null);

    if (result.success) {
      setProject(prev => ({
        ...prev,
        documents: (prev.documents || []).filter(doc => doc.id !== docToDelete.id)
      }));
      toast({
        title: "Document Deleted",
        description: `"${docToDelete.name}" has been removed.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "Failed to delete document.",
      });
    }
    setDocToDelete(null);
  };
  
  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    setIsDeletingTask(taskToDelete.id);
    const result = await deleteTask(project.id, taskToDelete.id, project.projectType);
    setIsDeletingTask(null);

    if (result.success) {
      setProject(prev => ({
        ...prev,
        tasks: (prev.tasks || []).filter(task => task.id !== taskToDelete.id)
      }));
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
  }

  const handleDeleteProject = async () => {
    setIsDeletingProject(true);
    const result = await deleteProject(project.id, project.projectType);
    setIsDeletingProject(false);

    if (result.success) {
      toast({
        title: "Project Deleted",
        description: `"${project.name}" has been permanently deleted.`,
      });
      router.push('/dashboard');
    } else {
      toast({
        variant: 'destructive',
        title: 'Error Deleting Project',
        description: result.error || 'An unexpected error occurred.',
      });
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteGapRecordRequest = (record: GapAnalysisRecord) => {
    setGapRecordToDelete(record);
  };

  const handleGapRecordUpdate = (updatedRecord: GapAnalysisRecord) => {
    setAllGapAnalysisRecords(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r));
  };

  const confirmDeleteGapRecord = async () => {
    if (!gapRecordToDelete) return;

    setIsDeletingGapRecord(true);
    const result = await deleteGapAnalysisRecord(gapRecordToDelete.id);
    setIsDeletingGapRecord(false);

    if (result.success) {
      setAllGapAnalysisRecords(prev => prev.filter(r => r.id !== gapRecordToDelete.id));
      toast({ title: "GAP Analysis Record Deleted", description: `Record ${gapRecordToDelete.slReferenceNumber} has been removed.` });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setGapRecordToDelete(null);
  };


  const getDocumentIcon = (type: ProjectDocument['type']) => {
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
    'Done': 'border-transparent bg-green-100 text-green-800',
    'In Progress': 'border-transparent bg-blue-100 text-blue-800',
    'To Do': 'border-transparent bg-gray-100 text-gray-800',
    'Blocked': 'border-transparent bg-red-100 text-red-800',
  };
  
  const subProjectStatusStyles: { [key in SubProject['status']]: string } = {
    'On Track': 'border-transparent bg-blue-500 text-white',
    'At Risk': 'border-transparent bg-yellow-500 text-white',
    'Off Track': 'border-transparent bg-red-500 text-white',
    'Completed': 'border-transparent bg-green-500 text-white',
  }

  const projectManager = findUserById(project.ownerId || users[0].id, users);
  const tasks = project.tasks || [];
  const documents = project.documents || [];
  const subProjects = project.subProjects || [];
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === 'Done').length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  const documentsCardTitle = project.projectType === 'Rulemaking' ? 'Documents' : 'Project Documents';

  const doneTaskTitles = new Set(project.tasks.filter(t => t.status === 'Done').map(t => t.title));
  const currentTaskIndex = rulemakingTaskOptions.findIndex(option => !doneTaskTitles.has(option.value));
  const currentTask = currentTaskIndex !== -1 ? rulemakingTaskOptions[currentTaskIndex] : null;
  const nextTask = currentTaskIndex !== -1 && currentTaskIndex < rulemakingTaskOptions.length - 1 ? rulemakingTaskOptions[currentTaskIndex + 1] : null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <TooltipProvider>
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <div className="p-4 rounded-lg bg-card/80 backdrop-blur-sm">
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        <div className="flex gap-2 print:hidden">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Export as PDF
            </Button>
            <EditProjectDialog project={project} allUsers={users} />
            <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)} disabled={isDeletingProject}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Project
            </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-3">
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <GanttChartSquare /> Project Timeline
              </CardTitle>
              <CardDescription>A chronological view of all tasks and deadlines.</CardDescription>
          </CardHeader>
          <CardContent className="pl-0 pr-0 pb-0">
              <ProjectTimeline 
                projectId={project.id}
                projectType={project.projectType}
                tasks={tasks}
                teamMembers={project.team}
                onTaskUpdate={handleTaskUpdate}
              />
          </CardContent>
        </Card>

        {project.projectType === 'Rulemaking' && <AssociatedGapAnalysisCard records={associatedGapRecords} onDelete={handleDeleteGapRecordRequest} onUpdate={handleGapRecordUpdate} />}

        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ClipboardList /> Tasks
              </CardTitle>
              <AddTaskDialog projectId={project.id} projectType={project.projectType} onTaskAdd={handleTaskAdd} teamMembers={project.team} />
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Completed On</TableHead>
                      <TableHead>Attachments</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.length > 0 ? tasks.map((task) => {
                      const assignees = (task.assigneeIds || []).map(id => findUserById(id, users)).filter(u => u);
                      const attachmentCount = task.attachments?.length || 0;
                      return (
                        <TableRow key={task.id}>
                          <TableCell className="font-medium">
                            {task.title}
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
                                          {assignee.name?.charAt(0) || assignee.email?.charAt(0) || '?'}
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
                          <TableCell>{format(parseISO(task.startDate), 'PPP')}</TableCell>
                          <TableCell>{format(parseISO(task.dueDate), 'PPP')}</TableCell>
                          <TableCell>
                            {task.doneDate ? format(parseISO(task.doneDate), 'PPP') : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {attachmentCount > 0 ? (
                              <div className="flex flex-col gap-1">
                                {task.attachments?.map((att) => (
                                  <a
                                    key={att.id}
                                    href={att.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:underline flex items-center gap-1.5"
                                  >
                                    <LinkIcon className="h-3 w-3" />
                                    <span className="truncate max-w-[120px]">{att.name}</span>
                                  </a>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">No files</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn("text-xs font-semibold", statusStyles[task.status])}>
                              {task.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right flex justify-end items-center gap-1 print:hidden">
                              <EditTaskDialog projectId={project.id} projectType={project.projectType} task={task} teamMembers={project.team} onTaskUpdate={handleTaskUpdate} />
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setTaskToDelete(task)} disabled={isDeletingTask === task.id}>
                                  {isDeletingTask === task.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                              </Button>
                          </TableCell>
                        </TableRow>
                      );
                    }) : (
                      <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground">No tasks yet.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          
          <Card>
             <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <Paperclip /> {documentsCardTitle}
                </CardTitle>
                <AddDocumentLinkDialog projectId={project.id} projectType={project.projectType} onDocumentAdd={handleDocumentAdd} />
             </CardHeader>
             <CardContent>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {(documents || []).map((doc) => (
                          <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                            {getDocumentIcon(doc.type)}
                            <div className="flex-1 overflow-hidden">
                                <p className="font-medium truncate">{doc.name}</p>
                                {doc.uploadDate && <p className="text-xs text-muted-foreground">Added: {format(parseISO(doc.uploadDate), 'PPP')}</p>}
                            </div>
                            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                                <a href={doc.url} target="_blank" rel="noopener noreferrer" aria-label={`Open document ${doc.name}`}>
                                    <LinkIcon className="h-4 w-4" />
                                </a>
                            </Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive print:hidden" onClick={() => setDocToDelete(doc)} disabled={isDeletingDoc === doc.id} aria-label={`Delete document ${doc.name}`}>
                                {isDeletingDoc === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                             </Button>
                          </div>
                        ))}
                    </div>
                     {documents.length === 0 && (
                        <p className="text-muted-foreground text-center py-4">No documents linked yet.</p>
                    )}
                </div>
             </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <Folder /> Sub-Projects
                </CardTitle>
                <AddSubProjectDialog projectId={project.id} projectType={project.projectType} onSubProjectAdd={handleSubProjectAdd} />
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
                        <div className="print:hidden">
                          <EditSubProjectDialog projectId={project.id} projectType={project.projectType} subProject={sub} onSubProjectUpdate={handleSubProjectUpdate} />
                        </div>
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
          {project.projectType === 'Rulemaking' && (
            <Card>
              <CardHeader>
                <CardTitle>What's Next?</CardTitle>
                <CardDescription>
                  Guidance on the next steps based on the standard rulemaking process.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentTask ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">CURRENT TASK</p>
                      <p className="font-bold text-lg text-primary">{currentTask.label}</p>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-semibold text-muted-foreground">NEXT TASK</p>
                        <p className="font-semibold">{nextTask ? nextTask.label : 'Project Finalization'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Flag className="h-5 w-5 text-green-600" />
                    <p className="font-semibold text-green-600">All standard tasks completed!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Project Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-muted-foreground">Progress</span>
                      <span className="font-semibold">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
              </div>
               <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline" className={cn("text-xs font-semibold", {
                    'border-transparent bg-green-100 text-green-800': project.status === 'Completed',
                    'border-transparent bg-blue-100 text-blue-800': project.status === 'On Track',
                    'border-transparent bg-yellow-100 text-yellow-800': project.status === 'At Risk',
                    'border-transparent bg-red-100 text-red-800': project.status === 'Off Track',
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
              {project.team.map((user, index) => (
                  <div key={`${user.id}-${index}`} className="flex items-center gap-4">
                      <Avatar>
                          <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="person portrait" />
                          <AvatarFallback>{user.name?.charAt(0) || user.email?.charAt(0) || '?'}</AvatarFallback>
                      </Avatar>
                      <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.role}</p>
                      </div>
                  </div>
              ))}
            </CardContent>
          </Card>
          
          <ChecklistCard project={project} />
        </div>
      </div>

       <AlertDialog open={!!docToDelete} onOpenChange={(open) => !open && setDocToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader className="text-center items-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-2">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the document link
                    for <span className="font-semibold">{docToDelete?.name}</span>.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteDocument} className={buttonVariants({ variant: 'destructive' })}>
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader className="text-center items-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-2">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the task
                    <span className="font-semibold"> "{taskToDelete?.title}"</span>.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteTask} className={buttonVariants({ variant: 'destructive' })}>
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
            <AlertDialogHeader className="text-center items-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-2">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the project <span className="font-semibold">"{project.name}"</span> and all of its associated data, including tasks, documents, and sub-projects.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeletingProject}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                disabled={isDeletingProject}
                onClick={handleDeleteProject}
                className={buttonVariants({ variant: 'destructive' })}
                >
                {isDeletingProject && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete Project
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!gapRecordToDelete} onOpenChange={(open) => !open && setGapRecordToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader className="text-center items-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-2">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the record with SL Reference <span className="font-semibold">{gapRecordToDelete?.slReferenceNumber}</span>.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeletingGapRecord}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteGapRecord} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isDeletingGapRecord}>
                    {isDeletingGapRecord ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    </main>
    </TooltipProvider>
  );
}
