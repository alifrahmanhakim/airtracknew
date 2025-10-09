
'use server';

import { z } from 'zod';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { tindakLanjutDgcaFormSchema } from '../schemas';

export async function addTindakLanjutDgcaRecord(data: z.infer<typeof tindakLanjutDgcaFormSchema>) {
    const parsed = tindakLanjutDgcaFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: "Invalid data provided." };
    }

    try {
        const dataToSubmit = {
            ...parsed.data,
            createdAt: serverTimestamp(),
        };
        await addDoc(collection(db, 'tindakLanjutDgcaRecords'), dataToSubmit);
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function updateTindakLanjutDgcaRecord(id: string, data: z.infer<typeof tindakLanjutDgcaFormSchema>) {
    const parsed = tindakLanjutDgcaFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: "Invalid data provided." };
    }

    try {
        const docRef = doc(db, 'tindakLanjutDgcaRecords', id);
        await updateDoc(docRef, data);
        
        const updatedRecord = {
            id,
            ...data,
            createdAt: new Date().toISOString(),
        }
        
        return { success: true, data: updatedRecord };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function deleteTindakLanjutDgcaRecord(id: string) {
    try {
        await deleteDoc(doc(db, 'tindakLanjutDgcaRecords', id));
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}
