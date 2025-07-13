
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
import type { Document, Project, SubProject, Task, User, CcefodRecord, PqRecord, ChecklistItem } from './types';
import { formSchema as ccefodFormSchema, type CcefodFormValues } from '@/components/ccefod-shared-form-fields';
import { formSchema as pqFormSchema, type PqFormValues } from '@/components/pqs-shared-form-fields';
import { db } from './firebase';
import { doc, updateDoc, arrayUnion, collection, addDoc, getDoc, deleteDoc, setDoc, writeBatch, getDocs } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

// This is the new wrapper function for the AI flow.
export async function generateChecklist(
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

export async function addDocument(
  projectId: string,
  documentData: { name: string, url: string },
  projectType: Project['projectType']
): Promise<{ success: boolean; data?: Document; error?: string }> {
  try {
    const getFileType = (fileName: string): Document['type'] => {
      const extension = fileName.split('.').pop()?.toLowerCase();
      if (['pdf'].includes(extension || '')) return 'PDF';
      if (['doc', 'docx'].includes(extension || '')) return 'Word';
      if (['xls', 'xlsx'].includes(extension || '')) return 'Excel';
      if (['png', 'jpg', 'jpeg', 'gif'].includes(extension || '')) return 'Image';
      return 'Other';
    };

    const newDocument: Document = {
      id: `doc-${Date.now()}`,
      name: documentData.name,
      url: documentData.url,
      type: getFileType(documentData.name),
      uploadDate: new Date().toISOString(),
    };

    const collectionName = projectType === 'Rulemaking' ? 'rulemakingProjects' : 'timKerjaProjects';
    const projectRef = doc(db, collectionName, projectId);
    await updateDoc(projectRef, {
      documents: arrayUnion(newDocument)
    });

    revalidatePath(`/projects/${projectId}`);

    return { success: true, data: newDocument };
  } catch (error) {
    console.error('Add Document Error:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return {
      success: false,
      error: `Failed to add document: ${message}`,
    };
  }
}

export async function deleteDocument(
    projectId: string,
    documentId: string,
    projectType: Project['projectType']
): Promise<{ success: boolean; error?: string }> {
    try {
        const collectionName = projectType === 'Rulemaking' ? 'rulemakingProjects' : 'timKerjaProjects';
        const projectRef = doc(db, collectionName, projectId);
        const projectSnap = await getDoc(projectRef);
        if (projectSnap.exists()) {
            const project = projectSnap.data() as Project;
            const documents = project.documents.filter(d => d.id !== documentId);
            await updateDoc(projectRef, { documents });
            revalidatePath(`/projects/${projectId}`);
            return { success: true };
        } else {
            throw new Error("Project not found");
        }
    } catch (error) {
        console.error('Delete Document Error:', error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, error: `Failed to delete document: ${message}` };
    }
}


export async function addTimKerjaProject(
  projectData: Pick<Project, 'name' | 'description' | 'ownerId' | 'startDate' | 'endDate' | 'status' | 'team' | 'tags'>
): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
  try {
    const preparedProjectData = {
      name: projectData.name,
      description: projectData.description,
      ownerId: projectData.ownerId,
      startDate: projectData.startDate,
      endDate: projectData.endDate,
      status: projectData.status,
      team: projectData.team.map(member => ({
        id: member.id,
        name: member.name || "Unnamed User",
        role: member.role || "Functional",
        avatarUrl: member.avatarUrl || "https://placehold.co/100x100.png",
      })),
      tags: projectData.tags || [],
      // Explicitly add default empty values for fields not in the form
      projectType: 'Tim Kerja' as const,
      tasks: [],
      subProjects: [],
      documents: [],
      notes: '',
      checklist: [],
      complianceData: [],
      adoptionData: [],
      annex: '',
      casr: '',
    };
    
    const docRef = await addDoc(collection(db, 'timKerjaProjects'), preparedProjectData);
    revalidatePath('/dashboard');
    return { success: true, data: { id: docRef.id } };
  } catch (error) {
    console.error('Add Tim Kerja Project Error:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: `Failed to add project: ${message}` };
  }
}

export async function addRulemakingProject(
  projectData: Pick<Project, 'name' | 'description' | 'ownerId' | 'startDate' | 'endDate' | 'status' | 'team' | 'tags' | 'annex' | 'casr'>
): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
  try {
    const preparedProjectData = {
      name: projectData.name,
      description: projectData.description,
      ownerId: projectData.ownerId,
      startDate: projectData.startDate,
      endDate: projectData.endDate,
      status: projectData.status,
      annex: projectData.annex || '',
      casr: projectData.casr || '',
      team: projectData.team.map(member => ({
        id: member.id,
        name: member.name || "Unnamed User",
        role: member.role || "Functional",
        avatarUrl: member.avatarUrl || "https://placehold.co/100x100.png",
      })),
      tags: projectData.tags || [],
      // Explicitly add default empty values for fields not in the form
      projectType: 'Rulemaking' as const,
      tasks: [],
      subProjects: [],
      documents: [],
      notes: '',
      complianceData: [],
      adoptionData: [],
      checklist: [],
    };
    
    const docRef = await addDoc(collection(db, 'rulemakingProjects'), preparedProjectData);
    revalidatePath('/rulemaking');
    return { success: true, data: { id: docRef.id } };
  } catch (error) {
    console.error('Add Rulemaking Project Error:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: `Failed to add project: ${message}` };
  }
}

export async function updateProject(
    projectId: string,
    projectType: Project['projectType'],
    projectData: Partial<Omit<Project, 'id'>>
): Promise<{ success: boolean; error?: string }> {
    try {
        const collectionName = projectType === 'Rulemaking' ? 'rulemakingProjects' : 'timKerjaProjects';
        const projectRef = doc(db, collectionName, projectId);
        
        const updateData: { [key: string]: any } = { ...projectData };

        if (projectData.team) {
            updateData.team = projectData.team.map(member => ({
                id: member.id,
                name: member.name || 'Unnamed User',
                role: member.role || 'Functional',
                avatarUrl: member.avatarUrl || `https://placehold.co/100x100.png`,
            }));
        }
        
        await updateDoc(projectRef, updateData);
        revalidatePath(`/projects/${projectId}?type=${projectType.toLowerCase().replace(' ', '')}`);
        revalidatePath('/dashboard');
        revalidatePath('/rulemaking');
        return { success: true };
    } catch (error) {
        console.error('Update Project Error:', error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, error: `Failed to update project: ${message}` };
    }
}

export async function deleteProject(
    projectId: string,
    projectType: Project['projectType']
): Promise<{ success: boolean; error?: string }> {
    try {
        const collectionName = projectType === 'Rulemaking' ? 'rulemakingProjects' : 'timKerjaProjects';
        const docRef = doc(db, collectionName, projectId);
        await deleteDoc(docRef);

        revalidatePath('/dashboard');
        revalidatePath('/rulemaking');
        revalidatePath('/projects');
        return { success: true };
    } catch (error) {
        console.error('Delete Project Error:', error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, error: `Failed to delete project: ${message}` };
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
    projectsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    revalidatePath('/dashboard');
    return { success: true, count: projectsSnapshot.size };
  } catch (error) {
    console.error('Delete All Tim Kerja Projects Error:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, count: 0, error: `Failed to delete projects: ${message}` };
  }
}


export async function addTask(
    projectId: string,
    taskData: Task,
    projectType: 'Rulemaking' | 'Tim Kerja'
): Promise<{ success: boolean; error?: string }> {
    try {
        const collectionName = projectType === 'Rulemaking' ? 'rulemakingProjects' : 'timKerjaProjects';
        const projectRef = doc(db, collectionName, projectId);
        await updateDoc(projectRef, {
            tasks: arrayUnion(taskData)
        });
        revalidatePath(`/projects/${projectId}`);
        return { success: true };
    } catch (error) {
        console.error('Add Task Error:', error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, error: `Failed to add task: ${message}` };
    }
}

export async function updateTask(
    projectId: string,
    updatedTask: Task,
    projectType: 'Rulemaking' | 'Tim Kerja'
): Promise<{ success: boolean; error?: string }> {
    try {
        const collectionName = projectType === 'Rulemaking' ? 'rulemakingProjects' : 'timKerjaProjects';
        const projectRef = doc(db, collectionName, projectId);
        const projectSnap = await getDoc(projectRef);
        if (projectSnap.exists()) {
            const project = projectSnap.data() as Project;
            const tasks = project.tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
            await updateDoc(projectRef, { tasks });
            revalidatePath(`/projects/${projectId}`);
            return { success: true };
        } else {
            throw new Error("Project not found");
        }
    } catch (error) {
        console.error('Update Task Error:', error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, error: `Failed to update task: ${message}` };
    }
}

export async function deleteTask(
    projectId: string,
    taskId: string,
    projectType: 'Rulemaking' | 'Tim Kerja'
): Promise<{ success: boolean; error?: string }> {
    try {
        const collectionName = projectType === 'Rulemaking' ? 'rulemakingProjects' : 'timKerjaProjects';
        const projectRef = doc(db, collectionName, projectId);
        const projectSnap = await getDoc(projectRef);
        if (projectSnap.exists()) {
            const project = projectSnap.data() as Project;
            const tasks = project.tasks.filter(t => t.id !== taskId);
            await updateDoc(projectRef, { tasks });
            revalidatePath(`/projects/${projectId}`);
            return { success: true };
        } else {
            throw new Error("Project not found");
        }
    } catch (error) {
        console.error('Delete Task Error:', error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, error: `Failed to delete task: ${message}` };
    }
}

export async function addSubProject(
    projectId: string,
    subProjectData: SubProject,
    projectType: Project['projectType']
): Promise<{ success: boolean; error?: string }> {
    try {
        const collectionName = projectType === 'Rulemaking' ? 'rulemakingProjects' : 'timKerjaProjects';
        const projectRef = doc(db, collectionName, projectId);
        await updateDoc(projectRef, {
            subProjects: arrayUnion(subProjectData)
        });
        revalidatePath(`/projects/${projectId}`);
        return { success: true };
    } catch (error) {
        console.error('Add Sub-Project Error:', error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, error: `Failed to add sub-project: ${message}` };
    }
}

export async function updateSubProject(
    projectId: string,
    updatedSubProject: SubProject,
    projectType: Project['projectType']
): Promise<{ success: boolean; error?: string }> {
    try {
        const collectionName = projectType === 'Rulemaking' ? 'rulemakingProjects' : 'timKerjaProjects';
        const projectRef = doc(db, collectionName, projectId);
        const projectSnap = await getDoc(projectRef);
        if (projectSnap.exists()) {
            const project = projectSnap.data() as Project;
            const subProjects = project.subProjects.map(sp => sp.id === updatedSubProject.id ? updatedSubProject : sp);
            await updateDoc(projectRef, { subProjects });
            revalidatePath(`/projects/${projectId}`);
            return { success: true };
        } else {
            throw new Error("Project not found");
        }
    } catch (error) {
        console.error('Update Sub-Project Error:', error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, error: `Failed to update sub-project: ${message}` };
    }
}

export async function updateUserRole(
    userId: string,
    newRole: User['role']
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { role: newRole });
      revalidatePath('/team');
      return { success: true };
    } catch (error) {
      console.error('Update User Role Error:', error);
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return { success: false, error: `Failed to update user role: ${message}` };
    }
}

export async function updateUserApproval(
    userId: string,
    isApproved: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { isApproved });
      revalidatePath('/team');
      return { success: true };
    } catch (error) {
      console.error('Update User Approval Error:', error);
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return { success: false, error: `Failed to update approval status: ${message}` };
    }
}
  
export async function deleteUser(
    userId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // In a real app, you would also need to delete the user from Firebase Auth
        // and handle removing them from all projects they are a part of.
        // This is a simplified version.
        const userRef = doc(db, 'users', userId);
        await deleteDoc(userRef);
        revalidatePath('/team');
        return { success: true };
    } catch (error) {
        console.error('Delete User Error:', error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, error: `Failed to delete user: ${message}` };
    }
}

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

// CCEFOD Actions
export async function addCcefodRecord(
  recordData: CcefodFormValues
): Promise<{ success: boolean; data?: CcefodRecord; error?: string }> {
  try {
    const newRecordData = {
        ...recordData,
        createdAt: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, 'ccefodRecords'), newRecordData);
    revalidatePath('/ccefod');
    
    const newRecord: CcefodRecord = { id: docRef.id, ...newRecordData };
    return { success: true, data: newRecord };
  } catch (error) {
    console.error('Add CCEFOD Record Error:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return {
      success: false,
      error: `Failed to add CCEFOD record: ${message}`,
    };
  }
}

export async function updateCcefodRecord(
    recordId: string,
    recordData: CcefodFormValues
  ): Promise<{ success: boolean; data?: CcefodRecord; error?: string }> {
    try {
      const recordRef = doc(db, 'ccefodRecords', recordId);
      const docSnap = await getDoc(recordRef);
      if (!docSnap.exists()) {
        throw new Error("Record not found");
      }
      
      const existingData = docSnap.data() as CcefodRecord;
      const updatedData = { ...existingData, ...recordData };
  
      await setDoc(recordRef, updatedData);
      revalidatePath('/ccefod');
      
      return { success: true, data: updatedData };
    } catch (error) {
      console.error('Update CCEFOD Record Error:', error);
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return {
        success: false,
        error: `Failed to update CCEFOD record: ${message}`,
      };
    }
  }

export async function deleteCcefodRecord(
    recordId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const recordRef = doc(db, 'ccefodRecords', recordId);
        await deleteDoc(recordRef);
        revalidatePath('/ccefod');
        return { success: true };
    } catch (error) {
        console.error('Delete CCEFOD Record Error:', error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, error: `Failed to delete CCEFOD record: ${message}` };
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
      // Optionally log or handle invalid records
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

// Protocol Questions (PQs) Actions

export async function addPqRecord(
  recordData: PqFormValues
): Promise<{ success: boolean; data?: PqRecord; error?: string }> {
  try {
    const newRecordData = {
        ...recordData,
        createdAt: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, 'pqsRecords'), newRecordData);
    revalidatePath('/pqs');
    
    const newRecord: PqRecord = { id: docRef.id, ...newRecordData };
    return { success: true, data: newRecord };
  } catch (error) {
    console.error('Add PQ Record Error:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return {
      success: false,
      error: `Failed to add PQ record: ${message}`,
    };
  }
}

export async function updatePqRecord(
    recordId: string,
    recordData: PqFormValues
  ): Promise<{ success: boolean; data?: PqRecord; error?: string }> {
    try {
      const recordRef = doc(db, 'pqsRecords', recordId);
      const docSnap = await getDoc(recordRef);
      if (!docSnap.exists()) {
        throw new Error("Record not found");
      }
      
      const existingData = docSnap.data() as PqRecord;
      const updatedData = { ...existingData, ...recordData };
  
      await setDoc(recordRef, updatedData);
      revalidatePath('/pqs');
      
      return { success: true, data: updatedData };
    } catch (error) {
      console.error('Update PQ Record Error:', error);
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return {
        success: false,
        error: `Failed to update PQ record: ${message}`,
      };
    }
  }

export async function deletePqRecord(
    recordId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const recordRef = doc(db, 'pqsRecords', recordId);
        await deleteDoc(recordRef);
        revalidatePath('/pqs');
        return { success: true };
    } catch (error) {
        console.error('Delete PQ Record Error:', error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, error: `Failed to delete PQ record: ${message}` };
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
      // Optionally log or handle invalid records
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
