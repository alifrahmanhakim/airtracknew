import {genkit} from 'genkit';
import {vertexAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    vertexAI({
      // Lokasi bisa disesuaikan jika diperlukan, misalnya 'us-central1'
      location: 'us-central1',
    }),
  ],
  // Mengatur model Gemini 1.5 Pro dari Vertex AI sebagai default
  model: 'vertexai/gemini-1.5-pro-preview-0409',
  flow: {
    // Memberikan batas waktu yang lebih panjang untuk model yang lebih besar
    timeout: 300000, // 5 menit
  },
});
