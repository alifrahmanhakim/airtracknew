
'use server';

import { z } from 'zod';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { Kegiatan } from '../types';

const kegiatanFormSchema = z.object({
    id: z.string().optional(),
    subjek: z.string().min(1, 'Subjek is required.'),
    tanggalMulai: z.date({ required_error: 'Start date is required.'}),
    tanggalSelesai: z.date({ required_error: 'End date is required.'}),
    nama: z.array(z.string()).min(1, 'At least one name is required.'),
    lokasi: z.string().min(1, 'Lokasi is required.'),
    catatan: z.string().optional(),
});

type KegiatanFormValues = z.infer<typeof kegiatanFormSchema>;

export async function addKegiatan(data: KegiatanFormValues) {
    const parsed = kegiatanFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: "Invalid data provided." };
    }
    
    try {
        const docRef = await addDoc(collection(db, 'kegiatanRecords'), {
            ...parsed.data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        
        const newRecord: Kegiatan = {
            id: docRef.id,
            ...parsed.data,
            tanggalMulai: parsed.data.tanggalMulai.toISOString(),
            tanggalSelesai: parsed.data.tanggalSelesai.toISOString(),
            createdAt: new Date().toISOString(),
        }

        return { success: true, data: newRecord };

    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function updateKegiatan(id: string, data: KegiatanFormValues) {
    const parsed = kegiatanFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: "Invalid data provided." };
    }
    try {
        const docRef = doc(db, 'kegiatanRecords', id);
        await updateDoc(docRef, {
            ...parsed.data,
            updatedAt: serverTimestamp(),
        });

        const updatedRecord: Kegiatan = {
            id,
            ...parsed.data,
            tanggalMulai: parsed.data.tanggalMulai.toISOString(),
            tanggalSelesai: parsed.data.tanggalSelesai.toISOString(),
            createdAt: new Date().toISOString(), // This is not ideal but needed for client update
        }
        return { success: true, data: updatedRecord };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function deleteKegiatan(id: string) {
    try {
        await deleteDoc(doc(db, 'kegiatanRecords', id));
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}
