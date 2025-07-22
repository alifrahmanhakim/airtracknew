import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI(), // Uses the GEMINI_API_KEY from the .env file
  ],
  // Set the default model to the standard Gemini 2.5 Flash
  model: 'gemini-2.5-flash',
  flow: {
    // Memberikan batas waktu yang lebih panjang untuk model yang lebih besar
    timeout: 300000, // 5 menit
  },
});