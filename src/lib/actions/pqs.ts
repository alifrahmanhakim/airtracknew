
'use server';

import { z } from 'zod';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, writeBatch, getDocs } from 'firebase/firestore';
import type { PqRecord } from '../types';
import { pqFormSchema } from '../schemas';

export async function addPqRecord(data: z.infer<typeof pqFormSchema>) {
    const parsed = pqFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: "Invalid data provided." };
    }
    try {
        const docRef = await addDoc(collection(db, 'pqsRecords'), {
            ...parsed.data,
            createdAt: serverTimestamp(),
        });
        const newRecord: PqRecord = {
            id: docRef.id,
            ...parsed.data,
            createdAt: new Date().toISOString()
        };
        return { success: true, data: newRecord };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function updatePqRecord(id: string, data: z.infer<typeof pqFormSchema>) {
    const parsed = pqFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: "Invalid data provided." };
    }
    try {
        const docRef = doc(db, 'pqsRecords', id);
        await updateDoc(docRef, parsed.data);
        const updatedRecord: PqRecord = {
            id,
            ...parsed.data,
            createdAt: new Date().toISOString()
        };
        return { success: true, data: updatedRecord };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function deletePqRecord(id: string) {
    try {
        await deleteDoc(doc(db, 'pqsRecords', id));
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function deleteAllPqRecords() {
    try {
        const querySnapshot = await getDocs(collection(db, 'pqsRecords'));
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

export async function importPqRecords(records: Record<string, any>[]) {
    const batch = writeBatch(db);
    let count = 0;

    const nonEmptyRecords = records.filter(record => 
        Object.values(record).some(value => value !== null && value !== '' && value !== undefined)
    );

    for (const [index, recordData] of nonEmptyRecords.entries()) {
        const dataToValidate = {
            pqNumber: String(recordData.pqNumber ?? ''),
            protocolQuestion: recordData.protocolQuestion ?? '',
            guidance: recordData.guidance ?? '',
            icaoReferences: recordData.icaoReferences ?? '',
            ppq: (recordData.ppq === 'YES' || recordData.ppq === 'NO') ? recordData.ppq : 'NO',
            criticalElement: pqFormSchema.shape.criticalElement.options.includes(recordData.criticalElement) ? recordData.criticalElement : 'CE - 1',
            remarks: recordData.remarks ?? '',
            evidence: recordData.evidence ?? '',
            answer: recordData.answer ?? '',
            poc: recordData.poc ?? '',
            icaoStatus: (recordData.icaoStatus === 'Satisfactory' || recordData.icaoStatus === 'No Satisfactory') ? recordData.icaoStatus : 'Satisfactory',
            cap: recordData.cap ?? '',
            sspComponent: recordData.sspComponent ?? '',
            status: (recordData.status === 'Existing' || recordData.status === 'Draft' || recordData.status === 'Final') ? recordData.status : 'Draft',
        };

        const parsed = pqFormSchema.safeParse(dataToValidate);

        if (parsed.success) {
            const docRef = doc(collection(db, 'pqsRecords'));
            batch.set(docRef, { ...parsed.data, createdAt: serverTimestamp() });
            count++;
        } else {
            console.warn(`Skipping invalid PQ record during import on row ${index + 2}:`, parsed.error.flatten().fieldErrors);
            const firstError = parsed.error.issues[0];
            return {
                success: false,
                error: `Error on CSV row ${index + 2}. Field: "${firstError.path.join('.')}", Message: "${firstError.message}". Please check your file.`
            };
        }
    }

    if (count === 0 && nonEmptyRecords.length > 0) {
        return { success: false, error: "No valid records found to import. Please check your CSV file structure and data types." };
    }

    try {
        await batch.commit();
        return { success: true, count };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred during batch import' };
    }
}
