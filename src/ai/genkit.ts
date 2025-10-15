/**
 * @fileoverview This file initializes and configures the Genkit AI framework.
 *
 * It sets up the necessary plugins, specifically the Google AI plugin for generative models.
 * It defines a global `ai` object that is used throughout the application to define
 * and run AI flows, prompts, and other Genkit functionalities.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// Initialize the Genkit AI platform with the Google AI plugin.
// This configuration allows the application to use Google's generative AI models.
// The `ai` object is exported to be used as a singleton across the server-side
// parts of the Next.js application.
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});
