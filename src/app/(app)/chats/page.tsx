
'use client';

import * as React from 'react';
import { collection, query, where, onSnapshot, orderBy, collectionGroup, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User, ChatMessage, Project, Task } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { ChatWindow } from '@/components/chat/chat-window';
import { UserProfileDialog } from '@/components/chat/user-profile-dialog';

const GLOBAL_CHAT_USER: User = {
    id: 'global_chat_room',
    name: 'Global Chat',
    email: 'all@everyone',
    role: 'Functional',
    isApproved: true,
    avatarUrl: `https://placehold.co/100x100/87CEEB/FFFFFF?text=All`,
};

type AssignedTask = Task & {
  projectId: string;
  projectName: string;
  projectType: Project['projectType'];
};

export default function ChatsPage() {
    const [users, setUsers] = React.useState<User[]>([]);
    const [currentUser, setCurrentUser] = React.useState<User | null>(null);
    const [selectedUser, setSelectedUser] = React.useState<User | null>(GLOBAL_CHAT_USER);
    const [isLoading, setIsLoading] = React.useState(true);
    const [chatRooms, setChatRooms] = React.useState<any[]>([]);
    const [allProjects, setAllProjects] = React.useState<Project[]>([]);
    const [profileUser, setProfileUser] = React.useState<User | null>(null);

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
        
        const fetchProjects = async () => {
            const timKerjaPromise = getDocs(collection(db, 'timKerjaProjects'));
            const rulemakingPromise = getDocs(collection(db, 'rulemakingProjects'));
            
            const [timKerjaSnapshot, rulemakingSnapshot] = await Promise.all([timKerjaPromise, rulemakingPromise]);
            
            const projects: Project[] = [
                ...timKerjaSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), projectType: 'Tim Kerja' } as Project)),
                ...rulemakingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), projectType: 'Rulemaking' } as Project)),
            ];
            setAllProjects(projects);
        };
        fetchProjects();

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

    const assignedTasksForProfileUser = React.useMemo(() => {
        if (!profileUser || !allProjects) return [];

        const tasks: AssignedTask[] = [];
        allProjects.forEach(project => {
            (project.tasks || []).forEach(task => {
                if (task.assigneeIds && task.assigneeIds.includes(profileUser.id)) {
                    tasks.push({
                        ...task,
                        projectId: project.id,
                        projectName: project.name,
                        projectType: project.projectType,
                    });
                }
            });
        });
        return tasks.sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    }, [profileUser, allProjects]);
    
    const projectsForProfileUser = React.useMemo(() => {
        if (!profileUser || !allProjects) return [];
        return allProjects.filter(project => 
            project.team.some(member => member.id === profileUser.id)
        );
    }, [profileUser, allProjects]);


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
        <>
            <main className="p-4 md:p-8 h-[calc(100vh-80px)]">
                <Card className="h-full flex">
                    <ChatSidebar 
                        users={users} 
                        currentUser={currentUser}
                        onSelectUser={handleSelectUser}
                        onViewProfile={setProfileUser}
                        chatRooms={chatRooms}
                        selectedUser={selectedUser}
                        globalChatUser={GLOBAL_CHAT_USER}
                    />
                    <ChatWindow 
                        currentUser={currentUser} 
                        selectedUser={selectedUser} 
                        onViewProfile={setProfileUser}
                    />
                </Card>
            </main>
            {/* The UserProfileDialog is now in the global layout, so it's removed from here */}
        </>
    );
}
