
'use client';

import * as React from 'react';
import type { Task, User, Project, Attachment } from '@/lib/types';
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
  ArrowUpDown,
  Search,
  RotateCcw,
  ChevronDown,
  FileSpreadsheet,
  Pencil,
  File,
  FileText,
  FileImage,
  FileQuestion,
  Printer,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { EditTaskDialog } from './edit-task-dialog';
import { AddTaskDialog } from './add-task-dialog';
import { deleteTask } from '@/lib/actions/project';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Highlight } from './ui/highlight';

type TaskRowProps = {
  task: Task;
  level: number;
  teamMembers: User[];
  projectId: string;
  projectType: Project['projectType'];
  onTaskUpdate: (tasks: Task[]) => void;
  onTaskDelete: (taskId: string) => void;
  isDeleting: boolean;
  taskNumber: string;
  visibleColumns: Record<string, boolean>;
  searchTerm: string;
};

const TaskRow = ({ task, level, teamMembers, projectId, projectType, onTaskUpdate, onTaskDelete, isDeleting, taskNumber, visibleColumns, searchTerm }: TaskRowProps) => {
    const [isSubtaskDialogOpen, setIsSubtaskDialogOpen] = React.useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
    const [isOpen, setIsOpen] = React.useState(true);
    
    const hasSubtasks = task.subTasks && task.subTasks.length > 0;
    
    const statusStyles: { [key in Task['status']]: string } = {
        'Done': 'border-transparent bg-green-100 text-green-800',
        'In Progress': 'border-transparent bg-blue-100 text-blue-800',
        'To Do': 'border-transparent bg-gray-100 text-gray-800',
        'Blocked': 'border-transparent bg-red-100 text-red-800',
    };

    return (
        <React.Fragment>
            <TableRow className="border-b cursor-pointer" onClick={() => setIsEditDialogOpen(true)}>
                 <TableCell>
                    <div className="flex items-center" style={{ paddingLeft: `${level * 1.5}rem` }}>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} disabled={!hasSubtasks}>
                            {hasSubtasks ? (
                                <ChevronRight className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-90")} />
                            ) : (
                            <span className='w-4 h-4'></span>
                            )}
                        </Button>
                        <span>{taskNumber}</span>
                    </div>
                </TableCell>
                <TableCell className="font-medium text-left">
                <div className="flex items-center gap-2">
                    <Highlight text={task.title} query={searchTerm} />
                    {task.criticalIssue && (
                            <Tooltip>
                            <TooltipTrigger onClick={(e) => e.stopPropagation()}>
                                <AlertTriangle className="h-4 w-4 text-destructive" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="font-semibold">Critical Issue:</p>
                                <p>{task.criticalIssue}</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>
                </TableCell>
                {visibleColumns.startDate && <TableCell>{task.startDate ? format(parseISO(task.startDate), 'PPP') : 'N/A'}</TableCell>}
                {visibleColumns.dueDate && <TableCell>{task.dueDate ? format(parseISO(task.dueDate), 'PPP') : 'N/A'}</TableCell>}
                {visibleColumns.namaSurat && <TableCell><Highlight text={task.namaSurat || 'N/A'} query={searchTerm} /></TableCell>}
                {visibleColumns.tanggalPelaksanaan && <TableCell>{task.tanggalPelaksanaan ? <Highlight text={format(parseISO(task.tanggalPelaksanaan), 'PPP')} query={searchTerm}/> : 'N/A'}</TableCell>}
                {visibleColumns.attachments && (
                    <TableCell>
                        {(task.attachments || []).length > 0 ? (
                            <div className="flex flex-col gap-2 items-start">
                                {(task.attachments || []).map(att => (
                                    <a 
                                        key={att.id}
                                        href={att.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center gap-1.5 p-1.5 rounded-md bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-200"
                                    >
                                        <FileText className="h-4 w-4 flex-shrink-0" />
                                        <span className="text-xs font-medium"><Highlight text={att.name} query={searchTerm} /></span>
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <span className="text-xs text-muted-foreground">None</span>
                        )}
                    </TableCell>
                )}
                <TableCell>
                    <Badge variant="outline" className={cn("text-xs font-semibold", statusStyles[task.status])}>
                        {task.status}
                    </Badge>
                </TableCell>
                <TableCell className="text-right flex justify-end items-center gap-1 print:hidden" onClick={(e) => e.stopPropagation()}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsSubtaskDialogOpen(true)}>
                                <Network className="h-4 w-4"/>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Add Subtask</TooltipContent>
                    </Tooltip>
                     <EditTaskDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} projectId={projectId} projectType={projectType} task={task} teamMembers={teamMembers} onTaskUpdate={onTaskUpdate} trigger={
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setIsEditDialogOpen(true); }}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit Task</TooltipContent>
                        </Tooltip>
                     } />
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
            {isOpen && hasSubtasks && task.subTasks.map((subTask, subIndex) => (
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
                    taskNumber={`${taskNumber}.${subIndex + 1}`}
                    visibleColumns={visibleColumns}
                    searchTerm={searchTerm}
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

type SortDescriptor = {
  column: keyof Task | 'attachments';
  direction: 'asc' | 'desc';
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

    // Filter and sort state
    const [searchTerm, setSearchTerm] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [assigneeFilter, setAssigneeFilter] = React.useState('all');
    const [sort, setSort] = React.useState<SortDescriptor>({ column: 'dueDate', direction: 'asc' });

    const [columnVisibility, setColumnVisibility] = React.useState<Record<string, boolean>>({
        no: true,
        task: true,
        startDate: true,
        dueDate: true,
        namaSurat: false,
        tanggalPelaksanaan: false,
        attachments: true,
        status: true,
        actions: true,
    });
    
    const columnDefs: { key: keyof Task | 'no' | 'actions' | 'attachments' | 'namaSurat' | 'tanggalPelaksanaan'; header: string }[] = [
        { key: 'no', header: 'No.' },
        { key: 'title', header: 'Task' },
        { key: 'startDate', header: 'Start Date' },
        { key: 'dueDate', header: 'Due Date' },
        { key: 'namaSurat', header: 'Nama Surat' },
        { key: 'tanggalPelaksanaan', header: 'Tgl. Pelaksanaan' },
        { key: 'attachments', header: 'Attachments' },
        { key: 'status', header: 'Status' },
        { key: 'actions', header: 'Actions' },
    ];


    const filteredTasks = React.useMemo(() => {
        let filtered = [...tasks];

        const filterRecursively = (tasks: Task[]): Task[] => {
            return tasks.map(task => {
                const subTasks = task.subTasks ? filterRecursively(task.subTasks) : [];
                
                const searchTermMatch = searchTerm ? 
                    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (task.namaSurat && task.namaSurat.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (task.tanggalPelaksanaan && format(parseISO(task.tanggalPelaksanaan), 'PPP').toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (task.attachments && task.attachments.some(att => att.name.toLowerCase().includes(searchTerm.toLowerCase())))
                    : true;
                const statusMatch = statusFilter === 'all' || task.status === statusFilter;
                const assigneeMatch = assigneeFilter === 'all' || (task.assigneeIds && task.assigneeIds.includes(assigneeFilter));
                
                const selfMatch = searchTermMatch && statusMatch && assigneeMatch;

                if (selfMatch || subTasks.length > 0) {
                    return { ...task, subTasks };
                }
                return null;
            }).filter((task): task is Task => task !== null);
        };

        return filterRecursively(filtered);
    }, [tasks, searchTerm, statusFilter, assigneeFilter]);
    
    const sortedTasks = React.useMemo(() => {
        const sortRecursively = (tasks: Task[]): Task[] => {
            tasks.sort((a, b) => {
                const valA = a[sort.column as keyof Task];
                const valB = b[sort.column as keyof Task];
                if (valA === undefined) return 1;
                if (valB === undefined) return -1;
                
                if (sort.column === 'dueDate' || sort.column === 'startDate' || sort.column === 'doneDate' || sort.column === 'tanggalPelaksanaan') {
                    const dateA = valA ? parseISO(valA as string).getTime() : 0;
                    const dateB = valB ? parseISO(valB as string).getTime() : 0;
                    return sort.direction === 'asc' ? dateA - dateB : dateB - dateA;
                }
                
                if (typeof valA === 'string' && typeof valB === 'string') {
                    return sort.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                }
                return 0;
            });
            tasks.forEach(task => {
                if (task.subTasks) {
                    task.subTasks = sortRecursively(task.subTasks);
                }
            });
            return tasks;
        }
        return sortRecursively([...filteredTasks]);

    }, [filteredTasks, sort]);

    const handleSort = (column: keyof Task | 'attachments') => {
        setSort(prev => ({
            column,
            direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const renderSortIcon = (column: keyof Task | 'attachments') => {
      if (sort?.column !== column) return <ArrowUpDown className="h-4 w-4 ml-2 opacity-30" />;
      return sort.direction === 'asc' ? <ArrowUpDown className="h-4 w-4 ml-2" /> : <ArrowUpDown className="h-4 w-4 ml-2" />;
    };

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
      
    const resetFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setAssigneeFilter('all');
    };
    
    const flattenTasksForExport = (tasks: Task[], parentNumber = ''): any[] => {
        let flatList: any[] = [];
        tasks.forEach((task, index) => {
            const taskNumber = parentNumber ? `${parentNumber}.${index + 1}` : `${index + 1}`;
            const assignees = (task.assigneeIds || []).map(id => findUserById(id, teamMembers)?.name).filter(Boolean).join(', ');
            flatList.push({
                'No.': taskNumber,
                'Task': task.title,
                'Nama Surat': task.namaSurat || '',
                'Tanggal Pelaksanaan': task.tanggalPelaksanaan ? format(parseISO(task.tanggalPelaksanaan), 'yyyy-MM-dd') : '',
                'Assignees': assignees,
                'Start Date': task.startDate ? format(parseISO(task.startDate), 'yyyy-MM-dd') : '',
                'Due Date': task.dueDate ? format(parseISO(task.dueDate), 'yyyy-MM-dd') : '',
                'Status': task.status,
                'Attachments': (task.attachments || []).map(att => att.url).join('\n'),
                'Critical Issue': task.criticalIssue || '',
            });
            if (task.subTasks) {
                flatList = flatList.concat(flattenTasksForExport(task.subTasks, taskNumber));
            }
        });
        return flatList;
    };


    const handleExportExcel = () => {
        const dataToExport = flattenTasksForExport(sortedTasks);
        if (dataToExport.length === 0) {
            toast({
                variant: 'destructive',
                title: 'No Data to Export',
                description: 'There are no tasks to export.',
            });
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');
        XLSX.writeFile(workbook, `${projectId}_tasks.xlsx`);
        toast({
            title: 'Export Successful',
            description: 'Tasks have been exported to an Excel file.',
        });
    };
    
    const handleExportPdf = () => {
        const dataToExport = flattenTasksForExport(sortedTasks);
         if (dataToExport.length === 0) {
            toast({
                variant: 'destructive',
                title: 'No Data to Export',
                description: 'There are no tasks to export.',
            });
            return;
        }

        const doc = new jsPDF({ orientation: 'landscape' });
        doc.text(`Task List for Project: ${projectId}`, 14, 15);
        
        const tableColumn = ["No.", "Task", "Assignees", "Start Date", "Due Date", "Status", "Attachment"];
        const tableRows = dataToExport.map(item => [
            item['No.'],
            item['Task'],
            item['Assignees'],
            item['Start Date'],
            item['Due Date'],
            item['Status'],
            item['Attachments'] ? 'Link' : 'N/A'
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 20,
            theme: 'grid',
            headStyles: { fillColor: [22, 160, 133], textColor: 255, fontStyle: 'bold' },
            columnStyles: {
                6: { textColor: [0, 0, 255], cellWidth: 20 }
            },
            didDrawCell: (data) => {
                if (data.section === 'body' && data.column.index === 6 && data.cell.text[0] === 'Link') {
                    const record = dataToExport[data.row.index];
                    if (record && record['Attachments']) {
                        const firstUrl = record['Attachments'].split('\n')[0];
                        doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url: firstUrl });
                    }
                }
            }
        });

        doc.save(`${projectId}_tasks.pdf`);
         toast({
            title: 'Export Successful',
            description: 'Tasks have been exported to a PDF file.',
        });
    };

    return (
        <TooltipProvider>
            <Card>
                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className='flex-1'>
                        <CardTitle className="flex items-center gap-2">
                            <ClipboardList /> Tasks
                        </CardTitle>
                    </div>
                    <div className="flex flex-col sm:flex-row flex-wrap items-center justify-end gap-2 w-full md:w-auto">
                        <div className="relative w-full sm:w-auto">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search tasks..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 w-full sm:w-[180px] lg:w-[250px]"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-auto"><SelectValue placeholder="Filter by status..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="To Do">To Do</SelectItem>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="Done">Done</SelectItem>
                                <SelectItem value="Blocked">Blocked</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                            <SelectTrigger className="w-full sm:w-auto"><SelectValue placeholder="Filter by assignee..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Assignees</SelectItem>
                                {teamMembers.map(member => (
                                    <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full sm:w-auto">
                                    Columns <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {columnDefs.filter(c => c.key !== 'actions' && c.key !== 'no' && c.key !== 'title' && c.key !== 'status').map(col => (
                                    <DropdownMenuCheckboxItem
                                        key={col.key}
                                        className="capitalize"
                                        checked={columnVisibility[col.key]}
                                        onCheckedChange={value => setColumnVisibility(prev => ({ ...prev, [col.key]: !!value }))}
                                    >
                                        {col.header}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        {(searchTerm || statusFilter !== 'all' || assigneeFilter !== 'all') && (
                            <Button variant="ghost" onClick={resetFilters}>
                                <RotateCcw className="mr-2 h-4 w-4" /> Reset
                            </Button>
                        )}
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    Export <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={handleExportExcel}>
                                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                                    Export to Excel
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleExportPdf}>
                                    <Printer className="mr-2 h-4 w-4" />
                                    Export to PDF
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <AddTaskDialog 
                            projectId={projectId}
                            projectType={projectType}
                            teamMembers={teamMembers}
                            onTasksChange={onTasksChange}
                        />
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="h-[400px] w-full overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead className="w-[50px]">No.</TableHead>
                                <TableHead className="w-[30%] text-left" onClick={() => handleSort('title')}>
                                    <div className="flex items-center cursor-pointer">Task {renderSortIcon('title')}</div>
                                </TableHead>
                                {columnVisibility.startDate && <TableHead onClick={() => handleSort('startDate')}><div className="flex items-center cursor-pointer">Start Date {renderSortIcon('startDate')}</div></TableHead>}
                                {columnVisibility.dueDate && <TableHead onClick={() => handleSort('dueDate')}><div className="flex items-center cursor-pointer">Due Date {renderSortIcon('dueDate')}</div></TableHead>}
                                {columnVisibility.namaSurat && <TableHead onClick={() => handleSort('namaSurat')}><div className="flex items-center cursor-pointer">Nama Surat {renderSortIcon('namaSurat')}</div></TableHead>}
                                {columnVisibility.tanggalPelaksanaan && <TableHead onClick={() => handleSort('tanggalPelaksanaan')}><div className="flex items-center cursor-pointer">Tgl. Pelaksanaan {renderSortIcon('tanggalPelaksanaan')}</div></TableHead>}
                                {columnVisibility.attachments && <TableHead onClick={() => handleSort('attachments')}><div className="flex items-center cursor-pointer">Attachments {renderSortIcon('attachments')}</div></TableHead>}
                                <TableHead onClick={() => handleSort('status')}>
                                    <div className="flex items-center cursor-pointer">Status {renderSortIcon('status')}</div>
                                </TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedTasks.length > 0 ? sortedTasks.map((task, index) => (
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
                                        taskNumber={`${index + 1}`}
                                        visibleColumns={columnVisibility}
                                        searchTerm={searchTerm}
                                    />
                                )) : (
                                <TableRow>
                                    <TableCell colSpan={Object.values(columnVisibility).filter(v => v).length} className="text-center text-muted-foreground h-24">No tasks match your criteria.</TableCell>
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
