
'use client';

import { useRef, useState } from 'react';
import type { Project, Task, User, SubProject, Document as ProjectDocument } from '@/lib/types';
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
  Paperclip,
  Folder,
  FileUp,
  Loader2,
  Link as LinkIcon,
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
import { addDocument } from '@/lib/actions';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import Link from 'next/link';

type ProjectDetailsPageProps = {
  project: Project;
  users: User[];
};

export function ProjectDetailsPage({ project: initialProject, users }: ProjectDetailsPageProps) {
  const [project, setProject] = useState<Project>(initialProject);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!project) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Project context is not available.",
        });
        return;
    }
    
    setIsUploading(true);

    try {
      const storageRef = ref(storage, `projects/${project.id}/${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      const getFileType = (fileName: string): ProjectDocument['type'] => {
        const extension = fileName.split('.').pop()?.toLowerCase();
        if (extension === 'pdf') return 'PDF';
        if (extension === 'doc' || extension === 'docx') return 'Word';
        if (extension === 'xls' || extension === 'xlsx') return 'Excel';
        if (['png', 'jpg', 'jpeg', 'gif'].includes(extension || '')) return 'Image';
        return 'Other';
      };

      const newDocumentData = {
        name: file.name,
        type: getFileType(file.name),
        url: downloadURL,
      };

      const result = await addDocument(project.id, newDocumentData);

      if (result.success && result.data) {
        setProject(prev => ({ ...prev, documents: [...(prev.documents || []), result.data as ProjectDocument] }));
        toast({
          title: "Upload Successful",
          description: `${file.name} has been added to the project.`,
        });
      } else {
        throw new Error(result.error || "Failed to save document metadata.");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        variant: 'destructive',
        title: "Upload Failed",
        description: `Could not upload ${file.name}. Reason: ${errorMessage}. Check console for details.`,
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
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

  const projectManager = findUserById(project.ownerId || users[0].id);
  const tasks = project.tasks || [];
  const documents = project.documents || [];
  const subProjects = project.subProjects || [];
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === 'Done').length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  if (!project) {
    return <div>Loading project details...</div>;
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        <EditProjectDialog project={project} allUsers={users} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ClipboardList /> Tasks
              </CardTitle>
              <AddTaskDialog projectId={project.id} onTaskAdd={handleTaskAdd} teamMembers={project.team} />
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
                            <EditTaskDialog projectId={project.id} task={task} teamMembers={project.team} onTaskUpdate={handleTaskUpdate} />
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
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
                     Upload Document
                </Button>
             </CardHeader>
             <CardContent>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {(documents || []).map((doc, index) => (
                          <div key={doc.id || index} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                            {getDocumentIcon(doc.type)}
                            <div className="flex-1 overflow-hidden">
                                <p className="font-medium truncate">{doc.name}</p>
                                {doc.uploadDate && <p className="text-xs text-muted-foreground">Uploaded: {format(parseISO(doc.uploadDate), 'PPP')}</p>}
                            </div>
                            <Button asChild variant="ghost" size="icon">
                                <Link href={doc.url} target="_blank" rel="noopener noreferrer">
                                    <LinkIcon className="h-4 w-4" />
                                </Link>
                            </Button>
                          </div>
                        ))}
                    </div>
                     {documents.length === 0 && !isUploading && (
                        <p className="text-muted-foreground text-center py-4">No documents yet.</p>
                    )}
                    {isUploading && (
                        <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="ml-2">Uploading document...</p>
                        </div>
                    )}
                </div>
             </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <Folder /> Sub-Projects
                </CardTitle>
                <AddSubProjectDialog projectId={project.id} onSubProjectAdd={handleSubProjectAdd} />
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
                        <EditSubProjectDialog projectId={project.id} subProject={sub} onSubProjectUpdate={handleSubProjectUpdate} />
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
}
