import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI(), // Uses the GEMINI_API_KEY from the .env file if available, or ADC
  ],
  // Set the default model to a stable version of Gemini
  model: 'gemini-pro', 
  flow: {
    // Memberikan batas waktu yang lebih panjang untuk model yang lebih besar
    timeout: 300000, // 5 menit
  },
});