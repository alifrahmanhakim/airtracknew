
'use client';

import * as React from 'react';
import { User, ChatMessage } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Send, User as UserIcon, Users as UsersIcon, Check, CheckCheck, Video, Loader2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import { getOrCreateChatRoom, sendMessage, updateMessageReadStatus } from '@/lib/actions/chat';
import { collection, query, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, formatDistanceToNow } from 'date-fns';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TiptapToolbar } from '../ui/rich-text-input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { createGoogleMeet } from '@/lib/actions/meet';
import { useToast } from '@/hooks/use-toast';

interface ChatWindowProps {
    currentUser: User;
    selectedUser: User | null;
    onViewProfile: (user: User) => void;
}

const GLOBAL_CHAT_ROOM_ID = 'global_chat_room';

type ChatEditorHandle = {
    clearContent: () => void;
    getHTML: () => string;
};

const ChatEditor = React.forwardRef<ChatEditorHandle, { onEnterPress: (content: string) => void }>(
    ({ onEnterPress }, ref) => {
        const editor = useEditor({
            extensions: [
                StarterKit.configure({
                    heading: false,
                }),
            ],
            content: '',
            editorProps: {
                attributes: {
                    class: 'prose dark:prose-invert prose-sm sm:prose-base max-w-none focus:outline-none p-3 min-h-[60px]',
                },
            },
        });

        React.useEffect(() => {
            const handleKeyDown = (event: KeyboardEvent) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    if (editor && editor.getText().trim()) {
                       onEnterPress(editor.getHTML());
                    }
                }
            };
            editor?.view.dom.addEventListener('keydown', handleKeyDown);
            return () => editor?.view.dom.removeEventListener('keydown', handleKeyDown);
        }, [editor, onEnterPress]);


        React.useImperativeHandle(ref, () => ({
            clearContent: () => editor?.commands.clearContent(),
            getHTML: () => editor?.getHTML() || '',
        }));

        return (
            <div className="rounded-md border border-input focus-within:ring-2 focus-within:ring-ring flex-1 bg-background">
                <TiptapToolbar editor={editor} />
                <EditorContent editor={editor} />
            </div>
        );
    }
);
ChatEditor.displayName = 'ChatEditor';


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


export function ChatWindow({ currentUser, selectedUser, onViewProfile }: ChatWindowProps) {
    const [messages, setMessages] = React.useState<ChatMessage[]>([]);
    const [chatRoomId, setChatRoomId] = React.useState<string | null>(null);
    const scrollAreaRef = React.useRef<HTMLDivElement>(null);
    const chatEditorRef = React.useRef<ChatEditorHandle>(null);
    const [allUsers, setAllUsers] = React.useState<User[]>([]);
    const [isMeetLoading, setIsMeetLoading] = React.useState(false);
    const { toast } = useToast();

    React.useEffect(() => {
        const usersUnsub = onSnapshot(collection(db, 'users'), (snapshot) => {
            const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            setAllUsers(usersList);
        });
        return () => usersUnsub();
    }, []);

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
        if (typeof document === 'undefined') {
            return htmlString.replace(/<[^>]*>?/gm, '').trim() === '';
        }
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlString;
        return tempDiv.textContent?.trim() === '';
    };

    const handleSendMessage = async (content: string) => {
        if (isMessageEmpty(content) || !chatRoomId || !currentUser || !selectedUser) return;

        const messageData = {
            text: content,
            senderName: currentUser.name,
            senderAvatarUrl: currentUser.avatarUrl,
        };

        await sendMessage(chatRoomId, currentUser.id, selectedUser.id, messageData);
        chatEditorRef.current?.clearContent();
    };

    const handleCreateMeet = async () => {
        if (!selectedUser || !currentUser.email || !selectedUser.email || isGlobalChat) return;

        setIsMeetLoading(true);
        const result = await createGoogleMeet({
            userId: currentUser.id,
            summary: `Meeting with ${selectedUser.name}`,
            description: `Quick meeting arranged via AirTrack.`,
            attendees: [
                { email: currentUser.email },
                { email: selectedUser.email }
            ]
        });

        if (result.authUrl) {
            // Open a new window for the user to authorize the app
            window.open(result.authUrl, '_blank', 'width=500,height=600');
            toast({
                title: 'Authorization Required',
                description: 'Please authorize access to your Google Calendar in the new window. After authorizing, try creating the meeting again.',
            });
            setIsMeetLoading(false);
        } else if (result.meetLink && chatRoomId) {
            const meetMessage = `I've created a Google Meet for us: <a href="${result.meetLink}" target="_blank" rel="noopener noreferrer" style="color: hsl(var(--primary)); text-decoration: underline;">${result.meetLink}</a>`;
            handleSendMessage(meetMessage);
            setIsMeetLoading(false);
        } else if (result.error) {
            toast({
                variant: 'destructive',
                title: 'Could not create meeting',
                description: result.error,
            });
            setIsMeetLoading(false);
        }
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
                    <div onClick={() => !isGlobalChat && onViewProfile(selectedUser)} className={cn(!isGlobalChat && "cursor-pointer")}>
                        <Avatar className="h-10 w-10" online={isGlobalChat ? undefined : isSelectedUserOnline}>
                            <AvatarImage src={selectedUser.avatarUrl} alt={selectedUser.name} />
                            <AvatarFallback>{isGlobalChat ? <UsersIcon /> : <UserIcon />}</AvatarFallback>
                        </Avatar>
                    </div>
                    <div>
                        <p className="font-semibold">{selectedUser.name}</p>
                         {isGlobalChat ? (
                             <p className="text-sm text-muted-foreground">Public channel for all users</p>
                         ) : (
                             <p className="text-sm text-muted-foreground">
                                {isSelectedUserOnline 
                                    ? 'Online' 
                                    : selectedUser.lastOnline 
                                        ? `Offline - last seen ${formatDistanceToNow(new Date(selectedUser.lastOnline), { addSuffix: true })}`
                                        : 'Offline'
                                }
                            </p>
                         )}
                    </div>
                </div>
                 {!isGlobalChat && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <Button variant="ghost" size="icon" onClick={handleCreateMeet} disabled={isMeetLoading}>
                                {isMeetLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Video className="h-5 w-5" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Create Google Meet</p>
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>
            
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                <div className="space-y-6">
                    {messages.map((msg, index) => {
                        const isCurrentUser = msg.senderId === currentUser.id;
                        const showAvatar = index === 0 || messages[index - 1].senderId !== msg.senderId;
                        const fullSender = allUsers.find(u => u.id === msg.senderId);
                        
                        return (
                            <div key={msg.id} className={cn("flex items-end gap-3", isCurrentUser && "justify-end")}>
                                {!isCurrentUser && (
                                    <div className={cn("cursor-pointer", !showAvatar && "invisible")} onClick={() => fullSender && onViewProfile(fullSender)}>
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={msg.senderAvatarUrl} />
                                            <AvatarFallback>{msg.senderName?.[0]}</AvatarFallback>
                                        </Avatar>
                                    </div>
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
                                     <div className={cn("cursor-pointer", !showAvatar && "invisible")} onClick={() => onViewProfile(currentUser)}>
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={msg.senderAvatarUrl} />
                                            <AvatarFallback>{msg.senderName?.[0]}</AvatarFallback>
                                        </Avatar>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </ScrollArea>

            <div className="p-4 border-t">
                 <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (chatEditorRef.current) {
                           handleSendMessage(chatEditorRef.current.getHTML());
                        }
                    }}
                    className="flex items-start gap-2"
                    >
                    <ChatEditor
                        ref={chatEditorRef}
                        onEnterPress={handleSendMessage}
                    />
                    <Button type="submit" size="icon">
                        <Send />
                    </Button>
                </form>
            </div>
        </div>
        </TooltipProvider>
    );
}
