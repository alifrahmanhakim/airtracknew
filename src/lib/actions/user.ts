

'use server';

import { db, auth } from '../firebase';
import { doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { sendPasswordResetEmail, type AuthError } from "firebase/auth";
import type { User } from '../types';

export async function updateUser(userId: string, data: Partial<Pick<User, 'role' | 'department'>>) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, data);
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to update user.' };
    }
}

export async function updateUserRole(userId: string, role: User['role']) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { role });
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to update user role.' };
    }
}

export async function updateUserApproval(userId: string, isApproved: boolean) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { isApproved });
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to update user approval status.' };
    }
}

export async function deleteUser(userId: string) {
    try {
        await deleteDoc(doc(db, 'users', userId));
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to delete user.' };
    }
}

export async function updateUserProfile(userId: string, name: string) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { name });
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to update profile.' };
  }
}

export async function updateUserProfileImage(userId: string, { dataUrl }: { dataUrl: string }) {
    try {
        const avatarUrl = await uploadAndGetUrl(`avatars/${userId}`, dataUrl);
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { avatarUrl });
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            return { success: true, user: { id: userSnap.id, ...userSnap.data() } as User };
        }
        return { success: false, error: 'User data not found after update.' };
    } catch (error) {
        return { success: false, error: 'Failed to update avatar.' };
    }
}

export async function updateUserHeaderImage(userId: string, { dataUrl }: { dataUrl: string }) {
    try {
        const headerImageUrl = await uploadAndGetUrl(`headers/${userId}`, dataUrl);
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { headerImageUrl });
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            return { success: true, user: { id: userSnap.id, ...userSnap.data() } as User };
        }
        return { success: false, error: 'User data not found after update.' };
    } catch (error) {
        return { success: false, error: 'Failed to update header image.' };
    }
}

async function uploadAndGetUrl(path: string, dataUrl: string) {
    const { getStorage, ref, uploadString, getDownloadURL } = await import('firebase/storage');
    const storage = getStorage();
    const storageRef = ref(storage, path);
    
    // Extract mime type and base64 data
    const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!match) {
        throw new Error("Invalid data URL format.");
    }
    const contentType = match[1];
    const base64Data = match[2];

    await uploadString(storageRef, base64Data, 'base64', { contentType });
    return getDownloadURL(storageRef);
}


export async function sendPasswordReset(email: string) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    const authError = error as AuthError;
    console.error("Firebase Password Reset Error:", authError.code, authError.message);
    
    switch (authError.code) {
        case 'auth/invalid-email':
            return { success: false, error: 'The email address is not valid.' };
        case 'auth/user-not-found':
            return { success: false, error: 'No user found with this email address.' };
        case 'auth/missing-email':
            return { success: false, error: 'Email address is missing.' };
        case 'auth/network-request-failed':
             return { success: false, error: 'Network error. Please check your connection and try again.' };
        default:
            return { 
                success: false, 
                error: 'Failed to send email. Please check your Firebase project settings (e.g., email templates are enabled).' 
            };
    }
  }
}

export async function updateUserOnlineStatus(userId: string) {
    if (!userId) return;
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            lastOnline: new Date().toISOString()
        });
        return { success: true };
    } catch (error) {
        // We don't want to show an error for this background task
        console.warn('Failed to update online status:', error);
        return { success: false };
    }
}
