import { z } from 'zod';

export const ccefodFormSchema = z.object({
    adaPerubahan: z.enum(['YA', 'TIDAK']),
    usulanPerubahan: z.string().optional(),
    isiUsulan: z.string().optional(),
    annex: z.string().min(1, 'Annex is required'),
    annexReference: z.string().min(1, 'Annex Reference is required'),
    standardPractice: z.any().refine(val => typeof val === 'string' && val.trim().length > 0 && val.trim() !== '<p></p>', {
      message: "Standard or Recommended Practice is required"
    }),
    legislationReference: z.string().min(1, 'State Legislation Reference is required'),
    implementationLevel: z.enum([
      "No difference",
      "More exacting or exceeds",
      "Different in character or other means of compliance",
      "Less protective or patially implemented or not implemented",
      "Not applicable",
      "No  Information  Provided",
      "Insufficient  Information  Provided"
    ]),
    differenceText: z.string().optional(),
    differenceReason: z.string().optional(),
    remarks: z.string().optional(),
    status: z.enum(['Existing', 'Draft', 'Final']),
});
  
export const pqFormSchema = z.object({
  pqNumber: z.string().min(1, 'PQ Number is required'),
  protocolQuestion: z.string().min(1, 'Protocol Question is required'),
  guidance: z.string().min(1, 'Guidance for Review of Evidence is required'),
  icaoReferences: z.string().min(1, 'ICAO References are required'),
  ppq: z.enum(['YES', 'NO']),
  criticalElement: z.enum(['CE - 1','CE - 2','CE - 3','CE - 4','CE - 5','CE - 6','CE - 7','CE - 8']),
  remarks: z.string().optional(),
  evidence: z.string().optional(),
  answer: z.string().optional(),
  poc: z.string().optional(),
  icaoStatus: z.enum(['Satisfactory', 'No Satisfactory']),
  cap: z.string().optional(),
  sspComponent: z.string().optional(),
  status: z.enum(['Existing', 'Draft', 'Final']),
});

const inspectorSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Inspector name is required'),
  signature: z.string().optional(),
});

export const gapAnalysisFormSchema = z.object({
  slReferenceNumber: z.string().min(1, 'SL Reference Number is required'),
  annex: z.string().min(1, 'Annex is required'),
  typeOfStateLetter: z.string().min(1, 'Type of State Letter is required'),
  dateOfEvaluation: z.string().min(1, 'Date of Evaluation is required'),
  subject: z.string().min(1, 'Subject is required'),
  actionRequired: z.string().min(1, 'Action Required is required'),
  effectiveDate: z.string().min(1, 'Effective Date is required'),
  applicabilityDate: z.string().min(1, 'Applicability Date is required'),
  embeddedApplicabilityDate: z.date({ required_error: 'Embedded applicability date is required.' }),
  evaluations: z.array(z.object({
    id: z.string(),
    icaoSarp: z.string().min(1, 'ICAO SARP is required'),
    review: z.string().min(1, 'Review is required'),
    complianceStatus: z.enum([
      'No Differences',
      'More Exacting or Exceeds',
      'Different in character or other means of compliance',
      'Less protective or partially implemented or not implemented',
      'Not Applicable',
    ]),
    casrAffected: z.string().min(1, 'CASR to be affected is required'),
  })).min(1, 'At least one evaluation item is required'),
  statusItem: z.enum(['OPEN', 'CLOSED']),
  summary: z.string().optional(),
  inspectors: z.array(inspectorSchema).optional(),
});

export const glossaryFormSchema = z.object({
  tsu: z.string().min(1, 'TSU is required'),
  tsa: z.string().min(1, 'TSA is required'),
  editing: z.string().min(1, 'Editing is required'),
  makna: z.string().min(1, 'Makna is required'),
  keterangan: z.string().min(1, 'Keterangan / Pengaplikasian is required'),
  status: z.enum(['Draft', 'Final']),
});

export const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required.'),
  description: z.string().min(1, 'Description is required.'),
  startDate: z.date({ required_error: 'Start date is required.' }),
  endDate: z.date({ required_error: 'End date is required.' }),
  team: z.array(z.string()).min(1, 'At least one team member must be selected.'),
  annex: z.string().min(1, 'Annex is required.'),
  casr: z.string().min(1, 'CASR is required.'),
  tags: z.array(z.string()).optional(),
  isHighPriority: z.boolean().default(false),
});

export const timKerjaProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required.'),
  description: z.string().min(1, 'Description is required.'),
  startDate: z.date({ required_error: 'Start date is required.' }),
  endDate: z.date({ required_error: 'End date is required.' }),
  team: z.array(z.string()).min(1, 'At least one team member must be selected.'),
  tags: z.array(z.string()).optional(),
  isHighPriority: z.boolean().default(false),
});
