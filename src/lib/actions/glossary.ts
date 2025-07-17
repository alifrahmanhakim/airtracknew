'use server';

import { z } from 'zod';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import type { GlossaryRecord } from '../types';
import { glossaryFormSchema } from '../schemas';

export async function addGlossaryRecord(data: z.infer<typeof glossaryFormSchema>) {
    const parsed = glossaryFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: "Invalid data provided." };
    }
    try {
        const docRef = await addDoc(collection(db, 'glossaryRecords'), {
            ...parsed.data,
            createdAt: serverTimestamp(),
        });
        const newRecord: GlossaryRecord = {
            id: docRef.id,
            ...parsed.data,
            createdAt: new Date().toISOString(),
        };
        return { success: true, data: newRecord };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function deleteGlossaryRecord(id: string) {
    try {
        await deleteDoc(doc(db, 'glossaryRecords', id));
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}
