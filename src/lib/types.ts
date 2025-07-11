
export type User = {
  id: string;
  name: string;
  avatarUrl: string;
  role: 'Head of Sub-Directorate' | 'Team Lead' | 'PIC' | 'Assistant PIC' | 'Functional';
};

export type Document = {
  id: string;
  name: string;
  type: 'PDF' | 'Word' | 'Excel' | 'Image' | 'Other';
  uploadDate: string;
  url: string;
};

export type Task = {
  id: string;
  title: string;
  assigneeId: string;
  dueDate: string;
  status: 'Done' | 'In Progress' | 'To Do' | 'Blocked';
};

export type SubProject = {
  id: string;
  name: string;
  description: string;
  status: 'On Track' | 'At Risk' | 'Off Track' | 'Completed';
}

export type Project = {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'On Track' | 'At Risk' | 'Off Track' | 'Completed';
  tasks: Task[];
  documents: Document[];
  notes: string;
  team: User[];
  subProjects: SubProject[];
};
