
'use client';

import * as React from 'react';
import { User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Input } from '../ui/input';
import { Search, User as UserIcon } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns';

interface ChatSidebarProps {
    users: User[];
    currentUser: User;
    onSelectUser: (user: User) => void;
    chatRooms: any[];
    selectedUser: User | null;
}

export function ChatSidebar({ users, currentUser, onSelectUser, chatRooms, selectedUser }: ChatSidebarProps) {
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

    const filteredUsers = React.useMemo(() => {
        if (!searchTerm) return otherUsersInRooms;
        return otherUsersInRooms.filter(item =>
            item.user?.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [otherUsersInRooms, searchTerm]);

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

    return (
        <div className="w-1/3 border-r h-full flex flex-col">
            <div className="p-4 border-b">
                <h2 className="text-xl font-bold">Chats</h2>
                <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search chats..." 
                        className="pl-9"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <ScrollArea className="flex-1">
                {filteredUsers.map(({ user, lastMessage }) => user && (
                    <div
                        key={user.id}
                        className={cn(
                            "flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50",
                            selectedUser?.id === user.id && "bg-muted"
                        )}
                        onClick={() => onSelectUser(user)}
                    >
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                            <AvatarFallback><UserIcon /></AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                            <p className="font-semibold truncate">{user.name}</p>
                            <p className="text-sm text-muted-foreground truncate">{lastMessage?.text || 'No messages yet'}</p>
                        </div>
                        <div className="text-xs text-muted-foreground self-start">
                            {formatTimestamp(lastMessage?.createdAt)}
                        </div>
                    </div>
                ))}
            </ScrollArea>
        </div>
    );
}
