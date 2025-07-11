
'use server';

import {
  summarizeProjectStatus,
  type SummarizeProjectStatusInput,
  type SummarizeProjectStatusOutput,
} from '@/ai/flows/summarize-project-status';
import { projects } from './data';
import type { Document } from './types';

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
    // In a real app, this would save to a database.
    // Here, we simulate it by updating the in-memory data.
    const project = projects.find((p) => p.id === projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const newDocument: Document = {
      ...document,
      id: `doc-${Date.now()}`,
      uploadDate: new Date().toISOString(),
    };

    project.documents.push(newDocument);

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
