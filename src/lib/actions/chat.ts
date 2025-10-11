
'use server';

import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';

export async function sendMessage(chatRoomId: string, messageData: { text: string; senderId: string; senderName: string; senderAvatarUrl?: string }) {
    try {
        const messagesRef = collection(db, 'chatRooms', chatRoomId, 'messages');
        await addDoc(messagesRef, {
            ...messageData,
            createdAt: serverTimestamp(),
        });
        return { success: true };
    } catch (error) {
        console.error("Error sending message:", error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

export async function getOrCreateChatRoom(userId1: string, userId2: string): Promise<string> {
    const chatRoomsRef = collection(db, 'chatRooms');
    
    // Create a consistent ID for the chat room between two users
    const participants = [userId1, userId2].sort();
    const chatRoomId = participants.join('_');

    const chatRoomDocRef = doc(db, 'chatRooms', chatRoomId);
    const docSnap = await getDoc(chatRoomDocRef);

    if (docSnap.exists()) {
        return chatRoomId;
    } else {
        await setDoc(chatRoomDocRef, {
            participants: participants,
            createdAt: serverTimestamp(),
        });
        return chatRoomId;
    }
}
