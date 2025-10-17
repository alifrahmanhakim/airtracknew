

'use client';

import * as React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, UserPlus, Trash2, MessageSquare, UserCog } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, limit, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Notification } from '@/lib/types';
import { ScrollArea } from './ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { User as UserIcon } from 'lucide-react';

type NotificationBellProps = {
  userId: string | null;
};

let notificationAudio: HTMLAudioElement | null = null;
if (typeof window !== 'undefined') {
    notificationAudio = new Audio('https://firebasestorage.googleapis.com/v0/b/aoc-insight.appspot.com/o/sound%2Fnotification.wav?alt=media&token=875375e1-8314-4161-b44c-24755ea1e73a');
    notificationAudio.preload = 'auto';
}

const getNotificationIcon = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('new message')) return <MessageSquare className="h-5 w-5 text-blue-500" />;
    if (lowerTitle.includes('added to project')) return <UserPlus className="h-5 w-5 text-green-500" />;
    if (lowerTitle.includes('removed from project')) return <Trash2 className="h-5 w-5 text-red-500" />;
    if (lowerTitle.includes('task updated')) return <UserCog className="h-5 w-5 text-purple-500" />;
    if (lowerTitle.includes('new task assigned')) return <UserPlus className="h-5 w-5 text-green-500" />;
    return <Bell className="h-5 w-5 text-gray-500" />;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isOpen, setIsOpen] = React.useState(false);
  const prevUnreadCount = React.useRef(0);

  React.useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, 'users', userId, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: Notification[] = [];
      let count = 0;
      snapshot.docs.forEach((doc) => {
        const data = doc.data() as Omit<Notification, 'id'>;
        notifs.push({ id: doc.id, ...data });
        if (!data.isRead) {
          count++;
        }
      });
      setNotifications(notifs);
      setUnreadCount(count);
    }, (err) => {
        console.error("Firestore snapshot error:", err);
    });

    return () => unsubscribe();
  }, [userId]);

  React.useEffect(() => {
    if (unreadCount > prevUnreadCount.current && notificationAudio) {
        notificationAudio.play().catch(error => {
            console.warn("Audio play failed, likely due to browser policy:", error);
        });
    }
    prevUnreadCount.current = unreadCount;
  }, [unreadCount]);

  const handleMarkAsRead = async (notificationId: string) => {
    if (!userId) return;
    const notifRef = doc(db, 'users', userId, 'notifications', notificationId);
    await updateDoc(notifRef, { isRead: true });
  };
  
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || !userId) return;
    
    const unreadNotifications = notifications.filter(n => !n.isRead);
    const batch = writeBatch(db);
    
    unreadNotifications.forEach(notif => {
        const notifRef = doc(db, 'users', userId, 'notifications', notif.id);
        batch.update(notifRef, { isRead: true });
    });
    
    try {
        await batch.commit();
    } catch (error) {
        console.error("Failed to mark all notifications as read:", error);
    }
  }

  return (
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full blur opacity-0 group-hover:opacity-75 transition duration-1000 animate-gradient-move"></div>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                )}
            </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0">
            <div className="flex items-center justify-between p-4 border-b">
                <h4 className="font-medium">Notifications</h4>
                <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
                    <CheckCheck className="mr-2 h-4 w-4" />
                    Mark all as read
                </Button>
            </div>
            <ScrollArea className="h-[28rem]">
                {notifications.length > 0 ? (
                notifications.map((notif) => (
                    <Link
                    key={notif.id}
                    href={notif.href}
                    onClick={() => {
                        if (!notif.isRead) handleMarkAsRead(notif.id);
                        setIsOpen(false);
                    }}
                    >
                    <div
                        className={cn(
                        "p-4 border-b hover:bg-muted/50 cursor-pointer relative",
                        !notif.isRead && "bg-blue-500/10"
                        )}
                    >
                        {!notif.isRead && <div className="absolute left-1 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary"></div>}
                        <div className="flex items-start gap-3">
                        <div className="mt-1">
                            {notif.actor ? (
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={notif.actor.avatarUrl} alt={notif.actor.name} />
                                    <AvatarFallback><UserIcon /></AvatarFallback>
                                </Avatar>
                            ) : getNotificationIcon(notif.title)}
                        </div>
                        <div className={cn("flex-grow")}>
                            <p className="text-sm font-semibold leading-tight">{notif.title}</p>
                            <p className="text-sm text-muted-foreground">{notif.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {notif.createdAt ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true }) : ''}
                            </p>
                        </div>
                        </div>
                    </div>
                    </Link>
                ))
                ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                    You have no notifications.
                </div>
                )}
            </ScrollArea>
            </PopoverContent>
        </Popover>
      </div>
  );
}
