

'use server';

import { z } from 'zod';
import { db, auth } from './firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, arrayUnion, arrayRemove, writeBatch, getDocs, query, where } from 'firebase/firestore';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import type { CcefodRecord, Document as ProjectDocument, Project, SubProject, Task, User, PqRecord, GapAnalysisRecord, GlossaryRecord } from './types';
import { ccefodFormSchema, pqFormSchema, gapAnalysisFormSchema, glossaryFormSchema } from './schemas';
import { sendPasswordResetEmail } from 'firebase/auth';

const window = new JSDOM('').window;
const purify = DOMPurify(window as any);


// --- CCEFOD ACTIONS ---
export async function addCcefodRecord(data: unknown) {
    const parsed = ccefodFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: parsed.error.flatten().fieldErrors };
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

export async function importCcefodRecords(data: unknown[]) {
    const records = z.array(ccefodFormSchema).safeParse(data);
    if (!records.success) {
        return { success: false, error: 'Invalid data format.' };
    }

    const batch = writeBatch(db);
    records.data.forEach(record => {
        const sanitizedStandardPractice = purify.sanitize(record.standardPractice);
        const docRef = doc(collection(db, 'ccefodRecords'));
        batch.set(docRef, {
            ...record,
            standardPractice: sanitizedStandardPractice,
            createdAt: serverTimestamp(),
        });
    });

    try {
        await batch.commit();
        return { success: true, count: records.data.length };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Batch import failed.' };
    }
}


export async function updateCcefodRecord(id: string, data: unknown) {
    const parsed = ccefodFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: parsed.error.flatten().fieldErrors };
    }
    
    const sanitizedStandardPractice = purify.sanitize(parsed.data.standardPractice);
    const updatedRecordData = {
        ...parsed.data,
        standardPractice: sanitizedStandardPractice,
    };

    try {
        const docRef = doc(db, 'ccefodRecords', id);
        await updateDoc(docRef, updatedRecordData);
        return { success: true, data: { id, ...updatedRecordData, createdAt: new Date().toISOString() } };
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
export async function addPqRecord(data: unknown) {
    const parsed = pqFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: parsed.error.flatten().fieldErrors };
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

export async function updatePqRecord(id: string, data: unknown) {
    const parsed = pqFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: parsed.error.flatten().fieldErrors };
    }

    const updatedRecordData = { ...parsed.data };
    try {
        const docRef = doc(db, 'pqsRecords', id);
        await updateDoc(docRef, updatedRecordData);
        return { success: true, data: { id, ...updatedRecordData, createdAt: new Date().toISOString() } };
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

export async function importPqRecords(data: unknown[]) {
    const records = z.array(pqFormSchema).safeParse(data);
    if (!records.success) {
        return { success: false, error: 'Invalid data format.' };
    }

    const batch = writeBatch(db);
    records.data.forEach(record => {
        const docRef = doc(collection(db, 'pqsRecords'));
        batch.set(docRef, { ...record, createdAt: serverTimestamp() });
    });

    try {
        await batch.commit();
        return { success: true, count: records.data.length };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Batch import failed.' };
    }
}


// --- GAP ANALYSIS ACTIONS ---
export async function addGapAnalysisRecord(data: unknown) {
    const parsed = gapAnalysisFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: parsed.error.flatten().fieldErrors };
    }

    try {
        const docRef = await addDoc(collection(db, 'gapAnalysisRecords'), {
            ...parsed.data,
            createdAt: serverTimestamp(),
        });
        const newRecord: GapAnalysisRecord = {
            id: docRef.id,
            ...parsed.data,
            createdAt: new Date().toISOString()
        };
        return { success: true, data: newRecord };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function updateGapAnalysisRecord(id: string, data: unknown) {
    const parsed = gapAnalysisFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: parsed.error.flatten().fieldErrors };
    }
    const updatedRecordData = { ...parsed.data };
    try {
        const docRef = doc(db, 'gapAnalysisRecords', id);
        await updateDoc(docRef, updatedRecordData as any);
        return { success: true, data: { id, ...updatedRecordData, createdAt: new Date().toISOString() } as GapAnalysisRecord };
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
export async function addGlossaryRecord(data: unknown) {
    const parsed = glossaryFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: parsed.error.flatten().fieldErrors };
    }

    try {
        const docRef = await addDoc(collection(db, 'glossaryRecords'), {
            ...parsed.data,
            createdAt: serverTimestamp(),
        });
        const newRecord: GlossaryRecord = {
            id: docRef.id,
            ...parsed.data,
            createdAt: new Date().toISOString()
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
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function updateUserApproval(userId: string, isApproved: boolean) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { isApproved });
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to update approval status.' };
    }
}


export async function deleteUser(userId: string) {
    try {
        // This action should be more robust in a real app,
        // handling cleanup of user-related data, but for now, it just deletes the user doc.
        await deleteDoc(doc(db, 'users', userId));
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
        return { success: false, error: error instanceof Error ? error.message : 'Failed to update profile.' };
    }
}

export async function sendPasswordReset(email: string) {
    try {
        await sendPasswordResetEmail(auth, email);
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to send password reset email.' };
    }
}


// --- PROJECT ACTIONS ---
export async function addRulemakingProject(projectData: unknown) {
  const projectSchema = z.object({
      name: z.string().min(1, 'Project name is required.'),
      description: z.string().min(1, 'Description is required.'),
      startDate: z.string(),
      endDate: z.string(),
      team: z.array(z.string()),
      annex: z.string().min(1, 'Annex is required.'),
      casr: z.string().min(1, 'CASR is required.'),
      tags: z.array(z.string()).optional(),
  });
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
      status: 'On Track',
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

export async function addTimKerjaProject(projectData: unknown) {
    const timKerjaProjectSchema = z.object({
        name: z.string().min(1, 'Project name is required.'),
        description: z.string().min(1, 'Description is required.'),
        ownerId: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        status: z.enum(['On Track', 'Off Track', 'At Risk', 'Completed']),
        team: z.array(z.any()),
        tags: z.array(z.string()).optional(),
    });
    const parsed = timKerjaProjectSchema.safeParse(projectData);
  
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors.map(e => e.message).join(', '),
      };
    }
  
    try {
      const docRef = await addDoc(collection(db, 'timKerjaProjects'), {
        ...parsed.data,
        projectType: 'Tim Kerja',
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

export async function updateProject(projectId: string, projectType: Project['projectType'], projectData: Partial<Project>) {
    const collectionName = projectType === 'Rulemaking' ? 'rulemakingProjects' : 'timKerjaProjects';
    try {
        const projectRef = doc(db, collectionName, projectId);
        await updateDoc(projectRef, projectData);
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to update project.' };
    }
}

export async function deleteProject(projectId: string, projectType: Project['projectType']) {
  const collectionName = projectType === 'Rulemaking' ? 'rulemakingProjects' : 'timKerjaProjects';
  try {
    await deleteDoc(doc(db, collectionName, projectId));
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to delete project.' };
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
      return { success: false, error: 'Failed to add task.' };
    }
}

export async function updateTask(projectId: string, updatedTask: Task, projectType: Project['projectType']) {
    const collectionName = projectType === 'Rulemaking' ? 'rulemakingProjects' : 'timKerjaProjects';
    const projectRef = doc(db, collectionName, projectId);

    const batch = writeBatch(db);
    // Remove the old task first
    batch.update(projectRef, { tasks: arrayRemove({ id: updatedTask.id }) });
    // This is a placeholder; in a real scenario you'd query the exact task to remove.
    // Firestore's arrayRemove is limited, so for a robust solution, one would fetch the project,
    // modify the tasks array in code, and then update the entire array.
    // For this app's purpose, we'll assume a simpler (less safe) remove-and-add.
    // A better way: fetch, filter, add, and then update the whole array.
    
    // Then add the updated task
    batch.update(projectRef, { tasks: arrayUnion(updatedTask) });

    try {
        // This is a simplified approach. A more robust way would be to fetch the doc,
        // find and replace the task in the array, then update the whole array.
        // For now, let's try a direct update with a new array.
        const { getDoc } = await import('firebase/firestore');
        const projectSnap = await getDoc(projectRef);
        if (projectSnap.exists()) {
            const projectData = projectSnap.data() as Project;
            const tasks = projectData.tasks || [];
            const newTasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
            await updateDoc(projectRef, { tasks: newTasks });
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to update task.' };
    }
}

export async function deleteTask(projectId: string, taskId: string, projectType: Project['projectType']) {
    const collectionName = projectType === 'Rulemaking' ? 'rulemakingProjects' : 'timKerjaProjects';
    const projectRef = doc(db, collectionName, projectId);
    try {
        const { getDoc } = await import('firebase/firestore');
        const projectSnap = await getDoc(projectRef);
        if (projectSnap.exists()) {
            const projectData = projectSnap.data() as Project;
            const tasks = projectData.tasks || [];
            const newTasks = tasks.filter(t => t.id !== taskId);
            await updateDoc(projectRef, { tasks: newTasks });
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to delete task.' };
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
    const { getDoc } = await import('firebase/firestore');
    const projectSnap = await getDoc(projectRef);
    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project;
      const documents = projectData.documents || [];
      const newDocuments = documents.filter(doc => doc.id !== documentId);
      await updateDoc(projectRef, { documents: newDocuments });
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to delete document.' };
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
    return { success: false, error: 'Failed to add sub-project.' };
  }
}

export async function updateSubProject(projectId: string, updatedSubProject: SubProject, projectType: Project['projectType']) {
    const collectionName = projectType === 'Rulemaking' ? 'rulemakingProjects' : 'timKerjaProjects';
    const projectRef = doc(db, collectionName, projectId);
    try {
        const { getDoc } = await import('firebase/firestore');
        const projectSnap = await getDoc(projectRef);
        if (projectSnap.exists()) {
            const projectData = projectSnap.data() as Project;
            const subProjects = projectData.subProjects || [];
            const newSubProjects = subProjects.map(sub => sub.id === updatedSubProject.id ? updatedSubProject : sub);
            await updateDoc(projectRef, { subProjects: newSubProjects });
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to update sub-project.' };
    }
}

export async function updateProjectChecklist(projectId: string, checklist: ChecklistItem[], projectType: Project['projectType']) {
  const collectionName = projectType === 'Rulemaking' ? 'rulemakingProjects' : 'timKerjaProjects';
  const projectRef = doc(db, collectionName, projectId);
  try {
    await updateDoc(projectRef, { checklist });
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to update checklist.' };
  }
}

export async function deleteAllTimKerjaProjects() {
    const projectsRef = collection(db, 'timKerjaProjects');
    try {
        const querySnapshot = await getDocs(projectsRef);
        const batch = writeBatch(db);
        querySnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        return { success: true, count: querySnapshot.size };
    } catch (error) {
        return { success: false, error: 'Failed to delete all Tim Kerja projects.' };
    }
}

// --- AI ACTIONS ---
import { summarizeProjectStatus } from '@/ai/flows/summarize-project-status';
import { generateChecklist } from '@/ai/flows/generate-checklist';

export async function getAiSummary(input: { taskCompletion: string, notes: string }) {
  try {
    const result = await summarizeProjectStatus(input);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: 'Failed to generate AI summary.' };
  }
}

export async function generateAiChecklist(input: { projectName: string, projectDescription: string }) {
  try {
    const result = await generateChecklist(input);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: 'Failed to generate AI checklist.' };
  }
}
