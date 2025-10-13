
'use client';

import * as React from 'react';
import { Wifi, Cloud, CloudOff, WifiOff } from 'lucide-react';
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

export function StatusIndicator({ className }: { className?: string }) {
  const [onlineStatus, setOnlineStatus] = React.useState<boolean>(true);
  const [firebaseStatus, setFirebaseStatus] = React.useState<Status>('connecting');
  const [isLoginPage, setIsLoginPage] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
        setIsLoginPage(window.location.pathname === '/login');
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

    const unsubscribe = onSnapshot(doc(db, '_metadata', 'status'),
      () => setFirebaseStatus('connected'),
      (error) => {
        console.warn('Firebase connection check failed:', error.code);
        setFirebaseStatus('disconnected');
      }
    );

    return () => unsubscribe();
  }, [onlineStatus]);

  const getStatusInfo = (status: Status | boolean, type: 'internet' | 'database') => {
    const isConnected = status === true || status === 'connected';
    const isConnecting = status === 'connecting';
    
    if (isConnecting) {
        return {
            Icon: Cloud,
            color: 'text-yellow-500 animate-pulse',
            text: 'Connecting to AirTrack database...',
        };
    }

    if (isConnected) {
        let Icon, text;
        switch(type) {
            case 'internet': Icon = Wifi; text = 'Internet Connected'; break;
            case 'database': Icon = Cloud; text = 'AirTrack Database Connected'; break;
        }
        return { Icon, color: 'text-green-500', text };
    }
    
    let Icon, text;
    switch(type) {
        case 'internet': Icon = WifiOff; text = 'Internet Disconnected'; break;
        case 'database': Icon = CloudOff; text = 'AirTrack Database Disconnected'; break;
    }
    return { Icon, color: 'text-red-500', text };
  }

  const internet = getStatusInfo(onlineStatus, 'internet');
  const database = getStatusInfo(firebaseStatus, 'database');

  return (
    <TooltipProvider>
      <div className={cn(
        "flex items-center justify-end rounded-lg text-xs gap-2",
        isLoginPage 
          ? "bg-black/20 backdrop-blur-sm border border-white/20 text-white/80 p-2" 
          : "text-foreground/80",
        className
      )}>
          <Tooltip>
            <TooltipTrigger>
              <internet.Icon className={cn("h-4 w-4", internet.color)} />
            </TooltipTrigger>
            <TooltipContent>{internet.text}</TooltipContent>
          </Tooltip>
           <Tooltip>
            <TooltipTrigger>
              <database.Icon className={cn("h-4 w-4", database.color)} />
            </TooltipTrigger>
            <TooltipContent>{database.text}</TooltipContent>
          </Tooltip>
      </div>
    </TooltipProvider>
  );
}
