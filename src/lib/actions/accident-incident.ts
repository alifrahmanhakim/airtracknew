
'use server';

import { z } from 'zod';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { accidentIncidentFormSchema } from '../schemas';
import type { AccidentIncidentRecord } from '../types';

export async function addAccidentIncidentRecord(data: z.infer<typeof accidentIncidentFormSchema>) {
    const parsed = accidentIncidentFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: "Invalid data provided." };
    }

    try {
        const dataToSubmit = {
            ...parsed.data,
            tanggal: format(parsed.data.tanggal, 'yyyy-MM-dd'),
            createdAt: serverTimestamp(),
        };
        const docRef = await addDoc(collection(db, 'accidentIncidentRecords'), dataToSubmit);
        const newRecord: AccidentIncidentRecord = {
            id: docRef.id,
            ...parsed.data,
            tanggal: format(parsed.data.tanggal, 'yyyy-MM-dd'),
            createdAt: new Date().toISOString(),
        };
        return { success: true, data: newRecord };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function updateAccidentIncidentRecord(id: string, data: z.infer<typeof accidentIncidentFormSchema>) {
    const parsed = accidentIncidentFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: "Invalid data provided." };
    }

    try {
        const docRef = doc(db, 'accidentIncidentRecords', id);
        const dataToSubmit = {
            ...parsed.data,
            tanggal: format(parsed.data.tanggal, 'yyyy-MM-dd'),
        };
        await updateDoc(docRef, dataToSubmit);
        const updatedRecord: AccidentIncidentRecord = {
            id,
            ...parsed.data,
            tanggal: format(parsed.data.tanggal, 'yyyy-MM-dd'),
            createdAt: new Date().toISOString(),
        };
        return { success: true, data: updatedRecord };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function deleteAccidentIncidentRecord(id: string) {
    try {
        await deleteDoc(doc(db, 'accidentIncidentRecords', id));
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}
