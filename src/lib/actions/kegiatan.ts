
'use server';

import { z } from 'zod';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import type { Kegiatan, Project, Task, User } from '../types';
import { addTimKerjaProject } from './project';
import { format } from 'date-fns';

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

const PROJECT_NAME = "Kegiatan Subdirektorat";

async function getOrCreateKegiatanProject(allUsers: User[]): Promise<Project> {
    const projectQuery = query(collection(db, "timKerjaProjects"), where("name", "==", PROJECT_NAME));
    const querySnapshot = await getDocs(projectQuery);

    if (!querySnapshot.empty) {
        const projectDoc = querySnapshot.docs[0];
        return { ...projectDoc.data(), id: projectDoc.id } as Project;
    } else {
        // Project doesn't exist, create it.
        const projectData = {
            name: PROJECT_NAME,
            description: "Proyek untuk menampung semua kegiatan rutin Subdirektorat Standardisasi.",
            ownerId: allUsers.find(u => u.role === 'Sub-Directorate Head')?.id || allUsers[0]?.id || 'system',
            startDate: format(new Date(), 'yyyy-MM-dd'),
            endDate: format(new Date(new Date().setFullYear(new Date().getFullYear() + 5)), 'yyyy-MM-dd'),
            status: 'On Track' as const,
            team: allUsers.map(u => u.id), // Pass user IDs
            tags: ['Internal'],
        };
        const result = await addTimKerjaProject(projectData);
        if (result.success && result.id) {
             const newProject: Project = {
                ...projectData,
                id: result.id,
                projectType: 'Tim Kerja',
                tasks: [],
                documents: [],
                subProjects: [],
                checklist: [],
                team: allUsers,
                createdAt: new Date().toISOString(),
             };
             return newProject;
        } else {
            throw new Error(result.error || "Failed to create the main 'Kegiatan Subdirektorat' project.");
        }
    }
}


export async function addKegiatan(data: KegiatanFormValues, allUsers: User[]) {
    const parsed = kegiatanFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: "Invalid data provided." };
    }
    
    try {
        const kegiatanProject = await getOrCreateKegiatanProject(allUsers);
        const { id, subjek, ...rest } = parsed.data;

        const newTask: Task = {
            id: `task-${Date.now()}`,
            title: subjek,
            assigneeIds: rest.nama,
            startDate: rest.tanggalMulai,
            dueDate: rest.tanggalSelesai,
            status: 'To Do',
            parentId: null,
            subTasks: [],
            // 'lokasi' and 'catatan' could be stored in a description field or custom fields if needed
        };

        const updatedTasks = [...(kegiatanProject.tasks || []), newTask];

        const projectRef = doc(db, 'timKerjaProjects', kegiatanProject.id);
        await updateDoc(projectRef, { tasks: updatedTasks });
        
        const updatedProject: Project = {
            ...kegiatanProject,
            tasks: updatedTasks
        };
        
        return { success: true, data: updatedProject };

    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

// Kept for compatibility, but might be deprecated if tasks are managed through project actions
export async function deleteKegiatan(id: string) {
    try {
        await deleteDoc(doc(db, 'kegiatanRecords', id));
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}
