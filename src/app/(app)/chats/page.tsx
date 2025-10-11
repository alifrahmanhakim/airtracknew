
'use client';

import * as React from 'react';
import { collection, query, where, onSnapshot, orderBy, collectionGroup, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User, ChatMessage } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { ChatWindow } from '@/components/chat/chat-window';

export default function ChatsPage() {
    const [users, setUsers] = React.useState<User[]>([]);
    const [currentUser, setCurrentUser] = React.useState<User | null>(null);
    const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [chatRooms, setChatRooms] = React.useState<any[]>([]);

    React.useEffect(() => {
        const loggedInUserId = localStorage.getItem('loggedInUserId');
        if (!loggedInUserId) {
            setIsLoading(false);
            return;
        }

        const usersQuery = query(collection(db, 'users'));
        const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
            const usersFromDb: User[] = [];
            snapshot.forEach(doc => {
                const userData = { id: doc.id, ...doc.data() } as User;
                if (userData.id === loggedInUserId) {
                    setCurrentUser(userData);
                } else {
                    usersFromDb.push(userData);
                }
            });
            setUsers(usersFromDb);
            setIsLoading(false);
        });

        return () => unsubscribeUsers();
    }, []);
    
    React.useEffect(() => {
        if (!currentUser) return;

        const chatRoomsQuery = query(
            collection(db, 'chatRooms'),
            where('participants', 'array-contains', currentUser.id)
        );

        const unsubscribe = onSnapshot(chatRoomsQuery, (snapshot) => {
            const rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            const lastMessagesPromises = rooms.map(room => {
                return new Promise(resolve => {
                    const messagesQuery = query(
                        collection(db, 'chatRooms', room.id, 'messages'),
                        orderBy('createdAt', 'desc'),
                        limit(1)
                    );
                    onSnapshot(messagesQuery, (messagesSnapshot) => {
                        if (!messagesSnapshot.empty) {
                            resolve({ ...room, lastMessage: messagesSnapshot.docs[0].data() });
                        } else {
                            resolve({ ...room, lastMessage: null });
                        }
                    });
                })
            });

            Promise.all(lastMessagesPromises).then(roomsWithMessages => {
                const sortedRooms = roomsWithMessages.sort((a: any, b: any) => {
                    const timeA = a.lastMessage?.createdAt?.toDate() || new Date(0);
                    const timeB = b.lastMessage?.createdAt?.toDate() || new Date(0);
                    return timeB - timeA;
                });
                setChatRooms(sortedRooms);
            });
        });
        
        return () => unsubscribe();
    }, [currentUser]);


    if (isLoading) {
        return <div className="p-8">Loading Chats...</div>;
    }

    if (!currentUser) {
        return <div className="p-8">Please log in to view chats.</div>
    }

    const handleSelectUser = (user: User) => {
        setSelectedUser(user);
    };

    return (
        <main className="p-4 md:p-8 h-[calc(100vh-80px)]">
            <Card className="h-full flex">
                <ChatSidebar 
                    users={users} 
                    currentUser={currentUser}
                    onSelectUser={handleSelectUser}
                    chatRooms={chatRooms}
                    selectedUser={selectedUser}
                />
                <ChatWindow 
                    currentUser={currentUser} 
                    selectedUser={selectedUser} 
                />
            </Card>
        </main>
    );
}
