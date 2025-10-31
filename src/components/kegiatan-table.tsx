
'use client';

import * as React from 'react';
import type { Kegiatan, User, Task, Project } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from './ui/button';
import { Info, Pencil, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { KegiatanForm } from './kegiatan-form';
import { Skeleton } from './ui/skeleton';

type KegiatanTableProps = {
  tasks: Task[];
  onDelete: (task: Task) => void;
  onUpdate: (project: Project) => void;
  isLoading: boolean;
  teamMembers: User[];
  projectId: string;
};

function EditKegiatanDialog({ task, onUpdate, teamMembers, projectId }: { task: Task; onUpdate: (project: Project) => void; teamMembers: User[], projectId: string }) {
    const [open, setOpen] = React.useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Edit Kegiatan</DialogTitle>
                    <DialogDescription>
                        Perbarui detail kegiatan "{task.title}".
                    </DialogDescription>
                </DialogHeader>
                <KegiatanForm 
                    kegiatan={task}
                    onFormSubmit={(updatedProject) => {
                        onUpdate(updatedProject);
                        setOpen(false);
                    }}
                    allUsers={teamMembers}
                    kegiatanProject={{ id: projectId, name: 'Kegiatan Subdirektorat' } as Project} // Simplified project object
                />
            </DialogContent>
        </Dialog>
    );
}


export function KegiatanTable({ tasks, onDelete, onUpdate, isLoading, teamMembers, projectId }: KegiatanTableProps) {

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }
  
  if (tasks.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground bg-muted/50 rounded-lg">
        <Info className="mx-auto h-8 w-8 mb-2" />
        <p className="font-semibold">No Activities Found</p>
        <p className="text-sm">There are no activities for the selected time range.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[25%]">Subjek</TableHead>
            <TableHead className="w-[20%]">Tanggal</TableHead>
            <TableHead className="w-[25%]">Nama yang Terlibat</TableHead>
            <TableHead className="text-right w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="font-medium align-top">{task.title}</TableCell>
              <TableCell className="align-top">
                {format(parseISO(task.startDate), 'dd MMM yyyy')} - {format(parseISO(task.dueDate), 'dd MMM yyyy')}
              </TableCell>
              <TableCell className="align-top">
                <div className="flex flex-wrap gap-1">
                    {(task.assigneeIds || []).map((id, i) => {
                        const user = teamMembers.find(u => u.id === id);
                        return <Badge key={i} variant="secondary">{user?.name || id}</Badge>
                    })}
                </div>
              </TableCell>
              <TableCell className="text-right align-top">
                <div className="flex justify-end gap-1">
                    <EditKegiatanDialog task={task} onUpdate={onUpdate} teamMembers={teamMembers} projectId={projectId}/>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(task)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
