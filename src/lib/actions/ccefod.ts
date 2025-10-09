
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
    const importSchema = ccefodFormSchema.extend({
        annex: z.string(),
        annexReference: z.string(),
        standardPractice: z.any(),
        legislationReference: z.string(),
    });

    const validImplementationLevels = ccefodFormSchema.shape.implementationLevel.options;
    const batch = writeBatch(db);
    let count = 0;

    for (const recordData of records) {
        let implementationLevelToValidate = recordData.implementationLevel;

        if (implementationLevelToValidate === null || implementationLevelToValidate === undefined) {
            implementationLevelToValidate = 'No difference';
        } else if (typeof implementationLevelToValidate === 'string') {
            const lowercasedLevel = implementationLevelToValidate.toLowerCase().trim();
            const matchingLevel = validImplementationLevels.find(
                (validLevel) => validLevel.toLowerCase().trim() === lowercasedLevel
            );
            if (matchingLevel) {
                implementationLevelToValidate = matchingLevel;
            }
        }

        const dataToValidate = {
            ...recordData,
            annex: recordData.annex ?? '',
            annexReference: recordData.annexReference ?? '',
            standardPractice: recordData.standardPractice ?? '',
            legislationReference: recordData.legislationReference ?? '',
            implementationLevel: implementationLevelToValidate,
            status: recordData.status ?? 'Draft',
            adaPerubahan: recordData.adaPerubahan ?? 'TIDAK',
            usulanPerubahan: recordData.usulanPerubahan ?? '',
            isiUsulan: recordData.isiUsulan ?? '',
            differenceText: recordData.differenceText ?? '',
            differenceReason: recordData.differenceReason ?? '',
            remarks: recordData.remarks ?? '',
        };

        const parsed = importSchema.safeParse(dataToValidate);

        if (parsed.success) {
            const sanitizedStandardPractice = purify.sanitize(parsed.data.standardPractice || '');
            const docRef = doc(collection(db, 'ccefodRecords'));
            batch.set(docRef, {
                ...parsed.data,
                standardPractice: sanitizedStandardPractice,
                createdAt: serverTimestamp(),
            });
            count++;
        } else {
            const firstError = parsed.error.issues[0];
            const fieldPath = firstError.path.join('.');
            const receivedValue = recordData[fieldPath as keyof typeof recordData];
            
            return {
                success: false,
                error: `Error on row ${count + 1}. Field: "${fieldPath}", Message: "${firstError.message}". Received: "${receivedValue}". Please check your CSV.`
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

export async function deleteCcefodRecord(ids: string | string[]) {
    const idArray = Array.isArray(ids) ? ids : [ids];
    if (idArray.length === 0) return { success: true };

    const batch = writeBatch(db);
    idArray.forEach(id => {
        const docRef = doc(db, 'ccefodRecords', id);
        batch.delete(docRef);
    });

    try {
        await batch.commit();
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}
