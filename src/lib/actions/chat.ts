'use server';

import { z } from 'zod';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { ChatMessage } from '../types';

const messageSchema = z.object({
  text: z.string().min(1, 'Message cannot be empty.').max(1000, 'Message is too long.'),
  senderId: z.string(),
  senderName: z.string(),
  senderAvatarUrl: z.string().url(),
});

export async function sendChatMessage(data: Omit<ChatMessage, 'id' | 'createdAt'>) {
    const parsed = messageSchema.safeParse(data);

    if (!parsed.success) {
        return { success: false, error: parsed.error.flatten().fieldErrors.text?.[0] || 'Invalid message data.' };
    }

    try {
        await addDoc(collection(db, 'chatMessages'), {
            ...parsed.data,
            createdAt: serverTimestamp(),
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}
