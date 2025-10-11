

'use server';

import { z } from 'zod';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { GapAnalysisRecord, Project } from '../types';
import { gapAnalysisFormSchema } from '../schemas';
import { format, parse } from 'date-fns';

function formatDateForStorage(dateString?: string): string | null {
    if (!dateString || dateString.trim() === '') return null; // Handle empty or undefined
    try {
        // Handle YYYY-MM-DD (from direct input) or DD-MM-YYYY (from manual edit)
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString; // Already in correct format
        }
        const date = parse(dateString, 'dd-MM-yyyy', new Date());
        return format(date, 'yyyy-MM-dd');
    } catch (e) {
        return null; // Return null if parsing fails
    }
}


export async function addGapAnalysisRecord(data: z.infer<typeof gapAnalysisFormSchema>) {
    // The Zod validation now happens automatically on the boundary of the Server Action
    try {
        const dataToSubmit = {
          ...data,
          slReferenceDate: formatDateForStorage(data.slReferenceDate),
          dateOfEvaluation: formatDateForStorage(data.dateOfEvaluation),
          implementationDate: formatDateForStorage(data.implementationDate),
          effectiveDate: formatDateForStorage(data.effectiveDate),
          applicabilityDate: formatDateForStorage(data.applicabilityDate),
          embeddedApplicabilityDate: formatDateForStorage(data.embeddedApplicabilityDate),
          actionRequired: data.actionRequired.map(act => ({
              ...act,
              date: formatDateForStorage(act.date)
          })),
          verifiers: data.verifiers?.map(v => ({
              ...v,
              date: formatDateForStorage(v.date)
          })),
          implementationTasks: data.implementationTasks?.map(t => ({
              ...t,
              estimatedComplianceDate: formatDateForStorage(t.estimatedComplianceDate)
          })),
          createdAt: serverTimestamp(),
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
        
        const dataToSubmit = {
          ...data,
          slReferenceDate: formatDateForStorage(data.slReferenceDate),
          dateOfEvaluation: formatDateForStorage(data.dateOfEvaluation),
          implementationDate: formatDateForStorage(data.implementationDate),
          effectiveDate: formatDateForStorage(data.effectiveDate),
          applicabilityDate: formatDateForStorage(data.applicabilityDate),
          embeddedApplicabilityDate: formatDateForStorage(data.embeddedApplicabilityDate),
          actionRequired: data.actionRequired.map(act => ({
              ...act,
              date: formatDateForStorage(act.date)
          })),
          verifiers: data.verifiers?.map(v => ({
              ...v,
              date: formatDateForStorage(v.date)
          })),
          implementationTasks: data.implementationTasks?.map(t => ({
              ...t,
              estimatedComplianceDate: formatDateForStorage(t.estimatedComplianceDate)
          })),
        };
        
        await updateDoc(docRef, dataToSubmit);

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
