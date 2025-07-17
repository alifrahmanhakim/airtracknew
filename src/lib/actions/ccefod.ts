'use server';

import { z } from 'zod';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import type { CcefodRecord } from '../types';
import { ccefodFormSchema } from '../schemas';

const window = new JSDOM('').window;
const purify = DOMPurify(window as any);


export async function addCcefodRecord(data: z.infer<typeof ccefodFormSchema>) {
    const parsed = ccefodFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: "Invalid data provided." };
    }

    const sanitizedStandardPractice = purify.sanitize(parsed.data.standardPractice);

    try {
        const docRef = await addDoc(collection(db, 'ccefodRecords'), {
            ...parsed.data,
            standardPractice: sanitizedStandardPractice,
            createdAt: serverTimestamp(),
        });
        const newRecord: CcefodRecord = {
            id: docRef.id,
            ...parsed.data,
            standardPractice: sanitizedStandardPractice,
            createdAt: new Date().toISOString()
        };
        return { success: true, data: newRecord };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function importCcefodRecords(records: z.infer<typeof ccefodFormSchema>[]) {
    const batch = writeBatch(db);
    let count = 0;

    for (const recordData of records) {
        const parsed = ccefodFormSchema.safeParse(recordData);
        if (parsed.success) {
            const sanitizedStandardPractice = purify.sanitize(parsed.data.standardPractice);
            const docRef = doc(collection(db, 'ccefodRecords'));
            batch.set(docRef, {
                ...parsed.data,
                standardPractice: sanitizedStandardPractice,
                createdAt: serverTimestamp(),
            });
            count++;
        } else {
            console.warn("Skipping invalid record during import:", parsed.error.flatten().fieldErrors);
        }
    }

    try {
        await batch.commit();
        return { success: true, count };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred during batch import' };
    }
}


export async function updateCcefodRecord(id: string, data: z.infer<typeof ccefodFormSchema>) {
    const parsed = ccefodFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: "Invalid data provided." };
    }
    
    const sanitizedStandardPractice = purify.sanitize(parsed.data.standardPractice);

    try {
        const docRef = doc(db, 'ccefodRecords', id);
        await updateDoc(docRef, {
             ...parsed.data,
             standardPractice: sanitizedStandardPractice,
        });
        const updatedRecord: CcefodRecord = {
            id,
            ...parsed.data,
            standardPractice: sanitizedStandardPractice,
            createdAt: new Date().toISOString() // This might not be accurate, but it's a placeholder
        };
        return { success: true, data: updatedRecord };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function deleteCcefodRecord(id: string) {
    try {
        await deleteDoc(doc(db, 'ccefodRecords', id));
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}
