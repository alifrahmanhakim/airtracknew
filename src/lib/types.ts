
export type User = {
  id: string;
  name: string;
  avatarUrl: string;
  role: 'Sub-Directorate Head' | 'Team Lead' | 'PIC' | 'PIC Assistant' | 'Functional';
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
  startDate: string;
  dueDate: string;
  status: 'Done' | 'In Progress' | 'To Do' | 'Blocked';
};

export type SubProject = {
  id: string;
  name: string;
  description: string;
  status: 'On Track' | 'At Risk' | 'Off Track' | 'Completed';
}

export type AdoptionDataPoint = {
  sl: string;
  // Total Evaluation Status
  evaluated: number;
  notEvaluated: number;
  notFinishYet: number;
  // Total Subject & Status
  totalSubject: number;
  standard: number;
  recommendation: number;
  // Gap Status
  existingInCasr: number;
  draftInCasr: number;
  belumDiAdop: number;
  tidakDiAdop: number;
  managementDecision: number;
  // Level of Implementation
  noDifference: number;
  moreExactingOrExceeds: number;
  differentInCharacter: number;
  lessProtective: number;
  significantDifference: number;
  notApplicable: number;
};


export type Project = {
  id: string;
  name: string;
  ownerId: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'On Track' | 'At Risk' | 'Off Track' | 'Completed';
  tasks: Task[];
  documents: Document[];
  notes: string;
  team: User[];
  subProjects: SubProject[];
  projectType: 'Rulemaking' | 'Tim Kerja';
  annex?: string;
  casr?: string;
  tags?: string[];
  adoptionData?: AdoptionDataPoint[];
};

    
