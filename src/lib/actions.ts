
"use server";

import { summarizeProjectStatus, type SummarizeProjectStatusInput, type SummarizeProjectStatusOutput } from '@/ai/flows/summarize-project-status';

export async function getAiSummary(input: SummarizeProjectStatusInput): Promise<{ success: boolean; data?: SummarizeProjectStatusOutput; error?: string }> {
    try {
        const result = await summarizeProjectStatus(input);
        return { success: true, data: result };
    } catch (error) {
        console.error("AI Summary Error:", error);
        return { success: false, error: 'Failed to generate AI summary. Please try again.' };
    }
}
