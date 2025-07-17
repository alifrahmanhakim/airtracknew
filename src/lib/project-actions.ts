
'use server';

import {
  doc,
  updateDoc,
  collection,
  addDoc,
  getDoc,
  deleteDoc,
  getDocs,
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { db } from './firebase';
import type { Project, User } from './types';

export async function updateProject(
  projectId: string,
  projectType: Project['projectType'],
  projectData: Partial<Omit<Project, 'id'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const collectionName =
      projectType === 'Rulemaking' ? 'rulemakingProjects' : 'timKerjaProjects';
    const projectRef = doc(db, collectionName, projectId);

    const updateData: { [key: string]: any } = { ...projectData };

    if (projectData.team) {
      updateData.team = projectData.team.map((member) => ({
        id: member.id,
        name: member.name || 'Unnamed User',
        role: member.role || 'Functional',
        avatarUrl: member.avatarUrl || `https://placehold.co/100x100.png`,
      }));
    }

    await updateDoc(projectRef, updateData);
    revalidatePath(
      `/projects/${projectId}?type=${projectType.toLowerCase().replace(' ', '')}`
    );
    revalidatePath('/dashboard');
    revalidatePath('/rulemaking');
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: `Failed to update project: ${message}` };
  }
}
