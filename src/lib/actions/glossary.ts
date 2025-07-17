

'use server';

import { z } from 'zod';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, deleteDoc, writeBatch, updateDoc } from 'firebase/firestore';
import type { GlossaryRecord } from '../types';
import { glossaryFormSchema } from '../schemas';

export async function addGlossaryRecord(data: z.infer<typeof glossaryFormSchema>) {
    const parsed = glossaryFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: "Invalid data provided." };
    }
    try {
        const docRef = await addDoc(collection(db, 'glossaryRecords'), {
            ...parsed.data,
            createdAt: serverTimestamp(),
        });
        const newRecord: GlossaryRecord = {
            id: docRef.id,
            ...parsed.data,
            createdAt: new Date().toISOString(),
        };
        return { success: true, data: newRecord };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function updateGlossaryRecord(id: string, data: z.infer<typeof glossaryFormSchema>) {
    const parsed = glossaryFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: "Invalid data provided." };
    }
    try {
        const docRef = doc(db, 'glossaryRecords', id);
        await updateDoc(docRef, parsed.data);
        const updatedRecord: GlossaryRecord = {
            id,
            ...parsed.data,
            createdAt: new Date().toISOString() // This might not be accurate, but it's a placeholder
        };
        return { success: true, data: updatedRecord };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function deleteGlossaryRecord(id: string) {
    try {
        await deleteDoc(doc(db, 'glossaryRecords', id));
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function importGlossaryRecords(records: Record<string, any>[]) {
    const batch = writeBatch(db);
    let count = 0;

    const nonEmptyRecords = records.filter(record => 
        Object.values(record).some(value => value !== null && value !== '' && value !== undefined)
    );

    for (const [index, recordData] of nonEmptyRecords.entries()) {
        const dataToValidate = {
            tsu: recordData.tsu || '',
            tsa: recordData.tsa || '',
            editing: recordData.editing || '',
            makna: recordData.makna || '',
            keterangan: recordData.keterangan || '',
            referensi: recordData.referensi || '',
            status: (recordData.status === 'Final' || recordData.status === 'Draft') ? recordData.status : 'Draft',
        };

        const finalParsed = glossaryFormSchema.safeParse(dataToValidate);

        if (finalParsed.success) {
            const docRef = doc(collection(db, 'glossaryRecords'));
            batch.set(docRef, { ...finalParsed.data, createdAt: serverTimestamp() });
            count++;
        } else {
            const firstError = finalParsed.error.issues[0];
            const fieldPath = firstError.path.join('.');
            return {
                success: false,
                error: `Error on CSV row ${index + 2}. Field: "${fieldPath}", Message: "${firstError.message}". Please check your file.`
            };
        }
    }

    if (count === 0) {
        return { success: false, error: "No valid records found to import. Please check your CSV file structure and data." };
    }

    try {
        await batch.commit();
        return { success: true, count };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred during batch import' };
    }
}