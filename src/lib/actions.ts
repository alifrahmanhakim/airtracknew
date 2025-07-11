
'use server';

import {
  summarizeProjectStatus,
  type SummarizeProjectStatusInput,
  type SummarizeProjectStatusOutput,
} from '@/ai/flows/summarize-project-status';
import { projects } from './data';
import type { Document } from './types';
import { db } from './firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';


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

    // Also update the local data for immediate UI feedback until everything is on Firestore
    const project = projects.find((p) => p.id === projectId);
    if (project) {
        project.documents.push(newDocument);
    } else {
        console.warn("Project not found in local data. UI might not update immediately.");
    }


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
