
'use server';

import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface CreateExportRecordPayload {
    documentType: string;
    exportedAt: any;
    exportedBy: {
        id: string;
        name: string;
    };
    filters: Record<string, any>;
}

export async function createExportRecord(payload: CreateExportRecordPayload) {
    try {
        const docRef = await addDoc(collection(db, 'exportedDocuments'), {
            ...payload,
            createdAt: serverTimestamp(),
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error creating export record:", error);
        return { success: false, error: 'Failed to create export record.' };
    }
}

    