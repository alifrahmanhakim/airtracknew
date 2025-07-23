
'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, onSnapshot, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User, ChatMessage } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2, User as UserIcon, MessageSquare, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendChatMessage } from '@/lib/actions/chat';
import { doc, getDoc, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

type ChatTarget = {
    id: string;
    name: string;
    avatarUrl: string;
    type: 'global' | 'private';
}

const getPrivateChatRoomId = (userId1: string, userId2: string) => {
    return [userId1, userId2].sort().join('_');
};


function ChatPageContent() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSending, setIsSending] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [allUsers, setAllUsers] = React.useState<User[]>([]);
  const searchParams = useSearchParams();
  
  const [activeChat, setActiveChat] = React.useState<ChatTarget>({
      id: 'global',
      name: 'Global Chat',
      avatarUrl: '', // No avatar for global chat
      type: 'global'
  });

  const { toast } = useToast();
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const fetchInitialData = async () => {
      const userId = localStorage.getItem('loggedInUserId');
      if (userId) {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setCurrentUser({ id: userSnap.id, ...userSnap.data() } as User);
        }
      }
      
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      const users: User[] = [];
      usersSnapshot.forEach(doc => {
          if (doc.id !== userId) { // Exclude current user from the list
              users.push({ id: doc.id, ...doc.data() } as User);
          }
      });
      setAllUsers(users);
    };
    fetchInitialData();
  }, []);

  React.useEffect(() => {
    if (allUsers.length > 0) {
      const userIdFromQuery = searchParams.get('user');
      if (userIdFromQuery) {
        const targetUser = allUsers.find(u => u.id === userIdFromQuery);
        if (targetUser) {
          setActiveChat({
            id: targetUser.id,
            name: targetUser.name,
            avatarUrl: targetUser.avatarUrl,
            type: 'private',
          });
        }
      }
    }
  }, [allUsers, searchParams]);

  React.useEffect(() => {
    if (!currentUser) return;
    
    setIsLoading(true);

    const chatRoomId = activeChat.type === 'private'
        ? getPrivateChatRoomId(currentUser.id, activeChat.id)
        : 'global';
        
    const q = query(collection(db, `chats/${chatRoomId}/messages`), orderBy('createdAt', 'asc'), limit(100));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs: ChatMessage[] = [];
      querySnapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      setMessages(msgs);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching chat messages:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load chat messages.',
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [activeChat, currentUser, toast]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !currentUser) return;

    setIsSending(true);
    
    const chatRoomId = activeChat.type === 'private'
      ? getPrivateChatRoomId(currentUser.id, activeChat.id)
      : 'global';

    const result = await sendChatMessage({
      chatRoomId,
      text: newMessage,
      senderId: currentUser.id,
      senderName: currentUser.name || "Unknown User",
      senderAvatarUrl: currentUser.avatarUrl || "",
    });

    if (result.success) {
      setNewMessage('');
    } else {
      toast({
        variant: 'destructive',
        title: 'Error sending message',
        description: result.error,
      });
    }
    setIsSending(false);
  };
  
  const getFormattedTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    if (timestamp instanceof Timestamp) {
        return format(timestamp.toDate(), 'p');
    }
    return '';
  }

  return (
    <div className="p-4 md:p-8 h-[calc(100vh-6rem)]">
      <div className="h-full flex gap-6">
        {/* Sidebar */}
        <Card className="w-1/3 lg:w-1/4 flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5"/> Contacts</CardTitle>
                <CardDescription>Select a chat</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-2 overflow-hidden">
                <ScrollArea className="h-full">
                    <div className="space-y-1">
                        <Button 
                            variant={activeChat.id === 'global' ? 'secondary' : 'ghost'} 
                            className="w-full justify-start gap-3"
                            onClick={() => setActiveChat({ id: 'global', name: 'Global Chat', avatarUrl: '', type: 'global' })}
                        >
                            <Avatar className="h-8 w-8">
                                <AvatarFallback><MessageSquare /></AvatarFallback>
                            </Avatar>
                            <span className="truncate">Global Chat</span>
                        </Button>
                        {allUsers.map(user => (
                             <Button 
                                key={user.id}
                                variant={activeChat.id === user.id ? 'secondary' : 'ghost'} 
                                className="w-full justify-start gap-3"
                                onClick={() => setActiveChat({ id: user.id, name: user.name, avatarUrl: user.avatarUrl, type: 'private' })}
                            >
                                <Avatar className="h-8 w-8" online={user.lastOnline ? (new Date().getTime() - new Date(user.lastOnline).getTime()) / (1000 * 60) < 5 : false}>
                                    <AvatarImage src={user.avatarUrl} />
                                    <AvatarFallback><UserIcon /></AvatarFallback>
                                </Avatar>
                                <span className="truncate">{user.name}</span>
                            </Button>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>

        {/* Main Chat Window */}
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-3">
                 <Avatar className="h-10 w-10">
                    {activeChat.type === 'private' && <AvatarImage src={activeChat.avatarUrl} />}
                    <AvatarFallback>
                        {activeChat.type === 'global' ? <MessageSquare /> : <UserIcon />}
                    </AvatarFallback>
                 </Avatar>
                 <div>
                    <CardTitle>{activeChat.name}</CardTitle>
                    <CardDescription>
                        {activeChat.type === 'global' 
                            ? "Real-time communication for all team members." 
                            : `Private conversation with ${activeChat.name}`
                        }
                    </CardDescription>
                 </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-4">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  ))
                ) : (
                  messages.map((msg) => {
                      const isCurrentUser = msg.senderId === currentUser?.id;
                      return (
                          <div key={msg.id} className={cn("flex items-end gap-2", isCurrentUser && "justify-end")}>
                             {!isCurrentUser && (
                               <Avatar className="h-8 w-8">
                                  <AvatarImage src={msg.senderAvatarUrl} />
                                  <AvatarFallback><UserIcon /></AvatarFallback>
                               </Avatar>
                             )}
                             <div className={cn("max-w-xs md:max-w-md lg:max-w-lg rounded-lg p-3", isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted")}>
                                  {!isCurrentUser && <p className="text-xs font-bold mb-1">{msg.senderName}</p>}
                                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                  <p className={cn("text-xs mt-1 text-right", isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground")}>{getFormattedTimestamp(msg.createdAt)}</p>
                             </div>
                             {isCurrentUser && (
                               <Avatar className="h-8 w-8">
                                  <AvatarImage src={msg.senderAvatarUrl} />
                                  <AvatarFallback><UserIcon /></AvatarFallback>
                               </Avatar>
                             )}
                          </div>
                      )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="pt-4 border-t">
            <form onSubmit={handleSendMessage} className="w-full flex items-center gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={!currentUser || isSending}
              />
              <Button type="submit" size="icon" disabled={!currentUser || isSending || !newMessage.trim()}>
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default function ChatPage() {
    return (
        <React.Suspense fallback={<div>Loading...</div>}>
            <ChatPageContent />
        </React.Suspense>
    )
}
