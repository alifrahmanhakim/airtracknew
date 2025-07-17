
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

export async function importPqRecords(records: z.infer<typeof pqFormSchema>[]) {
    const batch = writeBatch(db);
    let count = 0;
    for (const recordData of records) {
        const parsed = pqFormSchema.safeParse(recordData);
        if (parsed.success) {
            const docRef = doc(collection(db, 'pqsRecords'));
            batch.set(docRef, { ...parsed.data, createdAt: serverTimestamp() });
            count++;
        } else {
            console.warn("Skipping invalid PQ record during import:", parsed.error.flatten().fieldErrors);
        }
    }
    try {
        await batch.commit();
        return { success: true, count };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred during batch import' };
    }
}
