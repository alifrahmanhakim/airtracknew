
'use server';

import { db, auth } from '../firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { sendPasswordResetEmail, type AuthError } from "firebase/auth";
import type { User } from '../types';

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
