import {genkit} from 'genkit';
import {googleAI, vertexAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    vertexAI({ location: 'us-central1' }),
  ],
  // Set the default model to a stable version of Gemini on Vertex AI
  model: 'vertexai/gemini-1.5-flash-latest', 
  flow: {
    // Memberikan batas waktu yang lebih panjang untuk model yang lebih besar
    timeout: 300000, // 5 menit
  },
});
