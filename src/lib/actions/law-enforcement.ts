
'use server';

import { z } from 'zod';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { format } from 'date-fns';
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
                dateLetter: format(ref.dateLetter, 'yyyy-MM-dd')
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
                dateLetter: format(ref.dateLetter, 'yyyy-MM-dd')
            })),
        };
        await updateDoc(docRef, dataToSubmit);
       
        // We'll return the submitted data, but with dates as ISO strings
        // to maintain consistency on the client-side without a full re-fetch.
        const updatedRecord = {
            id,
            ...parsed.data,
            references: parsed.data.references.map(ref => ({
                ...ref,
                dateLetter: ref.dateLetter.toISOString()
            })),
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
