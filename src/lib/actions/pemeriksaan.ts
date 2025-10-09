

'use server';

import { z } from 'zod';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import { pemeriksaanFormSchema } from '../schemas';
import type { PemeriksaanRecord } from '../types';

export async function addPemeriksaanRecord(data: z.infer<typeof pemeriksaanFormSchema>) {
    const parsed = pemeriksaanFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: "Invalid data provided." };
    }

    try {
        const dataToSubmit = {
            ...parsed.data,
            createdAt: serverTimestamp(),
        };
        await addDoc(collection(db, 'pemeriksaanRecords'), dataToSubmit);
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function updatePemeriksaanRecord(id: string, data: z.infer<typeof pemeriksaanFormSchema>) {
    const parsed = pemeriksaanFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: "Invalid data provided." };
    }

    try {
        const docRef = doc(db, 'pemeriksaanRecords', id);
        
        await updateDoc(docRef, parsed.data);
        
        const updatedRecord = {
            id,
            ...data,
            createdAt: new Date().toISOString(),
        } as PemeriksaanRecord
        
        return { success: true, data: updatedRecord };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}


export async function deletePemeriksaanRecord(id: string) {
    try {
        await deleteDoc(doc(db, 'pemeriksaanRecords', id));
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}
