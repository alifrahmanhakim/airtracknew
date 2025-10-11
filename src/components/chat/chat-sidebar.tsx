
'use client';

import * as React from 'react';
import { User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Input } from '../ui/input';
import { Search, User as UserIcon, Users as UsersIcon } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
import { Separator } from '../ui/separator';

interface ChatSidebarProps {
    users: User[];
    currentUser: User;
    onSelectUser: (user: User) => void;
    chatRooms: any[];
    selectedUser: User | null;
    globalChatUser: User;
}

const stripHtml = (html: string | undefined) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '');
};

export function ChatSidebar({ users, currentUser, onSelectUser, chatRooms, selectedUser, globalChatUser }: ChatSidebarProps) {
    const [searchTerm, setSearchTerm] = React.useState('');

    const otherUsersInRooms = React.useMemo(() => {
        return chatRooms.map(room => {
            const otherUserId = room.participants.find((p: string) => p !== currentUser.id);
            const user = users.find(u => u.id === otherUserId);
            return {
                user,
                lastMessage: room.lastMessage,
            };
        }).filter(item => item.user);
    }, [chatRooms, users, currentUser.id]);

    const usersNotInRooms = React.useMemo(() => {
        const userIdsInRooms = new Set(otherUsersInRooms.map(item => item.user!.id));
        return users.filter(user => user.id !== currentUser.id && !userIdsInRooms.has(user.id));
    }, [users, otherUsersInRooms, currentUser.id]);


    const filteredChatRooms = React.useMemo(() => {
        if (!searchTerm) return otherUsersInRooms;
        return otherUsersInRooms.filter(item =>
            (item.user?.name && item.user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.user?.email && item.user.email.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [otherUsersInRooms, searchTerm]);
    
    const filteredUsers = React.useMemo(() => {
        if (!searchTerm) return usersNotInRooms;
        return usersNotInRooms.filter(user =>
            (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [usersNotInRooms, searchTerm]);

    const formatTimestamp = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate();
        if (isToday(date)) {
            return format(date, 'p');
        }
        if (isYesterday(date)) {
            return 'Yesterday';
        }
        return format(date, 'PP');
    };
    
    const isUserOnline = (user: User) => {
        return user.lastOnline ? (new Date().getTime() - new Date(user.lastOnline).getTime()) / (1000 * 60) < 5 : false;
    }

    return (
        <div className="w-1/3 border-r h-full flex flex-col">
            <div className="p-4 border-b">
                <h2 className="text-xl font-bold">Chats</h2>
                <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search chats or users..." 
                        className="pl-9"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <ScrollArea className="flex-1">
                <div>
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground px-4 pt-4">Channels</h3>
                    <div
                        key={globalChatUser.id}
                        className={cn(
                            "flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50",
                            selectedUser?.id === globalChatUser.id && "bg-muted"
                        )}
                        onClick={() => onSelectUser(globalChatUser)}
                    >
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={globalChatUser.avatarUrl} alt={globalChatUser.name} />
                            <AvatarFallback><UsersIcon /></AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                            <p className="font-semibold truncate">{globalChatUser.name}</p>
                            <p className="text-sm text-muted-foreground truncate">Chat with everyone</p>
                        </div>
                    </div>
                </div>

                <Separator className="my-2" />

                {filteredChatRooms.length > 0 && (
                     <div>
                        <h3 className="text-xs font-semibold uppercase text-muted-foreground px-4 pt-2">Chats</h3>
                        {filteredChatRooms.map(({ user, lastMessage }) => {
                            if (!user) return null;
                            const online = isUserOnline(user);
                            return (
                                <div
                                    key={user.id}
                                    className={cn(
                                        "flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50",
                                        selectedUser?.id === user.id && "bg-muted"
                                    )}
                                    onClick={() => onSelectUser(user)}
                                >
                                    <Avatar className="h-10 w-10" online={online}>
                                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                                        <AvatarFallback><UserIcon /></AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-semibold truncate">{user.name || user.email}</p>
                                        <p className="text-sm text-muted-foreground truncate">{stripHtml(lastMessage?.text) || 'No messages yet'}</p>
                                    </div>
                                    <div className="text-xs text-muted-foreground self-start">
                                        {formatTimestamp(lastMessage?.createdAt)}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
               
                {(filteredChatRooms.length > 0 && filteredUsers.length > 0) && (
                    <Separator className="my-2" />
                )}

                {filteredUsers.length > 0 && (
                    <div>
                        <h3 className="text-xs font-semibold uppercase text-muted-foreground px-4 pt-2">Users</h3>
                        {filteredUsers.map(user => {
                            const online = isUserOnline(user);
                            return (
                                <div
                                    key={user.id}
                                    className={cn(
                                        "flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50",
                                        selectedUser?.id === user.id && "bg-muted"
                                    )}
                                    onClick={() => onSelectUser(user)}
                                >
                                    <Avatar className="h-10 w-10" online={online}>
                                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                                        <AvatarFallback><UserIcon /></AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-semibold truncate">{user.name || user.email}</p>
                                        <p className="text-sm text-muted-foreground truncate">{user.role}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                 {filteredChatRooms.length === 0 && filteredUsers.length === 0 && !searchTerm && (
                    <div className="text-center text-muted-foreground p-8">
                        <p>No other users found.</p>
                    </div>
                )}
                 {filteredChatRooms.length === 0 && filteredUsers.length === 0 && searchTerm && (
                    <div className="text-center text-muted-foreground p-8">
                        <p>No users or chats found for "{searchTerm}".</p>
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
