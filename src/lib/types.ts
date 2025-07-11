
export type User = {
  id: string;
  name: string;
  avatarUrl: string;
  role: 'Kepala Sub-Direktorat' | 'Ketua Tim' | 'PIC' | 'Asisten PIC' | 'Fungsional';
};

export type Document = {
  id: string;
  name: string;
  type: 'PDF' | 'Word' | 'Excel' | 'Image' | 'Lainnya';
  uploadDate: string;
  url: string;
};

export type Task = {
  id: string;
  title: string;
  assigneeId: string;
  dueDate: string;
  status: 'Selesai' | 'Sedang Berjalan' | 'Akan Dikerjakan' | 'Terhambat';
};

export type SubProject = {
  id: string;
  name: string;
  description: string;
  status: 'Sesuai Jalur' | 'Beresiko' | 'Keluar Jalur' | 'Selesai';
}

export type Project = {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'Sesuai Jalur' | 'Beresiko' | 'Keluar Jalur' | 'Selesai';
  tasks: Task[];
  documents: Document[];
  notes: string;
  team: User[];
  subProjects: SubProject[];
};
