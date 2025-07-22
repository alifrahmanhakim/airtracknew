
'use server';

/**
 * @fileOverview Summarizes the project status based on task completion and notes.
 *
 * - summarizeProjectStatus - A function that summarizes the project status.
 * - SummarizeProjectStatusInput - The input type for the summarizeProjectStatus function.
 * - SummarizeProjectStatusOutput - The return type for the summarizeProjectStatus function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeProjectStatusInputSchema = z.object({
  taskCompletion: z
    .string()
    .describe('The percentage of tasks completed in the project.'),
  notes: z.string().describe('Project notes and updates.'),
});
export type SummarizeProjectStatusInput = z.infer<typeof SummarizeProjectStatusInputSchema>;

const SummarizeProjectStatusOutputSchema = z.object({
  summary: z.string().describe('A brief summary of the project status.'),
});
export type SummarizeProjectStatusOutput = z.infer<typeof SummarizeProjectStatusOutputSchema>;

export async function summarizeProjectStatus(
  input: SummarizeProjectStatusInput
): Promise<SummarizeProjectStatusOutput> {
  return summarizeProjectStatusFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeProjectStatusPrompt',
  input: {schema: SummarizeProjectStatusInputSchema},
  output: {schema: SummarizeProjectStatusOutputSchema},
  model: 'gemini-pro',
  prompt: `You are a project manager tasked with summarizing project statuses.

  Based on the task completion percentage and project notes provided, generate a concise summary of the project's current status.

  Task Completion: {{{taskCompletion}}}%
  Notes: {{{notes}}}

  Generate the summary and ensure your output is a valid JSON object matching the specified schema.`, 
});

const summarizeProjectStatusFlow = ai.defineFlow(
  {
    name: 'summarizeProjectStatusFlow',
    inputSchema: SummarizeProjectStatusInputSchema,
    outputSchema: SummarizeProjectStatusOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
