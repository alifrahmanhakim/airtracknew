
'use client';

import * as React from 'react';
import { Wifi, Cloud, Server, WifiOff, CloudOff } from 'lucide-react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

type Status = 'connected' | 'disconnected' | 'connecting';

export function StatusIndicator() {
  const [onlineStatus, setOnlineStatus] = React.useState<boolean>(true);
  const [firebaseStatus, setFirebaseStatus] = React.useState<Status>('connecting');

  React.useEffect(() => {
    // Check initial online status
    if (typeof window !== 'undefined' && typeof window.navigator !== 'undefined') {
        setOnlineStatus(window.navigator.onLine);
    }

    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  React.useEffect(() => {
    if (!onlineStatus) {
      setFirebaseStatus('disconnected');
      return;
    }

    setFirebaseStatus('connecting');

    // Use a non-existent doc for a lightweight ping.
    const unsubscribe = onSnapshot(doc(db, '_metadata', 'status'),
      () => {
        setFirebaseStatus('connected');
      },
      (error) => {
        console.warn('Firebase connection check failed:', error.code);
        setFirebaseStatus('disconnected');
      }
    );

    return () => unsubscribe();
  }, [onlineStatus]);

  const getStatusInfo = (status: Status | boolean, type: 'internet' | 'firebase' | 'server') => {
    const isConnected = status === true || status === 'connected';
    const isConnecting = status === 'connecting';
    
    if (isConnecting) {
        return {
            Icon: Cloud,
            color: 'text-yellow-500 animate-pulse',
            text: 'Connecting to stdatabase...',
        };
    }

    if (isConnected) {
        let Icon, text;
        switch(type) {
            case 'internet': Icon = Wifi; text = 'Internet Connected'; break;
            case 'firebase': Icon = Cloud; text = 'stdatabase Connected'; break;
            case 'server': Icon = Server; text = 'Server Responsive'; break;
        }
        return { Icon, color: 'text-green-500', text };
    }
    
    let Icon, text;
    switch(type) {
        case 'internet': Icon = WifiOff; text = 'Internet Disconnected'; break;
        case 'firebase': Icon = CloudOff; text = 'stdatabase Disconnected'; break;
        case 'server': Icon = Server; text = 'Server Unresponsive'; break;
    }
    return { Icon, color: 'text-red-500', text };
  }

  const internet = getStatusInfo(onlineStatus, 'internet');
  const firebase = getStatusInfo(firebaseStatus, 'firebase');
  const server = getStatusInfo(firebaseStatus, 'server'); // Server status mirrors firebase status for now

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between p-2 rounded-lg bg-sidebar-accent/50 border border-sidebar-border/50 text-xs text-sidebar-foreground/80 group-data-[collapsible=icon]:hidden">
        <span className='font-semibold'>Status:</span>
        <div className="flex items-center gap-3">
          <Tooltip>
            <TooltipTrigger>
              <internet.Icon className={cn("h-4 w-4", internet.color)} />
            </TooltipTrigger>
            <TooltipContent>{internet.text}</TooltipContent>
          </Tooltip>
           <Tooltip>
            <TooltipTrigger>
              <firebase.Icon className={cn("h-4 w-4", firebase.color)} />
            </TooltipTrigger>
            <TooltipContent>{firebase.text}</TooltipContent>
          </Tooltip>
           <Tooltip>
            <TooltipTrigger>
              <server.Icon className={cn("h-4 w-4", server.color)} />
            </TooltipTrigger>
            <TooltipContent>{server.text}</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
