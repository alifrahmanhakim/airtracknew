

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

export async function importGlossaryRecords(records: z.infer<typeof glossaryFormSchema>[]) {
    // Define a more lenient schema for CSV import that allows for empty/nullish values
    const importSchema = z.array(z.object({
        tsu: z.string().nullable().optional(),
        tsa: z.string().nullable().optional(),
        editing: z.string().nullable().optional(),
        makna: z.string().nullable().optional(),
        keterangan: z.string().nullable().optional(),
        referensi: z.string().nullable().optional(),
        status: z.enum(['Draft', 'Final']).nullable().optional(),
    }));

    const parsedRecords = importSchema.safeParse(records);

    if (!parsedRecords.success) {
        return {
            success: false,
            error: "The CSV file structure is incorrect. Please check the headers and data types.",
        };
    }

    const batch = writeBatch(db);
    let count = 0;
    
    // Filter out rows where all values are empty or null
    const nonEmptyRecords = parsedRecords.data.filter(record => 
        Object.values(record).some(value => value !== null && value !== '' && value !== undefined)
    );

    for (const [index, recordData] of nonEmptyRecords.entries()) {
        
        // Now, transform the lenient data into the strict schema format for the database
        const dataToStore = {
            tsu: recordData.tsu ?? '',
            tsa: recordData.tsa ?? '',
            editing: recordData.editing ?? '',
            makna: recordData.makna ?? '',
            keterangan: recordData.keterangan ?? '',
            referensi: recordData.referensi ?? '',
            status: recordData.status ?? 'Draft',
        };

        // Final validation with the strict schema before writing to DB
        const finalParsed = glossaryFormSchema.safeParse(dataToStore);

        if (finalParsed.success) {
            const docRef = doc(collection(db, 'glossaryRecords'));
            batch.set(docRef, { ...finalParsed.data, createdAt: serverTimestamp() });
            count++;
        } else {
            const firstError = finalParsed.error.issues[0];
            const fieldPath = firstError.path.join('.');
            return {
                success: false,
                error: `Error on row ${index + 2} in CSV. Field: "${fieldPath}", Message: "${firstError.message}". Please check your file.`
            };
        }
    }

    if (count === 0) {
        return { success: false, error: "No valid records found to import." };
    }

    try {
        await batch.commit();
        return { success: true, count };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred during batch import' };
    }
}
