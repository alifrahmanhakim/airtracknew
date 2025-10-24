
'use server';

import { z } from 'zod';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import type { Kegiatan } from '../types';

const kegiatanFormSchema = z.object({
    id: z.string().optional(),
    subjek: z.string().min(1, 'Subjek is required.'),
    tanggalMulai: z.string({ required_error: 'Start date is required.'}),
    tanggalSelesai: z.string({ required_error: 'End date is required.'}),
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

    const { id, ...kegiatanData } = parsed.data;

    try {
        if (id) {
            // Update existing record
            const docRef = doc(db, 'kegiatanRecords', id);
            await updateDoc(docRef, {
                ...kegiatanData,
                updatedAt: serverTimestamp(),
            });
            const updatedSnap = await getDoc(docRef);
            const updatedData = updatedSnap.data();
            const resultData: Kegiatan = {
                id: updatedSnap.id,
                ...updatedData,
                createdAt: updatedData?.createdAt.toDate().toISOString(),
                updatedAt: updatedData?.updatedAt.toDate().toISOString(),
            } as Kegiatan;
            return { success: true, data: resultData };

        } else {
            // Add new record
            const docRef = await addDoc(collection(db, 'kegiatanRecords'), {
                ...kegiatanData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            const newSnap = await getDoc(docRef);
            const newData = newSnap.data();
             const resultData: Kegiatan = {
                id: newSnap.id,
                ...newData,
                createdAt: newData?.createdAt.toDate().toISOString(),
                updatedAt: newData?.updatedAt.toDate().toISOString(),
            } as Kegiatan;
            return { success: true, data: resultData };
        }
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
