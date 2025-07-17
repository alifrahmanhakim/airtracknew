
'use server';

import { z } from 'zod';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { GapAnalysisRecord, Project } from '../types';
import { gapAnalysisFormSchema } from '../schemas';
import { format } from 'date-fns';

export async function addGapAnalysisRecord(data: z.infer<typeof gapAnalysisFormSchema>) {
    const parsed = gapAnalysisFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: "Invalid data provided." };
    }
    try {
        const dataToSubmit = {
          ...parsed.data,
          dateOfEvaluation: parsed.data.dateOfEvaluation ? format(parsed.data.dateOfEvaluation, 'yyyy-MM-dd') : null,
          effectiveDate: parsed.data.effectiveDate ? format(parsed.data.effectiveDate, 'yyyy-MM-dd') : null,
          applicabilityDate: parsed.data.applicabilityDate ? format(parsed.data.applicabilityDate, 'yyyy-MM-dd') : null,
          embeddedApplicabilityDate: format(parsed.data.embeddedApplicabilityDate, 'yyyy-MM-dd'),
        };

        const docRef = await addDoc(collection(db, 'gapAnalysisRecords'), {
            ...dataToSubmit,
            createdAt: new Date().toISOString(),
        });

        const newRecord: GapAnalysisRecord = {
            id: docRef.id,
            ...parsed.data, // use parsed data to keep Date objects for client
            createdAt: new Date().toISOString(),
        };
        return { success: true, data: newRecord };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function updateGapAnalysisRecord(id: string, data: z.infer<typeof gapAnalysisFormSchema>) {
    const parsed = gapAnalysisFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: "Invalid data provided." };
    }
    try {
        const docRef = doc(db, 'gapAnalysisRecords', id);
        
        const dataToSubmit = {
          ...parsed.data,
          dateOfEvaluation: parsed.data.dateOfEvaluation ? format(parsed.data.dateOfEvaluation, 'yyyy-MM-dd') : null,
          effectiveDate: parsed.data.effectiveDate ? format(parsed.data.effectiveDate, 'yyyy-MM-dd') : null,
          applicabilityDate: parsed.data.applicabilityDate ? format(parsed.data.applicabilityDate, 'yyyy-MM-dd') : null,
          embeddedApplicabilityDate: format(parsed.data.embeddedApplicabilityDate, 'yyyy-MM-dd'),
        };

        await updateDoc(docRef, dataToSubmit);

        const updatedRecord: GapAnalysisRecord = {
            id,
            ...parsed.data, // use parsed data to keep Date objects for client
            createdAt: new Date().toISOString()
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
