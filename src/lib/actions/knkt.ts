

'use server';

import { z } from 'zod';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { knktReportFormSchema } from '../schemas';
import type { KnktReport } from '../types';

export async function addKnktReport(data: z.infer<typeof knktReportFormSchema>) {
    const parsed = knktReportFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: "Invalid data provided." };
    }

    try {
        const dataToSubmit = {
            ...parsed.data,
            tanggal_diterbitkan: new Date(parsed.data.tanggal_diterbitkan).toISOString(),
            createdAt: serverTimestamp(),
        };
        const docRef = await addDoc(collection(db, 'knktReports'), dataToSubmit);
        
        return { success: true, id: docRef.id };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function updateKnktReport(id: string, data: z.infer<typeof knktReportFormSchema>) {
    const parsed = knktReportFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: "Invalid data provided." };
    }

    try {
        const docRef = doc(db, 'knktReports', id);
        
        const dataToSubmit = {
            ...parsed.data,
            tanggal_diterbitkan: new Date(parsed.data.tanggal_diterbitkan).toISOString(),
        };

        await updateDoc(docRef, dataToSubmit);
        
        const updatedRecord: KnktReport = {
            id,
            ...dataToSubmit,
            createdAt: new Date().toISOString(),
        }
        
        return { success: true, data: updatedRecord };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function deleteKnktReport(id: string) {
    try {
        await deleteDoc(doc(db, 'knktReports', id));
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}
