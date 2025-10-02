

'use server';

import { z } from 'zod';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import type { CcefodRecord } from './types';

const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

// --- SHARED SCHEMAS ---
const ccefodFormSchema = z.object({
  adaPerubahan: z.enum(['YA', 'TIDAK']),
  usulanPerubahan: z.string().optional(),
  isiUsulan: z.string().optional(),
  annex: z.string().min(1, 'Annex is required'),
  annexReference: z.string().min(1, 'Annex Reference is required'),
  standardPractice: z.string().min(1, 'Standard/Practice is required'),
  legislationReference: z.string().min(1, 'Legislation Reference is required'),
  implementationLevel: z.string().min(1, 'Implementation Level is required'),
  differenceText: z.string().optional(),
  differenceReason: z.string().optional(),
  remarks: z.string().optional(),
  status: z.enum(['Draft', 'Final', 'Existing']),
});




// --- CCEFOD ACTIONS ---
export async function addCcefodRecord(data: unknown) {
    const parsed = ccefodFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: parsed.error.flatten().fieldErrors };
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

export async function updateCcefodRecord(id: string, data: unknown) {
    const parsed = ccefodFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: parsed.error.flatten().fieldErrors };
    }
    
    const sanitizedStandardPractice = purify.sanitize(parsed.data.standardPractice);

    try {
        const docRef = doc(db, 'ccefodRecords', id);
        await updateDoc(docRef, {
             ...parsed.data,
             standardPractice: sanitizedStandardPractice,
        });
        return { success: true };
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


// --- PQS ACTIONS ---

export async function deletePqRecord(id: string) {
    try {
        await deleteDoc(doc(db, 'pqsRecords', id));
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

    