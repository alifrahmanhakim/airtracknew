
'use client';

import * as React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, limit, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Notification } from '@/lib/types';
import { ScrollArea } from './ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type NotificationBellProps = {
  userId: string | null;
};

// Create a single, persistent audio instance outside the component
// to prevent re-creation on every render cycle.
let notificationAudio: HTMLAudioElement | null = null;
if (typeof window !== 'undefined') {
    notificationAudio = new Audio('https://firebasestorage.googleapis.com/v0/b/aoc-insight.firebasestorage.app/o/icon%2Fnew-notification-09-352705.mp3?alt=media&token=39a21338-150c-428a-893c-72bc2a6f8b80');
    notificationAudio.preload = 'auto';
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
    // Play sound only when a new notification arrives
    if (unreadCount > prevUnreadCount.current && notificationAudio) {
        notificationAudio.play().catch(error => {
            // This error can happen if the user hasn't interacted with the page yet.
            // It's a browser policy to prevent auto-playing audio.
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
        <PopoverContent className="w-80 p-0">
          <div className="flex items-center justify-between p-4 border-b">
              <h4 className="font-medium text-sm">Notifications</h4>
              <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
                  <CheckCheck className="mr-2 h-4 w-4" />
                  Mark all as read
              </Button>
          </div>
          <ScrollArea className="h-96">
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
                      "p-4 border-b hover:bg-muted/50 cursor-pointer",
                      !notif.isRead && "bg-blue-500/10"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {!notif.isRead && <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>}
                      <div className={cn("flex-grow", notif.isRead && "pl-5")}>
                          <p className="text-sm font-semibold">{notif.title}</p>
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
  );
}
