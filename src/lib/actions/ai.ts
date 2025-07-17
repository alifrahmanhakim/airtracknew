'use server';

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
