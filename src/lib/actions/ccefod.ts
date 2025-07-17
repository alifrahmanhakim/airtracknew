
'use server';

import { z } from 'zod';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, writeBatch, getDocs } from 'firebase/firestore';
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

export async function importCcefodRecords(records: Partial<CcefodRecord>[]) {
    const batch = writeBatch(db);
    let count = 0;

    for (const recordData of records) {
        // Explicitly handle null/undefined for required string fields by converting them to empty strings.
        const dataToValidate = {
            ...recordData,
            annex: recordData.annex ?? '',
            annexReference: recordData.annexReference ?? '',
            standardPractice: recordData.standardPractice ?? '',
            legislationReference: recordData.legislationReference ?? '',
            implementationLevel: recordData.implementationLevel ?? 'No difference',
            status: recordData.status ?? 'Draft',
            adaPerubahan: recordData.adaPerubahan ?? 'TIDAK',
            usulanPerubahan: recordData.usulanPerubahan ?? '',
            isiUsulan: recordData.isiUsulan ?? '',
            differenceText: recordData.differenceText ?? '',
            differenceReason: recordData.differenceReason ?? '',
            remarks: recordData.remarks ?? '',
        };

        const parsed = ccefodFormSchema.safeParse(dataToValidate);
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
            const firstErrorField = Object.keys(parsed.error.flatten().fieldErrors)[0];
            const firstErrorMessage = parsed.error.flatten().fieldErrors[firstErrorField]?.[0];
            return {
                success: false,
                error: `Invalid data in row ${count + 1}. Field: "${firstErrorField}", Error: "${firstErrorMessage}". Please check your CSV.`
            }
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

export async function deleteAllCcefodRecords() {
    try {
        const querySnapshot = await getDocs(collection(db, 'ccefodRecords'));
        const batch = writeBatch(db);
        let count = 0;
        querySnapshot.forEach((doc) => {
            batch.delete(doc.ref);
            count++;
        });
        await batch.commit();
        return { success: true, count };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}
