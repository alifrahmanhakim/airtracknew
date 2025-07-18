
'use server';

import { z } from 'zod';
import { db } from '../firebase';
import { collection, getDocs, query, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, arrayUnion, writeBatch, getDoc } from 'firebase/firestore';
import type { Document as ProjectDocument, Project, SubProject, Task, ChecklistItem, User } from '../types';
import { summarizeProjectStatus, type SummarizeProjectStatusInput } from '@/ai/flows/summarize-project-status';
import { generateChecklist, type GenerateChecklistInput } from '@/ai/flows/generate-checklist';


export async function addRulemakingProject(projectData: unknown) {
    const projectSchema = z.object({
        name: z.string().min(1, 'Project name is required.'),
        description: z.string().min(1, 'Description is required.'),
        ownerId: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        status: z.enum(['On Track', 'Off Track', 'At Risk', 'Completed']),
        team: z.array(z.string()).min(1, 'At least one team member must be selected.'),
        annex: z.string().min(1, 'Annex is required.'),
        casr: z.string().min(1, 'CASR is required.'),
        casrRevision: z.string().optional(),
        tags: z.array(z.string()).optional(),
    });

    const parsed = projectSchema.safeParse(projectData);

    if (!parsed.success) {
        return {
            success: false,
            error: parsed.error.errors.map(e => e.message).join(', '),
        };
    }

    // Fetch full user objects for the team
    const teamUsers: User[] = [];
    if (parsed.data.team.length > 0) {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        parsed.data.team.forEach(userId => {
            const user = allUsers.find(u => u.id === userId);
            if (user) {
                teamUsers.push(user);
            }
        });
    }

    try {
        const docRef = await addDoc(collection(db, 'rulemakingProjects'), {
            ...parsed.data,
            team: teamUsers, // Store full user objects
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


export async function addTimKerjaProject(projectData: Omit<Project, 'id' | 'projectType' | 'tasks' | 'documents' | 'subProjects' | 'notes' | 'checklist' | 'team'> & { team: string[] }) {
    try {
        // Fetch full user objects for the team
        const teamUsers: User[] = [];
        if (projectData.team.length > 0) {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            projectData.team.forEach(userId => {
                const user = allUsers.find(u => u.id === userId);
                if (user) {
                    teamUsers.push(user);
                }
            });
        }
        
        const docRef = await addDoc(collection(db, 'timKerjaProjects'), {
            ...projectData,
            team: teamUsers, // Store full user objects
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

export async function updateProjectChecklist(projectId: string, checklist: ChecklistItem[], projectType: Project['projectType']) {
    const collectionName = projectType === 'Rulemaking' ? 'rulemakingProjects' : 'timKerjaProjects';
    try {
        const projectRef = doc(db, collectionName, projectId);
        await updateDoc(projectRef, { checklist });
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to update checklist.' };
    }
}

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
