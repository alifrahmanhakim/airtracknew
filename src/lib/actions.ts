
'use server';

import {
  summarizeProjectStatus,
  type SummarizeProjectStatusInput,
  type SummarizeProjectStatusOutput,
} from '@/ai/flows/summarize-project-status';
import type { Document, Project, SubProject, Task, User } from './types';
import { db } from './firebase';
import { doc, updateDoc, arrayUnion, collection, addDoc, getDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';


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
  documentData: { name: string, url: string }
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

    const projectRef = doc(db, 'projects', projectId);
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
    documentId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const projectRef = doc(db, 'projects', projectId);
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

export async function addProject(
    projectData: Omit<Project, 'id'>
  ): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
    try {
      const preparedProjectData = {
        ...projectData,
        team: projectData.team.map(member => ({
          id: member.id,
          name: member.name,
          role: member.role,
          avatarUrl: member.avatarUrl,
        })),
        tasks: [],
        subProjects: [],
        documents: [],
      };

      const docRef = await addDoc(collection(db, 'projects'), preparedProjectData);
      revalidatePath('/dashboard');
      revalidatePath('/projects');
      return { success: true, data: { id: docRef.id } };
    } catch (error) {
      console.error('Add Project Error:', error);
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return {
        success: false,
        error: `Failed to add project: ${message}`,
      };
    }
}

export async function updateProject(
    projectId: string,
    projectData: Partial<Omit<Project, 'id' | 'tasks' | 'subProjects' | 'documents'>>
): Promise<{ success: boolean; error?: string }> {
    try {
        const projectRef = doc(db, 'projects', projectId);
        
        const updateData: { [key: string]: any } = { ...projectData };

        if (projectData.team) {
            updateData.team = projectData.team.map(member => ({
                id: member.id,
                name: member.name,
                role: member.role,
                avatarUrl: member.avatarUrl,
            }));
        }
        
        await updateDoc(projectRef, updateData);
        revalidatePath(`/projects/${projectId}`);
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        console.error('Update Project Error:', error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, error: `Failed to update project: ${message}` };
    }
}


export async function addTask(
    projectId: string,
    taskData: Task
): Promise<{ success: boolean; error?: string }> {
    try {
        const projectRef = doc(db, 'projects', projectId);
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
    updatedTask: Task
): Promise<{ success: boolean; error?: string }> {
    try {
        const projectRef = doc(db, 'projects', projectId);
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

export async function addSubProject(
    projectId: string,
    subProjectData: SubProject
): Promise<{ success: boolean; error?: string }> {
    try {
        const projectRef = doc(db, 'projects', projectId);
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
    updatedSubProject: SubProject
): Promise<{ success: boolean; error?: string }> {
    try {
        const projectRef = doc(db, 'projects', projectId);
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
