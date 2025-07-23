
'use server';

import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Notification } from '../types';

type CreateNotificationPayload = Omit<Notification, 'id' | 'createdAt' | 'isRead'>;

export async function createNotification(payload: CreateNotificationPayload) {
  try {
    // Store notifications as a subcollection of the user
    const notificationRef = collection(db, 'users', payload.userId, 'notifications');
    await addDoc(notificationRef, {
      ...payload,
      isRead: false,
      createdAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error creating notification:", error);
    return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
}
