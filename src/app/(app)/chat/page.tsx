'use client';

import * as React from 'react';
import { collection, onSnapshot, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User, ChatMessage } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2, User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendChatMessage } from '@/lib/actions/chat';
import { doc, getDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ChatPage() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSending, setIsSending] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const { toast } = useToast();
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const fetchUser = async () => {
      const userId = localStorage.getItem('loggedInUserId');
      if (userId) {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setCurrentUser({ id: userSnap.id, ...userSnap.data() } as User);
        }
      }
    };
    fetchUser();
  }, []);

  React.useEffect(() => {
    const q = query(collection(db, 'chatMessages'), orderBy('createdAt', 'asc'), limit(100));
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
  }, [toast]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !currentUser) return;

    setIsSending(true);
    const result = await sendChatMessage({
      text: newMessage,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatarUrl: currentUser.avatarUrl,
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
    // Fallback for older data that might not have a timestamp
    return '';
  }

  return (
    <div className="p-4 md:p-8 h-[calc(100vh-6rem)]">
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>Global Chat</CardTitle>
          <CardDescription>Real-time communication for all team members.</CardDescription>
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
                                <p className={cn("text-xs mt-1", isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground")}>{getFormattedTimestamp(msg.createdAt)}</p>
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
  );
}
