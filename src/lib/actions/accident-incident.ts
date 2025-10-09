
'use server';

import { z } from 'zod';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { accidentIncidentFormSchema } from '../schemas';
import type { AccidentIncidentRecord } from '../types';

export async function addAccidentIncidentRecord(data: z.infer<typeof accidentIncidentFormSchema>) {
    const parsed = accidentIncidentFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: "Invalid data provided." };
    }

    try {
        const { adaKorbanJiwa, jumlahKorbanJiwa, ...restOfData } = parsed.data;

        const korbanJiwaString = adaKorbanJiwa === 'Ada' 
            ? (jumlahKorbanJiwa || 'Ada, jumlah tidak specific') 
            : 'Tidak ada';

        const dataToSubmit = {
            ...restOfData,
            korbanJiwa: korbanJiwaString,
            tanggal: format(parsed.data.tanggal, 'yyyy-MM-dd'),
            createdAt: serverTimestamp(),
        };
        const docRef = await addDoc(collection(db, 'accidentIncidentRecords'), dataToSubmit);
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function updateAccidentIncidentRecord(id: string, data: z.infer<typeof accidentIncidentFormSchema>) {
    const parsed = accidentIncidentFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: "Invalid data provided." };
    }

    try {
        const docRef = doc(db, 'accidentIncidentRecords', id);

        const { adaKorbanJiwa, jumlahKorbanJiwa, ...restOfData } = parsed.data;
        const korbanJiwaString = adaKorbanJiwa === 'Ada' 
            ? (jumlahKorbanJiwa || 'Ada, jumlah tidak specific') 
            : 'Tidak ada';

        const dataToSubmit = {
            ...restOfData,
            korbanJiwa: korbanJiwaString,
            tanggal: format(parsed.data.tanggal, 'yyyy-MM-dd'),
        };
        await updateDoc(docRef, dataToSubmit);
       
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function deleteAccidentIncidentRecord(id: string) {
    try {
        await deleteDoc(doc(db, 'accidentIncidentRecords', id));
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}
