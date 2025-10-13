
'use client';

import * as React from 'react';
import { Wifi, Cloud, CloudOff, WifiOff, Loader2 } from 'lucide-react';
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

interface StatusIndicatorProps {
    className?: string;
    variant?: 'default' | 'icon';
}

export function StatusIndicator({ className, variant = 'default' }: StatusIndicatorProps) {
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
    const isConnecting = status === 'connecting';
    const isConnected = status === true || status === 'connected';
    
    if (isConnecting) {
        return {
            Icon: Loader2,
            color: 'text-yellow-500',
            text: 'Connecting...',
            tooltipText: `Connecting to ${type}...`
        };
    }

    if (isConnected) {
        let Icon, text;
        switch(type) {
            case 'internet': Icon = Wifi; text = 'Connected'; break;
            case 'database': Icon = Cloud; text = 'Connected'; break;
        }
        return { Icon, color: 'text-green-500', text, tooltipText: `${type.charAt(0).toUpperCase() + type.slice(1)} Connected` };
    }
    
    let Icon, text;
    switch(type) {
        case 'internet': Icon = WifiOff; text = 'Offline'; break;
        case 'database': Icon = CloudOff; text = 'Disconnected'; break;
    }
    return { Icon, color: 'text-red-500', text, tooltipText: `${type.charAt(0).toUpperCase() + type.slice(1)} Disconnected` };
  }

  const internet = getStatusInfo(onlineStatus, 'internet');
  const database = getStatusInfo(firebaseStatus, 'database');

  return (
    <TooltipProvider>
      <div className={cn(
        "flex items-center justify-between text-xs gap-2",
        variant === 'default' && "rounded-lg p-2 gap-4",
        isLoginPage && variant === 'default'
          ? "bg-black/20 backdrop-blur-sm border border-white/20 text-white/80" 
          : "text-foreground/80",
        className
      )}>
          <Tooltip>
            <TooltipTrigger className="flex items-center gap-2">
              <internet.Icon className={cn("h-4 w-4", internet.color, internet.text === 'Connecting...' && 'animate-spin')} />
              {variant === 'default' && <span className={cn(isLoginPage && internet.color)}>Internet: {internet.text}</span>}
            </TooltipTrigger>
            <TooltipContent>{internet.tooltipText}</TooltipContent>
          </Tooltip>
          
          {variant === 'default' && <div className={cn("h-4 w-px", isLoginPage ? "bg-white/20" : "bg-border")}></div>}
          
           <Tooltip>
            <TooltipTrigger className="flex items-center gap-2">
              <database.Icon className={cn("h-4 w-4", database.color, database.text === 'Connecting...' && 'animate-spin')} />
               {variant === 'default' && <span className={cn(isLoginPage && database.color)}>Database: {database.text}</span>}
            </TooltipTrigger>
            <TooltipContent>{database.tooltipText}</TooltipContent>
          </Tooltip>
      </div>
    </TooltipProvider>
  );
}
