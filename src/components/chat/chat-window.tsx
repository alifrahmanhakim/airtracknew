

'use client';

import * as React from 'react';
import { User, ChatMessage } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Send, User as UserIcon, Users as UsersIcon, Check, CheckCheck } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import { getOrCreateChatRoom, sendMessage, updateMessageReadStatus } from '@/lib/actions/chat';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TiptapToolbar } from '../ui/rich-text-input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface ChatWindowProps {
    currentUser: User;
    selectedUser: User | null;
}

const GLOBAL_CHAT_ROOM_ID = 'global_chat_room';

const ChatEditor = ({ content, onUpdate, onEnterPress, disabled }: { content: string; onUpdate: (content: string) => void; onEnterPress: () => void; disabled: boolean }) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: false,
            }),
        ],
        content: content,
        editorProps: {
            attributes: {
                class: 'prose dark:prose-invert prose-sm sm:prose-base max-w-none focus:outline-none p-3 min-h-[60px]',
            },
            handleKeyDown: (view, event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    onEnterPress();
                    return true;
                }
                return false;
            },
        },
        onUpdate: ({ editor }) => {
            onUpdate(editor.getHTML());
        },
    });
    
    React.useEffect(() => {
        if (editor) {
            editor.setEditable(!disabled);
        }
    }, [disabled, editor]);

     React.useEffect(() => {
        if (editor && editor.getHTML() !== content) {
            editor.commands.setContent(content, false);
        }
    }, [content, editor]);


    return (
        <div className="rounded-md border border-input focus-within:ring-2 focus-within:ring-ring flex-1 bg-background">
            <TiptapToolbar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
};

const MessageStatus = ({ message, currentUserId, selectedUserId }: { message: ChatMessage, currentUserId: string, selectedUserId: string | null }) => {
    if (message.senderId !== currentUserId) {
        return null;
    }
    
    const isRead = message.readBy && selectedUserId ? message.readBy.includes(selectedUserId) : false;

    if (isRead) {
        return (
            <Tooltip>
                <TooltipTrigger>
                    <CheckCheck className="h-4 w-4 text-blue-500" />
                </TooltipTrigger>
                <TooltipContent>
                    <p>Read</p>
                </TooltipContent>
            </Tooltip>
        );
    }
    
    return (
         <Tooltip>
            <TooltipTrigger>
                <Check className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>
                <p>Sent</p>
            </TooltipContent>
        </Tooltip>
    );
};


export function ChatWindow({ currentUser, selectedUser }: ChatWindowProps) {
    const [messages, setMessages] = React.useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = React.useState('');
    const [chatRoomId, setChatRoomId] = React.useState<string | null>(null);
    const scrollAreaRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (!selectedUser || !currentUser) return;

        let unsubscribe: (() => void) | undefined;

        const setupChatRoom = async () => {
            let roomId: string;
            if (selectedUser.id === GLOBAL_CHAT_ROOM_ID) {
                roomId = GLOBAL_CHAT_ROOM_ID;
            } else {
                roomId = await getOrCreateChatRoom(currentUser.id, selectedUser.id);
            }
            setChatRoomId(roomId);

            const messagesQuery = query(
                collection(db, 'chatRooms', roomId, 'messages'),
                orderBy('createdAt', 'asc')
            );

            unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
                const fetchedMessages: ChatMessage[] = [];
                const unreadMessages: { msgId: string, roomId: string }[] = [];

                snapshot.docs.forEach(doc => {
                    const msg = { id: doc.id, ...doc.data() } as ChatMessage;
                    fetchedMessages.push(msg);
                    if (msg.senderId !== currentUser.id && (!msg.readBy || !msg.readBy.includes(currentUser.id))) {
                        unreadMessages.push({ msgId: msg.id, roomId });
                    }
                });

                setMessages(fetchedMessages);

                // Mark messages as read
                if (unreadMessages.length > 0) {
                    unreadMessages.forEach(um => {
                        updateMessageReadStatus(um.roomId, um.msgId, currentUser.id);
                    });
                }
            });
        };

        setupChatRoom();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [selectedUser, currentUser]);
    
    React.useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({
                top: scrollAreaRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);
    
    const isMessageEmpty = (htmlString: string) => {
        if (!htmlString) return true;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlString;
        return tempDiv.textContent?.trim() === '';
    };

    const handleSendMessage = async () => {
        if (isMessageEmpty(newMessage) || !chatRoomId || !currentUser || !selectedUser) return;

        const messageData = {
            text: newMessage,
            senderName: currentUser.name,
            senderAvatarUrl: currentUser.avatarUrl,
        };

        await sendMessage(chatRoomId, currentUser.id, selectedUser.id, messageData);
        setNewMessage('');
    };

    if (!selectedUser) {
        return (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <p>Select a chat to start messaging</p>
            </div>
        );
    }

    const isGlobalChat = selectedUser.id === GLOBAL_CHAT_ROOM_ID;
    const isSelectedUserOnline = selectedUser.lastOnline ? (new Date().getTime() - new Date(selectedUser.lastOnline).getTime()) / (1000 * 60) < 5 : false;

    return (
        <TooltipProvider>
        <div className="flex-1 flex flex-col h-full">
            <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10" online={isGlobalChat ? undefined : isSelectedUserOnline}>
                        <AvatarImage src={selectedUser.avatarUrl} alt={selectedUser.name} />
                        <AvatarFallback>{isGlobalChat ? <UsersIcon /> : <UserIcon />}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{selectedUser.name}</p>
                         {isGlobalChat ? <p className="text-sm text-muted-foreground">Public channel for all users</p> : null}
                    </div>
                </div>
            </div>
            
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                <div className="space-y-6">
                    {messages.map((msg, index) => {
                        const isCurrentUser = msg.senderId === currentUser.id;
                        const showAvatar = index === 0 || messages[index - 1].senderId !== msg.senderId;
                        
                        return (
                            <div key={msg.id} className={cn("flex items-end gap-3", isCurrentUser && "justify-end")}>
                                {!isCurrentUser && (
                                    <Avatar className={cn("h-8 w-8", !showAvatar && "invisible")}>
                                        <AvatarImage src={msg.senderAvatarUrl} />
                                        <AvatarFallback>{msg.senderName?.[0]}</AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={cn(
                                    "p-3 rounded-lg max-w-xs md:max-w-md",
                                    isCurrentUser
                                        ? "bg-primary text-primary-foreground rounded-br-none"
                                        : "bg-muted rounded-bl-none"
                                )}>
                                    {!isCurrentUser && isGlobalChat && (
                                        <p className="text-xs font-bold mb-1">{msg.senderName}</p>
                                    )}
                                    <div className="text-sm prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: msg.text }} />
                                     <div className={cn("text-xs mt-1 flex items-center gap-1.5", isCurrentUser ? "text-primary-foreground/70 justify-end" : "text-muted-foreground")}>
                                         <span>{msg.createdAt ? format(msg.createdAt.toDate(), 'p') : ''}</span>
                                          {isCurrentUser && !isGlobalChat && <MessageStatus message={msg} currentUserId={currentUser.id} selectedUserId={selectedUser.id} />}
                                     </div>
                                </div>
                                 {isCurrentUser && (
                                    <Avatar className={cn("h-8 w-8", !showAvatar && "invisible")}>
                                        <AvatarImage src={msg.senderAvatarUrl} />
                                        <AvatarFallback>{msg.senderName?.[0]}</AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        )
                    })}
                </div>
            </ScrollArea>

            <div className="p-4 border-t">
                <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-start gap-2">
                    <ChatEditor 
                        content={newMessage}
                        onUpdate={setNewMessage}
                        onEnterPress={handleSendMessage}
                        disabled={!chatRoomId}
                    />
                    <Button type="submit" size="icon" disabled={isMessageEmpty(newMessage)}>
                        <Send />
                    </Button>
                </form>
            </div>
        </div>
        </TooltipProvider>
    );
}
