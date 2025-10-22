
'use server';

import { z } from 'zod';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, deleteDoc, writeBatch, updateDoc, getDocs, getDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import type { GlossaryRecord, StatusHistoryItem } from '../types';
import { glossaryFormSchema } from '../schemas';

export async function addGlossaryRecord(data: z.infer<typeof glossaryFormSchema>) {
    const parsed = glossaryFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: "Invalid data provided." };
    }
    try {
        const now = new Date().toISOString();
        const docRef = await addDoc(collection(db, 'glossaryRecords'), {
            ...parsed.data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            statusHistory: [{ status: parsed.data.status, date: now }],
        });
        const newRecord: GlossaryRecord = {
            id: docRef.id,
            ...parsed.data,
            createdAt: now,
            updatedAt: now,
            statusHistory: [{ status: parsed.data.status, date: now }],
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
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            return { success: false, error: "Record not found" };
        }

        const oldData = docSnap.data();
        const now = new Date().toISOString();
        const dataToUpdate: any = { ...parsed.data, updatedAt: serverTimestamp() };

        if (oldData.status !== parsed.data.status) {
            const newStatusHistoryEntry: StatusHistoryItem = {
                status: parsed.data.status,
                date: now,
            };
            dataToUpdate.statusHistory = arrayUnion(newStatusHistoryEntry);
        }

        await updateDoc(docRef, dataToUpdate);
        
        // Refetch the document to get the updated data with server timestamps resolved.
        const updatedDocSnap = await getDoc(docRef);
        const updatedDataFromServer = updatedDocSnap.data();

        if (!updatedDataFromServer) {
             return { success: false, error: "Failed to refetch updated record." };
        }

        const updatedRecord: GlossaryRecord = {
            id,
            tsu: updatedDataFromServer.tsu,
            tsa: updatedDataFromServer.tsa,
            editing: updatedDataFromServer.editing,
            makna: updatedDataFromServer.makna,
            keterangan: updatedDataFromServer.keterangan,
            referensi: updatedDataFromServer.referensi,
            status: updatedDataFromServer.status,
            createdAt: (updatedDataFromServer.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
            updatedAt: (updatedDataFromServer.updatedAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
            statusHistory: (updatedDataFromServer.statusHistory || []).map((item: any) => ({
                ...item,
                date: item.date instanceof Timestamp ? item.date.toDate().toISOString() : item.date,
            })),
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

export async function deleteAllGlossaryRecords() {
    try {
        const querySnapshot = await getDocs(collection(db, 'glossaryRecords'));
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

export async function importGlossaryRecords(records: Record<string, any>[]) {
    const batch = writeBatch(db);
    let count = 0;
    
    // Filter out rows that are completely empty
    const nonEmptyRecords = records.filter(record => 
        Object.values(record).some(value => value !== null && value !== '' && value !== undefined)
    );

    const requiredFields = ['tsu', 'tsa', 'editing', 'makna', 'keterangan'];

    for (const [index, recordData] of nonEmptyRecords.entries()) {
        const dataToValidate = {
            tsu: recordData.tsu || '',
            tsa: recordData.tsa || '',
            editing: recordData.editing || '',
            makna: recordData.makna || '',
            keterangan: recordData.keterangan || '',
            referensi: recordData.referensi || '',
            status: (['Draft', 'Final', 'Usulan'].includes(recordData.status)) ? recordData.status : 'Draft',
        };

        // If a required field was originally empty, fill it with a placeholder
        for (const field of requiredFields) {
            if (!dataToValidate[field as keyof typeof dataToValidate]) {
                dataToValidate[field as keyof typeof dataToValidate] = '-';
            }
        }

        const finalParsed = glossaryFormSchema.safeParse(dataToValidate);

        if (finalParsed.success) {
            const now = new Date().toISOString();
            const docRef = doc(collection(db, 'glossaryRecords'));
            batch.set(docRef, { 
                ...finalParsed.data,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                statusHistory: [{ status: finalParsed.data.status, date: now }]
            });
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
