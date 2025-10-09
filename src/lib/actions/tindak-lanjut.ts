

'use server';

import { z } from 'zod';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { tindakLanjutFormSchema } from '../schemas';
import { getYear } from 'date-fns';
import { format } from 'date-fns';

export async function addTindakLanjutRecord(data: z.infer<typeof tindakLanjutFormSchema>) {
    const parsed = tindakLanjutFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: "Invalid data provided." };
    }

    try {
        const dataToSubmit = {
            ...parsed.data,
            tahun: getYear(new Date(parsed.data.tanggalKejadian)),
            createdAt: serverTimestamp(),
        };
        await addDoc(collection(db, 'tindakLanjutRecords'), dataToSubmit);
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function updateTindakLanjutRecord(id: string, data: z.infer<typeof tindakLanjutFormSchema>) {
    const parsed = tindakLanjutFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: "Invalid data provided." };
    }

    try {
        const docRef = doc(db, 'tindakLanjutRecords', id);
        
        const dataToSubmit = {
            ...parsed.data,
            tahun: getYear(new Date(parsed.data.tanggalKejadian)),
        };

        await updateDoc(docRef, dataToSubmit);
        
        const updatedRecord = {
            id,
            ...dataToSubmit,
            createdAt: new Date().toISOString(),
        }
        
        return { success: true, data: updatedRecord };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function deleteTindakLanjutRecord(id: string) {
    try {
        await deleteDoc(doc(db, 'tindakLanjutRecords', id));
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}
