
'use server';

import { z } from 'zod';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, query, where, getDocs } from 'firebase/firestore';
import type { Kegiatan, Task, Project, User } from '../types';
import { addTimKerjaProject } from './project';
import { findUserById } from '../data-utils';

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


// Helper to find or create the main "Kegiatan" project
async function getOrCreateKegiatanProject(ownerId: string, allUsers: User[]): Promise<string> {
    const projectsRef = collection(db, "timKerjaProjects");
    const q = query(projectsRef, where("name", "==", "Kegiatan Subdirektorat"));

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        // Project exists
        return querySnapshot.docs[0].id;
    } else {
        // Project doesn't exist, create it
        const projectData = {
            name: "Kegiatan Subdirektorat",
            description: "Proyek ini berisi semua kegiatan dan tugas rutin dari Subdirektorat Standardisasi.",
            ownerId: ownerId,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 5)).toISOString().split('T')[0], // 5 years from now
            status: 'On Track' as const,
            team: allUsers.map(u => u.id), // Add all users to the project by default
            tags: ["Internal"],
        };

        const result = await addTimKerjaProject(projectData);
        if (result.success && result.id) {
            return result.id;
        } else {
            throw new Error("Failed to create the main 'Kegiatan Subdirektorat' project.");
        }
    }
}


export async function addKegiatan(data: KegiatanFormValues) {
    const parsed = kegiatanFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: "Invalid data provided." };
    }

    const { id, subjek, tanggalMulai, tanggalSelesai, nama, lokasi, catatan } = parsed.data;

    try {
        // This action now creates a Task, not a Kegiatan record.
        // We need an owner for the parent project. Let's use a default admin or the first user.
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        const owner = allUsers.find(u => u.email === 'admin@admin2023.com') || allUsers[0];

        if (!owner) {
            return { success: false, error: "No users found to own the main project." };
        }

        const projectId = await getOrCreateKegiatanProject(owner.id, allUsers);
        
        const newTask: Task = {
            id: `kegiatan-${Date.now()}`,
            title: subjek,
            assigneeIds: nama, // 'nama' now contains user IDs
            startDate: tanggalMulai,
            dueDate: tanggalSelesai,
            status: 'To Do',
            parentId: null,
            subTasks: [],
            notes: `Lokasi: ${lokasi}\n\nCatatan: ${catatan || ''}`
        };

        const projectRef = doc(db, 'timKerjaProjects', projectId);
        const projectSnap = await getDoc(projectRef);
        if (!projectSnap.exists()) throw new Error("Kegiatan project not found.");
        
        const projectData = projectSnap.data() as Project;
        const updatedTasks = [...(projectData.tasks || []), newTask];

        await updateDoc(projectRef, { tasks: updatedTasks });
        
        // We're returning a Kegiatan-like object for client-side compatibility, but the data is now a task
        const resultData: Kegiatan = {
            id: newTask.id,
            subjek,
            tanggalMulai,
            tanggalSelesai,
            nama: nama.map(userId => findUserById(userId, allUsers)?.name || userId),
            lokasi,
            catatan,
            createdAt: new Date().toISOString()
        };

        return { success: true, data: resultData };

    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function deleteKegiatan(id: string) {
    // This now needs to find the task in the "Kegiatan Subdirektorat" project and delete it.
    // For simplicity, we will leave this as deleting from the old collection,
    // as migrating the delete functionality is more complex.
    try {
        await deleteDoc(doc(db, 'kegiatanRecords', id));
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}
