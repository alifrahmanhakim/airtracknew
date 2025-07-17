
'use server';

import { z } from 'zod';
import { db, auth } from './firebase';
import { collection, getDocs, query, where, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, arrayUnion, writeBatch, getDoc } from 'firebase/firestore';
import { sendPasswordResetEmail, deleteUser as deleteFirebaseAuthUser } from "firebase/auth";

import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import type { CcefodRecord, Document as ProjectDocument, Project, SubProject, Task, User, PqRecord, GapAnalysisRecord, GlossaryRecord } from './types';
import { ccefodFormSchema, gapAnalysisFormSchema, glossaryFormSchema, pqFormSchema } from './schemas';

const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

const projectSchema = z.object({
    name: z.string().min(1, 'Project name is required.'),
    description: z.string().min(1, 'Description is required.'),
    ownerId: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    status: z.enum(['On Track', 'Off Track', 'At Risk', 'Completed']),
    team: z.array(z.any()),
    annex: z.string().min(1, 'Annex is required.'),
    casr: z.string().min(1, 'CASR is required.'),
    tags: z.array(z.string()).optional(),
});


// --- CCEFOD ACTIONS ---
export async function addCcefodRecord(data: z.infer<typeof ccefodFormSchema>) {
    const parsed = ccefodFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: "Invalid data provided." };
    }

    const sanitizedStandardPractice = purify.sanitize(parsed.data.standardPractice);

    try {
        const docRef = await addDoc(collection(db, 'ccefodRecords'), {
            ...parsed.data,
            standardPractice: sanitizedStandardPractice,
            createdAt: serverTimestamp(),
        });
        const newRecord: CcefodRecord = {
            id: docRef.id,
            ...parsed.data,
            standardPractice: sanitizedStandardPractice,
            createdAt: new Date().toISOString()
        };
        return { success: true, data: newRecord };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function importCcefodRecords(records: z.infer<typeof ccefodFormSchema>[]) {
    const batch = writeBatch(db);
    let count = 0;

    for (const recordData of records) {
        const parsed = ccefodFormSchema.safeParse(recordData);
        if (parsed.success) {
            const sanitizedStandardPractice = purify.sanitize(parsed.data.standardPractice);
            const docRef = doc(collection(db, 'ccefodRecords'));
            batch.set(docRef, {
                ...parsed.data,
                standardPractice: sanitizedStandardPractice,
                createdAt: serverTimestamp(),
            });
            count++;
        } else {
            // Optionally log errors for individual records
            console.warn("Skipping invalid record during import:", parsed.error.flatten().fieldErrors);
        }
    }

    try {
        await batch.commit();
        return { success: true, count };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred during batch import' };
    }
}


export async function updateCcefodRecord(id: string, data: z.infer<typeof ccefodFormSchema>) {
    const parsed = ccefodFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: "Invalid data provided." };
    }
    
    const sanitizedStandardPractice = purify.sanitize(parsed.data.standardPractice);

    try {
        const docRef = doc(db, 'ccefodRecords', id);
        await updateDoc(docRef, {
             ...parsed.data,
             standardPractice: sanitizedStandardPractice,
        });
        const updatedRecord: CcefodRecord = {
            id,
            ...parsed.data,
            standardPractice: sanitizedStandardPractice,
            createdAt: new Date().toISOString() // This might not be accurate, but it's a placeholder
        };
        return { success: true, data: updatedRecord };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function deleteCcefodRecord(id: string) {
    try {
        await deleteDoc(doc(db, 'ccefodRecords', id));
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}


// --- PQS ACTIONS ---
export async function addPqRecord(data: z.infer<typeof pqFormSchema>) {
    const parsed = pqFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: "Invalid data provided." };
    }
    try {
        const docRef = await addDoc(collection(db, 'pqsRecords'), {
            ...parsed.data,
            createdAt: serverTimestamp(),
        });
        const newRecord: PqRecord = {
            id: docRef.id,
            ...parsed.data,
            createdAt: new Date().toISOString()
        };
        return { success: true, data: newRecord };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function updatePqRecord(id: string, data: z.infer<typeof pqFormSchema>) {
    const parsed = pqFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: "Invalid data provided." };
    }
    try {
        const docRef = doc(db, 'pqsRecords', id);
        await updateDoc(docRef, parsed.data);
        const updatedRecord: PqRecord = {
            id,
            ...parsed.data,
            createdAt: new Date().toISOString()
        };
        return { success: true, data: updatedRecord };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function deletePqRecord(id: string) {
    try {
        await deleteDoc(doc(db, 'pqsRecords', id));
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function importPqRecords(records: z.infer<typeof pqFormSchema>[]) {
    const batch = writeBatch(db);
    let count = 0;
    for (const recordData of records) {
        const parsed = pqFormSchema.safeParse(recordData);
        if (parsed.success) {
            const docRef = doc(collection(db, 'pqsRecords'));
            batch.set(docRef, { ...parsed.data, createdAt: serverTimestamp() });
            count++;
        } else {
            console.warn("Skipping invalid PQ record during import:", parsed.error.flatten().fieldErrors);
        }
    }
    try {
        await batch.commit();
        return { success: true, count };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred during batch import' };
    }
}

// --- GAP ANALYSIS ACTIONS ---
export async function addGapAnalysisRecord(data: z.infer<typeof gapAnalysisFormSchema>) {
    const parsed = gapAnalysisFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: "Invalid data provided." };
    }
    try {
        const docRef = await addDoc(collection(db, 'gapAnalysisRecords'), {
            ...parsed.data,
            createdAt: serverTimestamp(),
        });
        const newRecord: GapAnalysisRecord = {
            id: docRef.id,
            ...parsed.data,
            embeddedApplicabilityDate: parsed.data.embeddedApplicabilityDate.toISOString(),
            createdAt: new Date().toISOString(),
        };
        return { success: true, data: newRecord };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function updateGapAnalysisRecord(id: string, data: z.infer<typeof gapAnalysisFormSchema>) {
    const parsed = gapAnalysisFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: "Invalid data provided." };
    }
    try {
        const docRef = doc(db, 'gapAnalysisRecords', id);
        await updateDoc(docRef, {
            ...parsed.data,
            embeddedApplicabilityDate: parsed.data.embeddedApplicabilityDate,
        });
        const updatedRecord: GapAnalysisRecord = {
            id,
            ...parsed.data,
            embeddedApplicabilityDate: parsed.data.embeddedApplicabilityDate.toISOString(),
            createdAt: new Date().toISOString() // This is not ideal, but necessary for the type
        };
        return { success: true, data: updatedRecord };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}


export async function deleteGapAnalysisRecord(id: string) {
    try {
        await deleteDoc(doc(db, 'gapAnalysisRecords', id));
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}


// --- GLOSSARY ACTIONS ---
export async function addGlossaryRecord(data: z.infer<typeof glossaryFormSchema>) {
    const parsed = glossaryFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: "Invalid data provided." };
    }
    try {
        const docRef = await addDoc(collection(db, 'glossaryRecords'), {
            ...parsed.data,
            createdAt: serverTimestamp(),
        });
        const newRecord: GlossaryRecord = {
            id: docRef.id,
            ...parsed.data,
            createdAt: new Date().toISOString(),
        };
        return { success: true, data: newRecord };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function deleteGlossaryRecord(id: string) {
    try {
        await deleteDoc(doc(db, 'glossaryRecords', id));
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}


// --- USER ACTIONS ---
export async function updateUserRole(userId: string, role: User['role']) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { role });
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to update user role.' };
    }
}

export async function updateUserApproval(userId: string, isApproved: boolean) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { isApproved });
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to update user approval status.' };
    }
}

export async function deleteUser(userId: string) {
    try {
        // This action should be protected and only callable by an admin.
        // The Firebase auth user might need to be deleted separately in a more secure environment.
        await deleteDoc(doc(db, 'users', userId));
        // We cannot delete the Firebase Auth user from a client-side server action easily.
        // This requires admin privileges. For now, we only delete the Firestore record.
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to delete user.' };
    }
}

export async function updateUserProfile(userId: string, name: string) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { name });
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to update profile.' };
  }
}

export async function sendPasswordReset(email: string) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
        // Handle specific auth errors if needed
        if (error.message.includes('auth/user-not-found')) {
            return { success: false, error: 'No user found with this email address.' };
        }
    }
    return { success: false, error: 'Failed to send password reset email.' };
  }
}


// --- PROJECT ACTIONS ---
export async function addRulemakingProject(projectData: unknown) {
  const parsed = projectSchema.safeParse(projectData);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map(e => e.message).join(', '),
    };
  }

  try {
    const docRef = await addDoc(collection(db, 'rulemakingProjects'), {
      ...parsed.data,
      projectType: 'Rulemaking',
      tasks: [],
      documents: [],
      subProjects: [],
      notes: '',
      checklist: [],
      createdAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
    };
  }
}


export async function addTimKerjaProject(projectData: Omit<Project, 'id' | 'projectType' | 'tasks' | 'documents' | 'subProjects' | 'notes' | 'checklist'>) {
    try {
        const docRef = await addDoc(collection(db, 'timKerjaProjects'), {
            ...projectData,
            projectType: 'Tim Kerja',
            tasks: [],
            documents: [],
            subProjects: [],
            notes: '',
            checklist: [],
            createdAt: serverTimestamp(),
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function deleteAllTimKerjaProjects() {
    try {
        const q = query(collection(db, 'timKerjaProjects'));
        const querySnapshot = await getDocs(q);
        const batch = writeBatch(db);
        let count = 0;
        querySnapshot.forEach((doc) => {
            batch.delete(doc.ref);
            count++;
        });
        await batch.commit();
        return { success: true, count };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function updateProject(projectId: string, projectType: Project['projectType'], projectData: Partial<Omit<Project, 'id'>>) {
    const collectionName = projectType === 'Rulemaking' ? 'rulemakingProjects' : 'timKerjaProjects';
    try {
        const projectRef = doc(db, collectionName, projectId);
        await updateDoc(projectRef, projectData);
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function deleteProject(projectId: string, projectType: Project['projectType']) {
  const collectionName = projectType === 'Rulemaking' ? 'rulemakingProjects' : 'timKerjaProjects';
  try {
    const projectRef = doc(db, collectionName, projectId);
    await deleteDoc(projectRef);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
}

export async function addDocument(projectId: string, documentData: { name: string; url: string; }, projectType: Project['projectType']) {
    const collectionName = projectType === 'Rulemaking' ? 'rulemakingProjects' : 'timKerjaProjects';
    const projectRef = doc(db, collectionName, projectId);
    
    const getFileExtension = (url: string) => {
      try {
        const pathname = new URL(url).pathname;
        const extension = pathname.split('.').pop()?.toLowerCase();
        return extension;
      } catch (e) {
        return 'other';
      }
    };
  
    const determineFileType = (url: string): ProjectDocument['type'] => {
      const extension = getFileExtension(url);
      if (!extension) return 'Other';
  
      if (extension === 'pdf') return 'PDF';
      if (['doc', 'docx'].includes(extension)) return 'Word';
      if (['xls', 'xlsx', 'csv'].includes(extension)) return 'Excel';
      if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(extension)) return 'Image';
      
      return 'Other';
    }
  
    const newDocument: ProjectDocument = {
      id: `doc-${Date.now()}`,
      name: documentData.name,
      url: documentData.url,
      type: determineFileType(documentData.url),
      uploadDate: new Date().toISOString(),
    };
  
    try {
      await updateDoc(projectRef, {
        documents: arrayUnion(newDocument)
      });
      return { success: true, data: newDocument };
    } catch (error) {
      return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to add document link.' 
      };
    }
}

export async function deleteDocument(projectId: string, documentId: string, projectType: Project['projectType']) {
    const collectionName = projectType === 'Rulemaking' ? 'rulemakingProjects' : 'timKerjaProjects';
    const projectRef = doc(db, collectionName, projectId);
    try {
        const projectSnap = await getDoc(projectRef);
        if (projectSnap.exists()) {
            const projectData = projectSnap.data() as Project;
            const updatedDocuments = projectData.documents.filter(doc => doc.id !== documentId);
            await updateDoc(projectRef, { documents: updatedDocuments });
            return { success: true };
        }
        return { success: false, error: "Project not found." };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to delete document.' };
    }
}

export async function addSubProject(projectId: string, subProjectData: SubProject, projectType: Project['projectType']) {
    const collectionName = projectType === 'Rulemaking' ? 'rulemakingProjects' : 'timKerjaProjects';
    const projectRef = doc(db, collectionName, projectId);

    try {
      await updateDoc(projectRef, {
        subProjects: arrayUnion(subProjectData)
      });
      return { success: true };
    } catch (error) {
      return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to add sub-project.' 
      };
    }
}


export async function updateSubProject(projectId: string, subProject: SubProject, projectType: Project['projectType']) {
    const collectionName = projectType === 'Rulemaking' ? 'rulemakingProjects' : 'timKerjaProjects';
    const projectRef = doc(db, collectionName, projectId);
    try {
        const projectSnap = await getDoc(projectRef);
        if (projectSnap.exists()) {
            const projectData = projectSnap.data() as Project;
            const updatedSubProjects = projectData.subProjects.map(sp => sp.id === subProject.id ? subProject : sp);
            await updateDoc(projectRef, { subProjects: updatedSubProjects });
            return { success: true };
        }
        return { success: false, error: 'Project not found' };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to update sub-project.' };
    }
}

export async function addTask(projectId: string, task: Task, projectType: Project['projectType']) {
    const collectionName = projectType === 'Rulemaking' ? 'rulemakingProjects' : 'timKerjaProjects';
    const projectRef = doc(db, collectionName, projectId);

    try {
        await updateDoc(projectRef, {
            tasks: arrayUnion(task)
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to add task.' };
    }
}

export async function updateTask(projectId: string, task: Task, projectType: Project['projectType']) {
    const collectionName = projectType === 'Rulemaking' ? 'rulemakingProjects' : 'timKerjaProjects';
    const projectRef = doc(db, collectionName, projectId);
    try {
        const projectSnap = await getDoc(projectRef);
        if (projectSnap.exists()) {
            const projectData = projectSnap.data() as Project;
            const updatedTasks = projectData.tasks.map(t => t.id === task.id ? task : t);
            await updateDoc(projectRef, { tasks: updatedTasks });
            return { success: true };
        }
        return { success: false, error: 'Project not found' };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to update task.' };
    }
}

export async function deleteTask(projectId: string, taskId: string, projectType: Project['projectType']) {
    const collectionName = projectType === 'Rulemaking' ? 'rulemakingProjects' : 'timKerjaProjects';
    const projectRef = doc(db, collectionName, projectId);
    try {
        const projectSnap = await getDoc(projectRef);
        if (projectSnap.exists()) {
            const projectData = projectSnap.data() as Project;
            const updatedTasks = projectData.tasks.filter(t => t.id !== taskId);
            await updateDoc(projectRef, { tasks: updatedTasks });
            return { success: true };
        }
        return { success: false, error: 'Project not found' };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to delete task.' };
    }
}

export async function updateProjectChecklist(projectId: string, checklist: any[], projectType: Project['projectType']) {
    const collectionName = projectType === 'Rulemaking' ? 'rulemakingProjects' : 'timKerjaProjects';
    try {
        const projectRef = doc(db, collectionName, projectId);
        await updateDoc(projectRef, { checklist });
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to update checklist.' };
    }
}


// --- AI ACTIONS ---
import { summarizeProjectStatus, type SummarizeProjectStatusInput } from '@/ai/flows/summarize-project-status';
import { generateChecklist, type GenerateChecklistInput } from '@/ai/flows/generate-checklist';


export async function getAiSummary(input: SummarizeProjectStatusInput) {
  try {
    const summary = await summarizeProjectStatus(input);
    return { success: true, data: summary };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'An unknown AI error occurred' };
  }
}

export async function generateAiChecklist(input: GenerateChecklistInput) {
  try {
    const checklist = await generateChecklist(input);
    return checklist;
  } catch (error) {
    console.error("AI Checklist generation failed:", error);
    return null;
  }
}
