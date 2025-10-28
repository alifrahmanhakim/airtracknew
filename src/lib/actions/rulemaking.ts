
'use server';

import { z } from 'zod';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { rulemakingRecordSchema } from '../schemas';
import type { RulemakingRecord } from '../types';

const transformDatesForStorage = (data: z.infer<typeof rulemakingRecordSchema>) => {
    return {
        ...data,
        stages: data.stages.map(stage => ({
            ...stage,
            pengajuan: {
                ...stage.pengajuan,
                tanggal: stage.pengajuan.tanggal, // Dates are already strings from form
            }
        }))
    };
};

export async function addRulemakingRecord(data: z.infer<typeof rulemakingRecordSchema>) {
    const parsed = rulemakingRecordSchema.safeParse(data);
    if (!parsed.success) {
        console.error('Validation failed:', parsed.error.flatten());
        return { success: false, error: "Invalid data provided. " + JSON.stringify(parsed.error.flatten().fieldErrors) };
    }

    try {
        const dataToSubmit = transformDatesForStorage(parsed.data);
        await addDoc(collection(db, 'rulemakingRecords'), {
            ...dataToSubmit,
            createdAt: serverTimestamp(),
        });
        return { success: true };
    } catch (error) {
        console.error('Add rulemaking error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function updateRulemakingRecord(id: string, data: z.infer<typeof rulemakingRecordSchema>) {
    const parsed = rulemakingRecordSchema.safeParse(data);
    if (!parsed.success) {
         console.error('Validation failed:', parsed.error.flatten());
        return { success: false, error: "Invalid data provided." + JSON.stringify(parsed.error.flatten().fieldErrors) };
    }

    try {
        const docRef = doc(db, 'rulemakingRecords', id);
        const dataToSubmit = transformDatesForStorage(parsed.data);
        await updateDoc(docRef, dataToSubmit);
        return { success: true };
    } catch (error) {
        console.error('Update rulemaking error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function deleteRulemakingRecord(id: string) {
    try {
        await deleteDoc(doc(db, 'rulemakingRecords', id));
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}
