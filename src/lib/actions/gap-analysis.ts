

'use server';

import { z } from 'zod';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { GapAnalysisRecord, Project } from '../types';
import { gapAnalysisFormSchema } from '../schemas';
import { format } from 'date-fns';

export async function addGapAnalysisRecord(data: z.infer<typeof gapAnalysisFormSchema>) {
    // The Zod validation now happens automatically on the boundary of the Server Action
    try {
        const dataToSubmit = {
          ...data,
          createdAt: new Date().toISOString(),
        };

        const docRef = await addDoc(collection(db, 'gapAnalysisRecords'), dataToSubmit);

        const newRecord: GapAnalysisRecord = {
            id: docRef.id,
            ...data, // use original data for client
            createdAt: new Date().toISOString(),
        };
        return { success: true, data: newRecord };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function updateGapAnalysisRecord(id: string, data: z.infer<typeof gapAnalysisFormSchema>) {
    // The Zod validation now happens automatically on the boundary of the Server Action
    try {
        const docRef = doc(db, 'gapAnalysisRecords', id);
        
        await updateDoc(docRef, data);

        const updatedRecord: GapAnalysisRecord = {
            id,
            ...data, // use original data for client
            createdAt: new Date().toISOString() // This might not be accurate, but it's a placeholder
        };
        return { success: true, data: updatedRecord };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function deleteGapAnalysisRecord(id: string) {
    try {
        await deleteDoc(doc(db, 'gapAnalysisRecords', id));
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}
