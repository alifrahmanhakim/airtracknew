

'use server';

import { z } from 'zod';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import { lawEnforcementFormSchema } from '../schemas';
import type { LawEnforcementRecord } from '../types';

export async function addLawEnforcementRecord(data: z.infer<typeof lawEnforcementFormSchema>) {
    const parsed = lawEnforcementFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: "Invalid data. Please check the form and try again." };
    }

    try {
        const dataToSubmit = {
            ...parsed.data,
            references: parsed.data.references.map(ref => ({
                ...ref,
                dateLetter: ref.dateLetter // Already a string
            })),
            createdAt: serverTimestamp(),
        };
        const docRef = await addDoc(collection(db, 'lawEnforcementRecords'), dataToSubmit);
        
        return { success: true, id: docRef.id };

    } catch (error) {
        console.error("Firestore Add Error in addLawEnforcementRecord:", error);
        return { success: false, error: error instanceof Error ? error.message : 'An unknown server error occurred' };
    }
}

export async function updateLawEnforcementRecord(id: string, data: z.infer<typeof lawEnforcementFormSchema>) {
    const parsed = lawEnforcementFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: "Invalid data provided." };
    }

    try {
        const docRef = doc(db, 'lawEnforcementRecords', id);
        
        const dataToSubmit = {
            ...parsed.data,
             references: parsed.data.references.map(ref => ({
                ...ref,
                dateLetter: ref.dateLetter, // Already a string
                fileUrl: ref.fileUrl || '', // Ensure empty string is saved if undefined
            })),
        };
        
        await updateDoc(docRef, dataToSubmit);
       
        const updatedRecord = {
            id,
            ...dataToSubmit,
            createdAt: new Date().toISOString(), // Placeholder, not the real server time
        } as LawEnforcementRecord;
        
        return { success: true, data: updatedRecord };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function deleteLawEnforcementRecord(id: string) {
    try {
        await deleteDoc(doc(db, 'lawEnforcementRecords', id));
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}
