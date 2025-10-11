
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import type { Project, Task, User, SubProject, Document as ProjectDocument, GapAnalysisRecord, Attachment } from '@/lib/types';
import { rulemakingTaskOptions } from '@/lib/data';
import { findUserById, countAllTasks } from '@/lib/data-utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  Paperclip,
  Folder,
  Link as LinkIcon,
  Trash2,
  Loader2,
  GanttChartSquare,
  ArrowRight,
  Flag,
  GitCompareArrows,
  Eye,
  Printer,
  AlertTriangle,
  User as UserIcon,
  CalendarDays,
  Search,
  ListTodo,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { format, parseISO, differenceInDays, isAfter } from 'date-fns';
import { cn } from '@/lib/utils';
import { EditProjectDialog } from './edit-project-dialog';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AddDocumentLinkDialog } from './add-document-link-dialog';
import { deleteDocument, deleteProject } from '@/lib/actions/project';
import { deleteGapAnalysisRecord } from '@/lib/actions/gap-analysis';
import { useToast } from '@/hooks/use-toast';
import { ProjectTimeline } from './project-timeline';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { GapAnalysisRecordDetailDialog } from './gap-analysis-record-detail-dialog';
import { RulemakingAnalytics } from './rulemaking-analytics';
import { EditGapAnalysisRecordDialog } from './edit-gap-analysis-record-dialog';
import { TasksTable } from './tasks-table';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { AnimatedCounter } from './ui/animated-counter';

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => {
    if (!value && typeof value !== 'number') return null;
    return (
      <div className="flex justify-between items-start py-2 border-b last:border-b-0">
        <dt className="text-sm text-muted-foreground whitespace-nowrap pr-4">{label}</dt>
        <dd className="text-sm font-semibold text-right">{value}</dd>
      </div>
    );
};


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
        <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
              <GitCompareArrows /> Associated Revision with State Letter
            </CardTitle>
            <CardDescription className="text-yellow-700/80 dark:text-yellow-400/80">
              These GAP analysis records are linked to this CASR.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {records.map((record) => (
                <div key={record.id} className="border bg-card p-4 rounded-lg shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-bold">{record.slReferenceNumber}</h4>
                            <p className="text-sm text-muted-foreground max-w-md truncate">{record.subject}</p>
                        </div>
                         <div className="flex items-center gap-2 print:hidden flex-shrink-0">
                            <Tooltip>
                                  <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setRecordToView(record)}>
                                          <Eye className="h-4 w-4" />
                                      </Button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>View Details</p></TooltipContent>
                            </Tooltip>
                            <EditGapAnalysisRecordDialog record={record} onRecordUpdate={onUpdate} />
                            <Tooltip>
                                  <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8" onClick={() => onDelete(record)}>
                                          <Trash2 className="h-4 w-4" />
                                      </Button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>Delete Record</p></TooltipContent>
                            </Tooltip>
                        </div>
                    </div>
                     <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <p className="text-xs text-muted-foreground">Annex</p>
                            <p className="font-semibold">{record.annex}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Type</p>
                            <p className="font-semibold">{record.typeOfStateLetter}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Evaluation Date</p>
                            <p className="font-semibold">{record.dateOfEvaluation ? format(parseISO(record.dateOfEvaluation), 'PPP') : 'N/A'}</p>
                        </div>
                         <div>
                            <p className="text-xs text-muted-foreground">Status</p>
                             <Badge variant={record.statusItem === 'CLOSED' ? 'default' : 'destructive'}>
                                {record.statusItem}
                            </Badge>
                        </div>
                    </div>
                </div>
            ))}
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
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);

  const [isDeletingDoc, setIsDeletingDoc] = useState<string | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState<boolean>(false);
  const [isDeletingGapRecord, setIsDeletingGapRecord] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [docToDelete, setDocToDelete] = useState<ProjectDocument | Attachment | null>(null);
  const [gapRecordToDelete, setGapRecordToDelete] = useState<GapAnalysisRecord | null>(null);

  const [documentSearch, setDocumentSearch] = useState('');
  
  const [animatedAttachmentCompletion, setAnimatedAttachmentCompletion] = useState(0);

  const router = useRouter();
  const { toast } = useToast();

  React.useEffect(() => {
    const userId = localStorage.getItem('loggedInUserId');
    if (userId) {
      const user = findUserById(userId, users);
      if(user) setCurrentUser(user);
    }
  }, [users]);

  const associatedGapRecords = React.useMemo(() => {
    if (project.projectType !== 'Rulemaking' || !project.casr) return [];

    const casrNumber = project.casr;
    // This regex looks for "CASR" followed by the number, ensuring it's a whole word.
    const casrPattern = new RegExp(`\\bCASR\\s+${casrNumber}\\b`, 'i');

    return allGapAnalysisRecords.filter(record => 
        (record.evaluations || []).some(e => 
            e.casrAffected && casrPattern.test(e.casrAffected)
        )
    );
  }, [allGapAnalysisRecords, project.casr, project.projectType]);


  if (!project) {
    return <div>Loading project details...</div>;
  }

  const handleTaskDataChange = (updatedTasks: Task[]) => {
    setProject(prev => ({...prev, tasks: updatedTasks}));
  }

  const handleDocumentAdd = (newDocument: ProjectDocument) => {
    setProject(prev => ({ ...prev, documents: [...(prev.documents || []), newDocument] }));
  }

  const handleDeleteDocument = async () => {
    if (!docToDelete) return;

    setIsDeletingDoc(docToDelete.id);
    // Note: Deleting attachments from tasks is more complex as they are nested.
    // This implementation focuses on project-level documents.
    // A more robust solution would handle task attachments separately.
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

  const handleDeleteProject = async () => {
    setIsDeletingProject(true);
    const result = await deleteProject(project.id, project.projectType);
    setIsDeletingProject(false);

    if (result.success) {
      toast({
        title: "Project Deleted",
        description: `"${project.name}" has been permanently deleted.`,
      });
      router.push(project.projectType === 'Rulemaking' ? '/rulemaking' : '/dashboard');
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


  const getDocumentIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') return <FileText className="h-6 w-6 text-red-600" />;
    if (['doc', 'docx'].includes(extension || '')) return <File className="h-6 w-6 text-blue-600" />;
    if (['xls', 'xlsx', 'csv'].includes(extension || '')) return <FileSpreadsheet className="h-6 w-6 text-green-600" />;
    if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(extension || '')) return <FileImage className="h-6 w-6 text-purple-600" />;
    return <FileQuestion className="h-6 w-6 text-gray-500" />;
  };
  
  const projectManager = findUserById(project.ownerId || users[0].id, users);
  const tasks = project.tasks || [];
  
  const { total: totalTasks, completed: completedTasks } = countAllTasks(tasks);
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  const documentsCardTitle = project.projectType === 'Rulemaking' ? 'Documents' : 'Project Documents';

  const doneTaskTitles = new Set(project.tasks.filter(t => t.status === 'Done').map(t => t.title));
  const currentTaskIndex = rulemakingTaskOptions.findIndex(option => !doneTaskTitles.has(option.value));
  const currentTask = currentTaskIndex !== -1 ? rulemakingTaskOptions[currentTaskIndex] : null;
  const nextTask = currentTaskIndex !== -1 && currentTaskIndex < rulemakingTaskOptions.length - 1 ? rulemakingTaskOptions[currentTaskIndex + 1] : null;

  const handlePrint = () => {
    window.print();
  };
  
  const canDeleteProject = currentUser && (currentUser.role === 'Sub-Directorate Head' || currentUser.email === 'admin@admin2023.com' || currentUser?.email === 'hakimalifrahman@gmail.com' || currentUser.id === project.ownerId || currentUser?.email === 'rizkywirapratama434@gmail.com');
  const daysLeft = differenceInDays(parseISO(project.endDate), new Date());

  const allDocuments = React.useMemo(() => {
    const projDocs = (project.documents || []).map(doc => ({ ...doc, source: 'Project' }));
    
    const taskAttachments: (Attachment & { source: string; taskTitle: string })[] = [];
    const collectAttachments = (tasks: Task[]) => {
      tasks.forEach(task => {
        if (task.attachments) {
          task.attachments.forEach(att => {
            taskAttachments.push({ ...att, source: 'Task', taskTitle: task.title });
          });
        }
        if (task.subTasks) {
          collectAttachments(task.subTasks);
        }
      });
    };
    collectAttachments(project.tasks || []);

    return [...projDocs, ...taskAttachments];
  }, [project.documents, project.tasks]);
  
  const { tasksWithoutAttachments, attachmentCompletion } = React.useMemo(() => {
      const allFlattenedTasks = (function flatten(tasks: Task[]): Task[] {
          return tasks.reduce((acc: Task[], task) => {
              acc.push(task);
              if (task.subTasks) {
                  acc.push(...flatten(task.subTasks));
              }
              return acc;
          }, []);
      })(project.tasks || []);
      
      const missing = allFlattenedTasks.filter(task => !task.attachments || task.attachments.length === 0);
      const total = allFlattenedTasks.length;
      const completion = total > 0 ? ((total - missing.length) / total) * 100 : 100;
      
      return { tasksWithoutAttachments: missing, attachmentCompletion: completion };
  }, [project.tasks]);

  useEffect(() => {
    const animation = requestAnimationFrame(() => {
      setAnimatedAttachmentCompletion(attachmentCompletion);
    });
    return () => cancelAnimationFrame(animation);
  }, [attachmentCompletion]);

  const filteredDocuments = React.useMemo(() => {
    if (!documentSearch) return allDocuments;
    const lowercasedSearch = documentSearch.toLowerCase();
    return allDocuments.filter(doc =>
      doc.name.toLowerCase().includes(lowercasedSearch) ||
      ('taskTitle' in doc && doc.taskTitle?.toLowerCase().includes(lowercasedSearch))
    );
  }, [allDocuments, documentSearch]);
  
  const taskStatusCounts = React.useMemo(() => {
    const counts = {
      'To Do': 0,
      'In Progress': 0,
      'Blocked': 0,
      'Done': 0,
    };
    const countTasks = (tasksToCount: Task[]) => {
        tasksToCount.forEach(task => {
            counts[task.status]++;
            if (task.subTasks) {
                countTasks(task.subTasks);
            }
        });
    }
    countTasks(tasks);
    return counts;
  }, [tasks]);

  const effectiveStatus = React.useMemo(() => {
    if (project.status === 'Completed') return 'Completed';

    const today = new Date();
    const startDate = parseISO(project.startDate);
    const endDate = parseISO(project.endDate);

    if (isAfter(today, endDate)) {
        return 'Off Track';
    }

    const totalDuration = differenceInDays(endDate, startDate);
    const elapsedDuration = differenceInDays(today, startDate);
    const timeProgress = totalDuration > 0 ? (elapsedDuration / totalDuration) * 100 : 0;
    
    // Consider it "At Risk" if task progress is significantly behind time progress (e.g., 20%)
    if (progress < timeProgress - 20) {
      return 'At Risk';
    }
    
    return 'On Track';
  }, [project.status, project.startDate, project.endDate, progress]);


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
            {canDeleteProject && (
              <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)} disabled={isDeletingProject}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Project
              </Button>
            )}
        </div>
      </div>
      
      <Card>
            <CardHeader><CardTitle>Project Dashboard</CardTitle></CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="flex items-center justify-center">
                         <div className="relative h-40 w-40">
                            <svg className="h-full w-full" viewBox="0 0 36 36">
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" className="text-muted/20" fill="none" stroke="currentColor" strokeWidth="3" />
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" className="text-primary" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={`${progress}, 100`} strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-bold"><AnimatedCounter endValue={progress} decimals={0} />%</span>
                                <span className="text-sm text-muted-foreground">Completed</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <Flag className="h-5 w-5 text-muted-foreground mt-1" />
                            <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <Badge variant="outline" className={cn("text-sm font-semibold", { 'border-transparent bg-green-100 text-green-800': effectiveStatus === 'Completed', 'border-transparent bg-blue-100 text-blue-800': effectiveStatus === 'On Track', 'border-transparent bg-yellow-100 text-yellow-800': effectiveStatus === 'At Risk', 'border-transparent bg-red-100 text-red-800': effectiveStatus === 'Off Track' })}>{effectiveStatus}</Badge>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <UserIcon className="h-5 w-5 text-muted-foreground mt-1" />
                            <div>
                                <p className="text-sm text-muted-foreground">Project Manager</p>
                                <p className="font-semibold">{projectManager?.name}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <CalendarDays className="h-5 w-5 text-muted-foreground mt-1" />
                            <div>
                                <p className="text-sm text-muted-foreground">Timeline</p>
                                <p className="font-semibold">{format(parseISO(project.startDate), 'dd MMM')} - {format(parseISO(project.endDate), 'dd MMM yyyy')}</p>
                                <p className={cn("text-xs", daysLeft < 0 && project.status !== 'Completed' ? "text-destructive" : "text-muted-foreground")}>
                                  {project.status === 'Completed' ? 'Project completed' : (daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days remaining`)}
                                </p>
                            </div>
                        </div>
                    </div>
                     <div className="space-y-4">
                        <h4 className="font-semibold">Task Breakdown</h4>
                        <div className="space-y-2">
                           <div className="flex items-center gap-2 text-sm">
                               <ListTodo className="h-4 w-4 text-muted-foreground" />
                               <span>To Do:</span>
                               <span className="font-bold ml-auto">{taskStatusCounts['To Do']}</span>
                           </div>
                           <div className="flex items-center gap-2 text-sm">
                               <Clock className="h-4 w-4 text-blue-500" />
                               <span className='text-blue-500'>In Progress:</span>
                               <span className="font-bold ml-auto text-blue-500">{taskStatusCounts['In Progress']}</span>
                           </div>
                           <div className="flex items-center gap-2 text-sm">
                               <AlertTriangle className="h-4 w-4 text-destructive" />
                               <span className='text-destructive'>Blocked:</span>
                               <span className="font-bold ml-auto text-destructive">{taskStatusCounts['Blocked']}</span>
                           </div>
                           <div className="flex items-center gap-2 text-sm">
                               <CheckCircle className="h-4 w-4 text-green-500" />
                               <span className='text-green-500'>Done:</span>
                               <span className="font-bold ml-auto text-green-500">{taskStatusCounts['Done']}</span>
                           </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <h4 className="font-semibold mb-2 flex items-center gap-2"><Users className="h-5 w-5" /> Team</h4>
                        <ScrollArea className="h-[150px]">
                             <div className="space-y-3">
                                {project.team.map((user, index) => (
                                    <div key={`${user.id}-${index}`} className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="person portrait" />
                                            <AvatarFallback><UserIcon className="h-5 w-5" /></AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium text-sm">{user.name}</p>
                                            <p className="text-xs text-muted-foreground">{user.role}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </CardContent>
        </Card>
        
      <div className="grid grid-cols-1 gap-6">
        
        {project.projectType === 'Rulemaking' && (
          <AssociatedGapAnalysisCard records={associatedGapRecords} onDelete={handleDeleteGapRecordRequest} onUpdate={handleGapRecordUpdate} />
        )}

        <Card>
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
                onTaskUpdate={() => {}} // Placeholder, timeline updates are visual only
              />
          </CardContent>
        </Card>
        
        <TasksTable 
          projectId={project.id}
          projectType={project.projectType}
          tasks={tasks}
          teamMembers={project.team}
          onTasksChange={handleTaskDataChange}
        />
        
        <Card>
           <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                    <Paperclip /> {documentsCardTitle}
                </CardTitle>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search documents..."
                    value={documentSearch}
                    onChange={(e) => setDocumentSearch(e.target.value)}
                    className="pl-9 w-full sm:w-[200px]"
                  />
                </div>
                <AddDocumentLinkDialog projectId={project.id} projectType={project.projectType} onDocumentAdd={handleDocumentAdd} />
              </div>
           </CardHeader>
           <CardContent>
            <ScrollArea className="h-72">
              <div className="space-y-4 pr-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {filteredDocuments.map((doc) => (
                        <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                          {getDocumentIcon(doc.name)}
                          <div className="flex-1 overflow-hidden">
                              <p className="font-medium truncate">{doc.name}</p>
                              {'taskTitle' in doc && doc.taskTitle ? (
                                <p className="text-xs text-muted-foreground">From task: {doc.taskTitle}</p>
                              ) : ('uploadDate' in doc && doc.uploadDate) && (
                                <p className="text-xs text-muted-foreground">Added: {format(parseISO(doc.uploadDate), 'PPP')}</p>
                              )}
                          </div>
                          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                              <a href={doc.url} target="_blank" rel="noopener noreferrer" aria-label={`Open document ${doc.name}`}>
                                  <LinkIcon className="h-4 w-4" />
                              </a>
                          </Button>
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive print:hidden" onClick={() => 'uploadDate' in doc && setDocToDelete(doc)} disabled={isDeletingDoc === doc.id || !('uploadDate' in doc)}>
                              {isDeletingDoc === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                           </Button>
                        </div>
                      ))}
                  </div>
                   {filteredDocuments.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">No documents {documentSearch ? 'match your search' : 'linked yet'}.</p>
                  )}
              </div>
            </ScrollArea>
           </CardContent>
        </Card>
        
        {tasksWithoutAttachments.length > 0 && (
          <Card className="border-yellow-300 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800/80">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
                    <AlertTriangle /> Attachment Alert
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                    <div className="flex-1 space-y-2">
                         <div className="flex justify-between items-baseline">
                            <p className="font-semibold text-yellow-900 dark:text-yellow-200">
                                {tasksWithoutAttachments.length} of {totalTasks} tasks are missing attachments.
                            </p>
                            <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                                <AnimatedCounter endValue={animatedAttachmentCompletion} decimals={0} />%
                            </p>
                        </div>
                        <p className="text-sm text-yellow-800/80 dark:text-yellow-400/80">
                            Ensure all tasks have necessary documentation for compliance and record-keeping.
                        </p>
                        <div className="pt-2">
                            <Progress value={animatedAttachmentCompletion} indicatorClassName="bg-yellow-500" className="h-2 bg-yellow-200 dark:bg-yellow-800/50" />
                        </div>
                    </div>
                    <div className="md:w-1/2">
                         <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">Tasks to review:</h4>
                         <ScrollArea className="h-32">
                             <ul className="list-disc pl-5 space-y-1 text-sm text-yellow-800 dark:text-yellow-300">
                                {tasksWithoutAttachments.map(task => (
                                    <li key={task.id}>{task.title}</li>
                                ))}
                            </ul>
                         </ScrollArea>
                    </div>
                </div>
            </CardContent>
          </Card>
        )}
        
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
