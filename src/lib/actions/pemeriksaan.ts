
'use server';

import { z } from 'zod';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { pemeriksaanFormSchema } from '../schemas';

export async function addPemeriksaanRecord(data: z.infer<typeof pemeriksaanFormSchema>) {
    const parsed = pemeriksaanFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: "Invalid data provided." };
    }

    try {
        const dataToSubmit = {
            ...parsed.data,
            tanggal: format(parsed.data.tanggal, 'yyyy-MM-dd'),
            createdAt: serverTimestamp(),
        };
        await addDoc(collection(db, 'pemeriksaanRecords'), dataToSubmit);
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}


export async function deletePemeriksaanRecord(id: string) {
    try {
        await deleteDoc(doc(db, 'pemeriksaanRecords', id));
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}
