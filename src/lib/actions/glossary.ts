

'use server';

import { z } from 'zod';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, deleteDoc, writeBatch, updateDoc } from 'firebase/firestore';
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

export async function updateGlossaryRecord(id: string, data: z.infer<typeof glossaryFormSchema>) {
    const parsed = glossaryFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: "Invalid data provided." };
    }
    try {
        const docRef = doc(db, 'glossaryRecords', id);
        await updateDoc(docRef, parsed.data);
        const updatedRecord: GlossaryRecord = {
            id,
            ...parsed.data,
            createdAt: new Date().toISOString() // This might not be accurate, but it's a placeholder
        };
        return { success: true, data: updatedRecord };
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

export async function importGlossaryRecords(records: z.infer<typeof glossaryFormSchema>[]) {
    const batch = writeBatch(db);
    let count = 0;
    
    for (const [index, recordData] of records.entries()) {
        const parsed = glossaryFormSchema.safeParse(recordData);
        if (parsed.success) {
            const docRef = doc(collection(db, 'glossaryRecords'));
            batch.set(docRef, { ...parsed.data, createdAt: serverTimestamp() });
            count++;
        } else {
            console.warn(`Skipping invalid glossary record at row ${index + 1}:`, parsed.error.flatten().fieldErrors);
            const firstError = parsed.error.issues[0];
            const fieldPath = firstError.path.join('.');
            return {
                success: false,
                error: `Error on row ${index + 2} in CSV. Field: "${fieldPath}", Message: "${firstError.message}". Please check your file.`
            };
        }
    }

    try {
        await batch.commit();
        return { success: true, count };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred during batch import' };
    }
}
