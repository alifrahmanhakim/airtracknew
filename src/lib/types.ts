

export type User = {
  id: string;
  name: string;
  email?: string;
  avatarUrl: string;
  role: 'Sub-Directorate Head' | 'Team Lead' | 'PIC' | 'PIC Assistant' | 'Functional';
  isApproved?: boolean;
};

export type Document = {
  id: string;
  name: string;
  type: 'PDF' | 'Word' | 'Excel' | 'Image' | 'Other';
  uploadDate: string;
  url: string;
};

export type Attachment = {
  id: string;
  name: string;
  url: string;
};

export type Task = {
  id: string;
  title: string;
  assigneeId: string;
  startDate: string;
  dueDate: string;
  doneDate?: string; // Add optional completion date
  status: 'Done' | 'In Progress' | 'To Do' | 'Blocked';
  attachments?: Attachment[];
};

export type SubProject = {
  id: string;
  name: string;
  description: string;
  status: 'On Track' | 'At Risk' | 'Off Track' | 'Completed';
}

export type ChecklistItem = {
  id: string;
  text: string;
  completed: boolean;
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
  checklist?: ChecklistItem[];
};

export type StateLetterRecord = {
    id: string;
    no: string;
    subject: string;
    reference: string;
    casr: string;
    description: string;
    status: "Open" | "Closed" | "In Progress";
    assignedTo: string;
    dueDate: string;
};

export type CcefodRecord = {
  id: string;
  createdAt: string;
  adaPerubahan: 'YA' | 'TIDAK';
  usulanPerubahan?: string;
  isiUsulan?: string;
  annex: string;
  annexReference: string;
  standardPractice: string;
  legislationReference: string;
  implementationLevel: "No difference" | "More exacting or exceeds" | "Different in character or other means of compliance" | "Less protective or patially implemented or not implemented" | "Not applicable" | "No  Information  Provided" | "Insufficient  Information  Provided";
  differenceText?: string;
  differenceReason?: string;
  remarks?: string;
  status: 'Existing' | 'Draft' | 'Final';
}

export type PqRecord = {
  id: string;
  createdAt: string;
  pqNumber: string;
  protocolQuestion: string;
  guidance: string;
  icaoReferences: string;
  ppq: 'YES' | 'NO';
  criticalElement: 'CE - 1' | 'CE - 2' | 'CE - 3' | 'CE - 4' | 'CE - 5' | 'CE - 6' | 'CE - 7' | 'CE - 8';
  remarks?: string;
  evidence?: string;
  answer?: string;
  poc?: string;
  icaoStatus: 'Satisfactory' | 'No Satisfactory';
  cap?: string;
  sspComponent?: string;
  status: 'Existing' | 'Draft' | 'Final';
}

export type EvaluationItem = {
  id: string;
  icaoSarp: string;
  review: string;
  complianceStatus: 'No Differences' | 'More Exacting or Exceeds' | 'Different in character or other means of compliance' | 'Less protective or partially implemented or not implemented' | 'Not Applicable';
};

export type GapAnalysisRecord = {
  id: string;
  createdAt: string;
  slReferenceNumber: string;
  annex: string;
  typeOfStateLetter: string;
  dateOfEvaluation: string;
  subject: string;
  actionRequired: string;
  effectiveDate: string;
  applicabilityDate: string;
  embeddedApplicabilityDate: string;
  evaluations: EvaluationItem[];
  statusItem: 'OPEN' | 'CLOSED';
  summary: string;
  inspectorNames: string[];
  casrAffected: string;
};
