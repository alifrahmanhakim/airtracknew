
'use server';

/**
 * @fileOverview Generates a project checklist using AI.
 *
 * - generateChecklist - A function that generates a checklist for a project.
 * - GenerateChecklistInput - The input type for the generateChecklist function.
 * - GenerateChecklistOutput - The return type for the generateChecklist function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateChecklistInputSchema = z.object({
  projectName: z.string().describe('The name of the project.'),
  projectDescription: z.string().describe('A brief description of the project.'),
});
export type GenerateChecklistInput = z.infer<typeof GenerateChecklistInputSchema>;

const GenerateChecklistOutputSchema = z.object({
  items: z.array(z.string()).describe('A list of checklist items for the project.'),
});
export type GenerateChecklistOutput = z.infer<typeof GenerateChecklistOutputSchema>;

export async function generateChecklist(
  input: GenerateChecklistInput
): Promise<GenerateChecklistOutput> {
  return generateChecklistFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateChecklistPrompt',
  input: {schema: GenerateChecklistInputSchema},
  output: {schema: GenerateChecklistOutputSchema},
  prompt: `You are an expert project manager specializing in the aviation industry.
  
  Based on the project name and description provided, generate a concise and actionable checklist of 5 to 7 essential tasks or milestones.

  Project Name: {{{projectName}}}
  Project Description: {{{projectDescription}}}

  Generate the checklist items.`,
});

const generateChecklistFlow = ai.defineFlow(
  {
    name: 'generateChecklistFlow',
    inputSchema: GenerateChecklistInputSchema,
    outputSchema: GenerateChecklistOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
