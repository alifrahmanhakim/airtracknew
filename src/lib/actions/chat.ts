

'use server';

import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { createNotification } from './notifications';
import type { User } from '../types';

const GLOBAL_CHAT_ROOM_ID = 'global_chat_room';

const getCurrentUser = async (userId: string): Promise<User | null> => {
    if (!userId) return null;
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() } as User;
    }
    return null;
}

export async function sendMessage(chatRoomId: string, senderId: string, receiverId: string, messageData: { text: string; senderName: string; senderAvatarUrl?: string }) {
    try {
        const messagesRef = collection(db, 'chatRooms', chatRoomId, 'messages');
        const sender = await getCurrentUser(senderId);

        await addDoc(messagesRef, {
            ...messageData,
            senderId: senderId,
            createdAt: serverTimestamp(),
            readBy: [senderId], // Sender has implicitly "read" it
        });
        
        // Don't send a notification if it's a message to the global chat room
        if (sender && chatRoomId !== GLOBAL_CHAT_ROOM_ID) {
            await createNotification({
                userId: receiverId,
                title: `New message from ${sender.name}`,
                description: messageData.text,
                href: `/chats`,
                actor: {
                    id: sender.id,
                    name: sender.name,
                    avatarUrl: sender.avatarUrl,
                }
            })
        }

        return { success: true };
    } catch (error) {
        console.error("Error sending message:", error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

export async function updateMessageReadStatus(chatRoomId: string, messageId: string, userId: string) {
    try {
        const messageRef = doc(db, 'chatRooms', chatRoomId, 'messages', messageId);
        await updateDoc(messageRef, {
            readBy: arrayUnion(userId)
        });
        return { success: true };
    } catch (error) {
         console.error("Error updating read status:", error);
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
