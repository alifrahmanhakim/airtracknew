

'use server';

import {
  summarizeProjectStatus,
  type SummarizeProjectStatusInput,
  type SummarizeProjectStatusOutput,
} from '@/ai/flows/summarize-project-status';
import {
    generateChecklist as generateChecklistFlow,
    type GenerateChecklistInput,
    type GenerateChecklistOutput
} from '@/ai/flows/generate-checklist';
import type { Document, Project, SubProject, Task, User, CcefodRecord, PqRecord, ChecklistItem, GapAnalysisRecord, GlossaryRecord } from './types';
import { formSchema as ccefodFormSchema, type CcefodFormValues } from '@/components/ccefod-shared-form-fields';
import { formSchema as pqFormSchema, type PqFormValues } from '@/components/pqs-shared-form-fields';
import { formSchema as gapAnalysisSchema, type GapAnalysisFormValues } from '@/components/gap-analysis-shared-form-fields';
import { formSchema as glossaryFormSchema, type GlossaryFormValues } from '@/components/glossary-shared-form-fields';

import { db, auth } from './firebase';
import { doc, updateDoc, arrayUnion, collection, addDoc, getDoc, deleteDoc, setDoc, writeBatch, getDocs, query, where } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// --- SETUP ---
const window = new JSDOM('').window;
const purify = DOMPurify(window as any);


// --- AI ACTIONS ---
export async function generateAiChecklist(
  input: GenerateChecklistInput
): Promise<GenerateChecklistOutput> {
  return await generateChecklistFlow(input);
}

export async function getAiSummary(
  input: SummarizeProjectStatusInput
): Promise<{
  success: boolean;
  data?: SummarizeProjectStatusOutput;
  error?: string;
}> {
  try {
    const result = await summarizeProjectStatus(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('AI Summary Error:', error);
    return {
      success: false,
      error: 'Failed to generate AI summary. Please try again.',
    };
  }
}

// --- PROJECT ACTIONS (SHARED) ---
export async function updateProjectChecklist(
    projectId: string,
    checklist: ChecklistItem[],
    projectType: 'Rulemaking' | 'Tim Kerja'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const collectionName = projectType === 'Rulemaking' ? 'rulemakingProjects' : 'timKerjaProjects';
      const projectRef = doc(db, collectionName, projectId);
      await updateDoc(projectRef, { checklist });
      revalidatePath(`/projects/${projectId}`);
      return { success: true };
    } catch (error) {
      console.error('Update Checklist Error:', error);
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return { success: false, error: `Failed to update checklist: ${message}` };
    }
  }


// --- CCEFOD ACTIONS ---
export async function addCcefodRecord(data: CcefodFormValues) {
    const parsed = ccefodFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: 'Invalid data provided.', details: parsed.error.flatten().fieldErrors };
    }

    const sanitizedStandardPractice = purify.sanitize(parsed.data.standardPractice);

    try {
        const docRef = await addDoc(collection(db, 'ccefodRecords'), {
            ...parsed.data,
            standardPractice: sanitizedStandardPractice,
            createdAt: new Date().toISOString()
        });
        const newRecord: CcefodRecord = { id: docRef.id, ...parsed.data, standardPractice: sanitizedStandardPractice, createdAt: new Date().toISOString() };
        revalidatePath('/ccefod');
        return { success: true, data: newRecord };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}


export async function updateCcefodRecord(id: string, data: CcefodFormValues) {
    const parsed = ccefodFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: 'Invalid data provided.', details: parsed.error.flatten().fieldErrors };
    }
    
    const sanitizedStandardPractice = purify.sanitize(parsed.data.standardPractice);

    try {
        const recordRef = doc(db, 'ccefodRecords', id);
        const docSnap = await getDoc(recordRef);
        if (!docSnap.exists()) {
          throw new Error("Record not found");
        }
        
        const updatedData = { ...docSnap.data(), ...parsed.data, standardPractice: sanitizedStandardPractice, id };

        await setDoc(recordRef, updatedData);
        revalidatePath('/ccefod');
        
        return { success: true, data: updatedData as CcefodRecord };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}


export async function deleteCcefodRecord(id: string) {
    try {
        await deleteDoc(doc(db, 'ccefodRecords', id));
        revalidatePath('/ccefod');
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function importCcefodRecords(records: CcefodFormValues[]): Promise<{ success: boolean, count: number, error?: string }> {
  const batch = writeBatch(db);
  const recordsCollection = collection(db, 'ccefodRecords');
  let validRecordsCount = 0;

  for (const record of records) {
    const validation = ccefodFormSchema.safeParse(record);
    if (validation.success) {
      const newDocRef = doc(recordsCollection);
      batch.set(newDocRef, {
        ...validation.data,
        createdAt: new Date().toISOString()
      });
      validRecordsCount++;
    } else {
      console.warn('Skipping invalid record:', validation.error.format());
    }
  }

  if (validRecordsCount === 0) {
    return { success: false, count: 0, error: 'No valid records found in the CSV to import.' };
  }

  try {
    await batch.commit();
    revalidatePath('/ccefod');
    return { success: true, count: validRecordsCount };
  } catch (error) {
    console.error('Import CCEFOD Records Error:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, count: 0, error: `Failed to import records: ${message}` };
  }
}


// --- PQS ACTIONS ---
export async function addPqRecord(recordData: PqFormValues): Promise<{ success: boolean; data?: PqRecord; error?: string }> {
  try {
    const newRecordData = { ...recordData, createdAt: new Date().toISOString() };
    const docRef = await addDoc(collection(db, 'pqsRecords'), newRecordData);
    revalidatePath('/pqs');
    const newRecord: PqRecord = { id: docRef.id, ...newRecordData };
    return { success: true, data: newRecord };
  } catch (error) {
    console.error('Add PQ Record Error:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: `Failed to add PQ record: ${message}` };
  }
}

export async function updatePqRecord(recordId: string, recordData: PqFormValues): Promise<{ success: boolean; data?: PqRecord; error?: string }> {
  try {
    const recordRef = doc(db, 'pqsRecords', recordId);
    const docSnap = await getDoc(recordRef);
    if (!docSnap.exists()) throw new Error("Record not found");
    
    const updatedData = { ...docSnap.data(), ...recordData, id: recordId };
    await setDoc(recordRef, updatedData);
    revalidatePath('/pqs');
    
    return { success: true, data: updatedData as PqRecord };
  } catch (error) {
    console.error('Update PQ Record Error:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: `Failed to update PQ record: ${message}` };
  }
}


export async function deletePqRecord(id: string) {
    try {
        await deleteDoc(doc(db, 'pqsRecords', id));
        revalidatePath('/pqs');
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function importPqRecords(records: PqFormValues[]): Promise<{ success: boolean, count: number, error?: string }> {
  const batch = writeBatch(db);
  const recordsCollection = collection(db, 'pqsRecords');
  let validRecordsCount = 0;

  for (const record of records) {
    const validation = pqFormSchema.safeParse(record);
    if (validation.success) {
      const newDocRef = doc(recordsCollection);
      batch.set(newDocRef, {
        ...validation.data,
        createdAt: new Date().toISOString()
      });
      validRecordsCount++;
    } else {
      console.warn('Skipping invalid PQ record:', validation.error.format());
    }
  }

  if (validRecordsCount === 0) {
    return { success: false, count: 0, error: 'No valid records found in the CSV to import.' };
  }

  try {
    await batch.commit();
    revalidatePath('/pqs');
    return { success: true, count: validRecordsCount };
  } catch (error) {
    console.error('Import PQ Records Error:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, count: 0, error: `Failed to import records: ${message}` };
  }
}

// --- PROJECT ACTIONS ---
const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required.'),
  description: z.string().min(1, 'Description is required.'),
  startDate: z.string(),
  endDate: z.string(),
  team: z.array(z.string()).min(1, 'At least one team member must be selected.'),
  annex: z.string().min(1, 'Annex is required.'),
  casr: z.string().min(1, 'CASR is required.'),
  tags: z.array(z.string()).optional(),
  isHighPriority: z.boolean().default(false),
});


export async function addRulemakingProject(projectData: unknown) {
  const result = projectSchema.safeParse(projectData);

  if (!result.success) {
    const formattedErrors = result.error.flatten().fieldErrors;
    console.error("Validation failed:", formattedErrors);
    return {
      success: false,
      error: 'Invalid project data.',
      details: formattedErrors,
    };
  }

  try {
    const data = result.data;
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));

    const teamMembers = data.team
      .map(userId => {
          const user = allUsers.find(u => u.id === userId);
          if (!user) {
              console.warn(`User with ID ${userId} not found. Skipping.`);
              return null;
          }
          return {
              id: user.id,
              name: user.name || 'Unknown User',
              role: user.role || 'Functional',
              avatarUrl: user.avatarUrl || ''
          };
      })
      .filter((user): user is User => user !== null);

    if (teamMembers.length === 0) {
      return { success: false, error: "No valid team members found." };
    }
    
    const finalData = {
      name: data.name,
      description: data.description,
      ownerId: teamMembers[0]?.id || 'admin-00', // Default owner
      startDate: data.startDate,
      endDate: data.endDate,
      status: 'On Track' as const,
      team: teamMembers,
      annex: data.annex,
      casr: data.casr,
      tags: data.tags || [],
      projectType: 'Rulemaking' as const,
      tasks: [],
      subProjects: [],
      documents: [],
      notes: '',
      checklist: [],
    };

    const docRef = await addDoc(collection(db, 'rulemakingProjects'), finalData);
    revalidatePath('/rulemaking');
    return { success: true, id: docRef.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown server error occurred';
    console.error("Error adding rulemaking project:", message);
    return { 
        success: false, 
        error: message
    };
  }
}

export async function addTimKerjaProject(projectData: Pick<Project, 'name' | 'description' | 'ownerId' | 'startDate' | 'endDate' | 'status' | 'team' | 'tags'>): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
    try {
      const preparedProjectData = {
        ...projectData,
        projectType: 'Tim Kerja' as const,
        tasks: [],
        subProjects: [],
        documents: [],
        notes: '',
        checklist: [],
        annex: '',
        casr: '',
      };
      
      const docRef = await addDoc(collection(db, 'timKerjaProjects'), preparedProjectData);
      revalidatePath('/dashboard');
      return { success: true, data: { id: docRef.id } };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return { success: false, error: `Failed to add project: ${message}` };
    }
  }
  
export async function deleteAllTimKerjaProjects(): Promise<{ success: boolean, count: number, error?: string }> {
    try {
      const projectsCollection = collection(db, 'timKerjaProjects');
      const projectsSnapshot = await getDocs(projectsCollection);
  
      if (projectsSnapshot.empty) {
        return { success: true, count: 0 };
      }
  
      const batch = writeBatch(db);
      projectsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
  
      revalidatePath('/dashboard');
      return { success: true, count: projectsSnapshot.size };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return { success: false, count: 0, error: `Failed to delete projects: ${message}` };
    }
  }

// --- GAP Analysis Actions ---
export async function addGapAnalysisRecord(recordData: Omit<GapAnalysisFormValues, 'embeddedApplicabilityDate'> & { embeddedApplicabilityDate: string }): Promise<{ success: boolean; data?: GapAnalysisRecord; error?: string }> {
  try {
    const newRecordData = { ...recordData, createdAt: new Date().toISOString() };
    const gapAnalysisCollection = collection(db, 'gapAnalysisRecords');
    const docRef = await addDoc(gapAnalysisCollection, newRecordData);
    revalidatePath('/gap-analysis');
    revalidatePath('/rulemaking');
    const newRecord: GapAnalysisRecord = { id: docRef.id, ...newRecordData };
    return { success: true, data: newRecord };
  } catch (error) {
    console.error('Add GAP Analysis Record Error:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: `Failed to add GAP Analysis record: ${message}` };
  }
}

export async function updateGapAnalysisRecord(recordId: string, recordData: GapAnalysisFormValues): Promise<{ success: boolean; data?: GapAnalysisRecord; error?: string }> {
  try {
    const recordRef = doc(db, 'gapAnalysisRecords', recordId);
    const docSnap = await getDoc(recordRef);
    if (!docSnap.exists()) {
      throw new Error("Record not found");
    }
    const dataToSave = { ...recordData, embeddedApplicabilityDate: recordData.embeddedApplicabilityDate.toISOString().split('T')[0] };
    const updatedData = { ...docSnap.data(), ...dataToSave, id: recordId };
    await setDoc(recordRef, updatedData);
    revalidatePath('/gap-analysis');
    return { success: true, data: updatedData as GapAnalysisRecord };
  } catch (error) {
    console.error('Update GAP Analysis Record Error:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: `Failed to update GAP Analysis record: ${message}` };
  }
}

export async function deleteGapAnalysisRecord(recordId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteDoc(doc(db, 'gapAnalysisRecords', recordId));
    revalidatePath('/gap-analysis');
    revalidatePath('/rulemaking');
    return { success: true };
  } catch (error) {
    console.error('Delete GAP Analysis Record Error:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: `Failed to delete GAP Analysis record: ${message}` };
  }
}

// --- User Management Actions ---
export async function updateUserProfile(userId: string, name: string): Promise<{ success: boolean; error?: string }> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { name });
      revalidatePath('/profile');
      return { success: true };
    } catch (error) {
      console.error('Update User Profile Error:', error);
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return { success: false, error: `Failed to update profile: ${message}` };
    }
}
  
export async function sendPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    try {
        await sendPasswordResetEmail(auth, email);
        return { success: true };
    } catch (error) {
        console.error('Send Password Reset Error:', error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, error: `Failed to send password reset email: ${message}` };
    }
}

export async function updateUserRole(userId: string, newRole: User['role']): Promise<{ success: boolean; error?: string }> {
  try {
    await updateDoc(doc(db, 'users', userId), { role: newRole });
    revalidatePath('/team');
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: `Failed to update user role: ${message}` };
  }
}

export async function updateUserApproval(userId: string, isApproved: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    await updateDoc(doc(db, 'users', userId), { isApproved });
    revalidatePath('/team');
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: `Failed to update approval status: ${message}` };
  }
}

export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteDoc(doc(db, 'users', userId));
    revalidatePath('/team');
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: `Failed to delete user: ${message}` };
  }
}

// --- Generic Document/Task/SubProject Actions ---
async function performUpdate<T>(projectId: string, projectType: Project['projectType'], field: keyof Project, updateFn: (current: T[]) => T[]): Promise<{ success: boolean; error?: string }> {
    try {
        const collectionName = projectType === 'Rulemaking' ? 'rulemakingProjects' : 'timKerjaProjects';
        const projectRef = doc(db, collectionName, projectId);
        const projectSnap = await getDoc(projectRef);

        if (!projectSnap.exists()) {
            throw new Error("Project not found");
        }

        const project = projectSnap.data() as Project;
        const currentItems = (project[field] as T[] | undefined) || [];
        const updatedItems = updateFn(currentItems);

        await updateDoc(projectRef, { [field]: updatedItems });
        revalidatePath(`/projects/${projectId}`);
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error(`Error updating ${field}:`, message);
        return { success: false, error: `Failed to update ${String(field)}: ${message}` };
    }
}

export async function addDocument(projectId: string, documentData: { name: string, url: string }, projectType: Project['projectType']): Promise<{ success: boolean; data?: Document; error?: string }> {
    const getFileType = (fileName: string): Document['type'] => {
        const extension = fileName.split('.').pop()?.toLowerCase();
        if (['pdf'].includes(extension || '')) return 'PDF';
        if (['doc', 'docx'].includes(extension || '')) return 'Word';
        if (['xls', 'xlsx'].includes(extension || '')) return 'Excel';
        if (['png', 'jpg', 'jpeg', 'gif'].includes(extension || '')) return 'Image';
        return 'Other';
    };
    const newDocument: Document = { id: `doc-${Date.now()}`, name: documentData.name, url: documentData.url, type: getFileType(documentData.name), uploadDate: new Date().toISOString() };
    const result = await performUpdate<Document>(projectId, projectType, 'documents', current => [...current, newDocument]);
    return result.success ? { ...result, data: newDocument } : result;
}

export async function deleteDocument(projectId: string, documentId: string, projectType: Project['projectType']): Promise<{ success: boolean; error?: string }> {
    return performUpdate<Document>(projectId, projectType, 'documents', current => current.filter(d => d.id !== documentId));
}

export async function addTask(projectId: string, taskData: Task, projectType: Project['projectType']): Promise<{ success: boolean; error?: string }> {
    return performUpdate<Task>(projectId, projectType, 'tasks', current => [...current, taskData]);
}

export async function updateTask(projectId: string, updatedTask: Task, projectType: Project['projectType']): Promise<{ success: boolean; error?: string }> {
    return performUpdate<Task>(projectId, projectType, 'tasks', current => current.map(t => t.id === updatedTask.id ? updatedTask : t));
}

export async function deleteTask(projectId: string, taskId: string, projectType: Project['projectType']): Promise<{ success: boolean; error?: string }> {
    return performUpdate<Task>(projectId, projectType, 'tasks', current => current.filter(t => t.id !== taskId));
}

export async function addSubProject(projectId: string, subProjectData: SubProject, projectType: Project['projectType']): Promise<{ success: boolean; error?: string }> {
    return performUpdate<SubProject>(projectId, projectType, 'subProjects', current => [...current, subProjectData]);
}

export async function updateSubProject(projectId: string, updatedSubProject: SubProject, projectType: Project['projectType']): Promise<{ success: boolean; error?: string }> {
    return performUpdate<SubProject>(projectId, projectType, 'subProjects', current => current.map(sp => sp.id === updatedSubProject.id ? updatedSubProject : sp));
}

export async function deleteProject(projectId: string, projectType: Project['projectType']): Promise<{ success: boolean; error?: string }> {
    try {
        const collectionName = projectType === 'Rulemaking' ? 'rulemakingProjects' : 'timKerjaProjects';
        await deleteDoc(doc(db, collectionName, projectId));
        revalidatePath('/dashboard');
        revalidatePath('/rulemaking');
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, error: `Failed to delete project: ${message}` };
    }
}

// --- GLOSSARY ACTIONS ---
export async function addGlossaryRecord(data: GlossaryFormValues) {
    const parsed = glossaryFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: 'Invalid data provided.', details: parsed.error.flatten().fieldErrors };
    }

    try {
        const docRef = await addDoc(collection(db, 'glossaryRecords'), {
            ...parsed.data,
            createdAt: new Date().toISOString()
        });
        const newRecord: GlossaryRecord = { id: docRef.id, ...parsed.data, createdAt: new Date().toISOString() };
        revalidatePath('/glossary');
        return { success: true, data: newRecord };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function updateGlossaryRecord(id: string, data: GlossaryFormValues) {
    const parsed = glossaryFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: 'Invalid data provided.', details: parsed.error.flatten().fieldErrors };
    }
    
    try {
        const recordRef = doc(db, 'glossaryRecords', id);
        const docSnap = await getDoc(recordRef);
        if (!docSnap.exists()) {
          throw new Error("Record not found");
        }
        
        const updatedData = { ...docSnap.data(), ...parsed.data, id };

        await setDoc(recordRef, updatedData);
        revalidatePath('/glossary');
        
        return { success: true, data: updatedData as GlossaryRecord };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function deleteGlossaryRecord(id: string) {
    try {
        await deleteDoc(doc(db, 'glossaryRecords', id));
        revalidatePath('/glossary');
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

    
