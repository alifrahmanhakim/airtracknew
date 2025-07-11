
'use server';

import {
  summarizeProjectStatus,
  type SummarizeProjectStatusInput,
  type SummarizeProjectStatusOutput,
} from '@/ai/flows/summarize-project-status';
import { projects } from './data';
import type { Document, Project, User } from './types';
import { db } from './firebase';
import { doc, updateDoc, arrayUnion, collection, addDoc } from 'firebase/firestore';
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
  document: Omit<Document, 'id' | 'uploadDate'>
): Promise<{ success: boolean; data?: Document; error?: string }> {
  try {
    const newDocument: Document = {
      ...document,
      id: `doc-${Date.now()}`,
      uploadDate: new Date().toISOString(),
    };

    // Update Firestore
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

export async function addProject(
    projectData: Omit<Project, 'id'>
  ): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
    try {
      // Firestore expects plain objects, so we need to convert User objects to simple IDs or maps
      const preparedProjectData = {
        ...projectData,
        team: projectData.team.map(member => ({
          id: member.id,
          name: member.name,
          role: member.role,
          avatarUrl: member.avatarUrl,
        })),
      };

      const docRef = await addDoc(collection(db, 'projects'), preparedProjectData);
      revalidatePath('/dashboard'); // This tells Next.js to refresh the data on the dashboard page
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
