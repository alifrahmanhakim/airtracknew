import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI({
      // Konfigurasi untuk menggunakan Vertex AI
      // Lokasi bisa disesuaikan jika diperlukan, misalnya 'us-central1'
      location: 'us-central1',
    }),
  ],
  // Mengatur model Gemini 2.5 Pro dari Vertex AI sebagai default
  model: 'vertexai/gemini-2.5-flash',
  flow: {
    // Memberikan batas waktu yang lebih panjang untuk model yang lebih besar
    timeout: 300000, // 5 menit
  },
});
