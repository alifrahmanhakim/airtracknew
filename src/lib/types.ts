

export type User = {
  id: string;
  name: string;
  email?: string; // Add email as an optional field
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
  status: 'Done' | 'In Progress' | 'To Do' | 'Blocked';
  attachments?: Attachment[];
};

export type SubProject = {
  id: string;
  name: string;
  description: string;
  status: 'On Track' | 'At Risk' | 'Off Track' | 'Completed';
}

export type ComplianceDataRow = {
  id: string;
  sl: string;
  subject: string;
  evaluationStatus: 'Evaluated' | 'Not Evaluated' | 'Not Finish Yet';
  subjectStatus: 'Standard' | 'Recommendation' | 'Not Applicable';
  gapStatus: 'Existing in CASR' | 'Draft in CASR' | 'Belum Diadop' | 'Tidak Diadop' | 'Management Decision' | 'Not Applicable';
  implementationLevel: 'No Difference' | 'More Exacting or Exceeds' | 'Different in Character' | 'Less Protective' | 'Significant Difference' | 'Not Applicable';
};

// This is the aggregated data structure, which will be computed from ComplianceDataRow[]
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
  complianceData?: ComplianceDataRow[]; // Raw data
  adoptionData?: AdoptionDataPoint[]; // Aggregated data (can be deprecated or computed)
};
