
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FolderKanban,
  Home,
  Users,
  FileText,
  LineChart,
  Plane,
  LogOut,
  Landmark,
  ClipboardCheck,
  CircleHelp,
  UserSquare,
  FileBadge,
  GitCompareArrows,
  Settings,
  BookText,
  User as UserIcon,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User } from '@/lib/types';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ThemeToggle } from '@/components/theme-toggle';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { StatusIndicator } from '@/components/status-indicator';
import { updateUserOnlineStatus } from '@/lib/actions/user';
import { Skeleton } from '@/components/ui/skeleton';
import { NotificationBell } from '@/components/notification-bell';

const navItems = {
    dashboards: [
      { href: '/my-dashboard', label: 'My Dashboard', icon: UserSquare },
      { href: '/dashboard', label: 'Tim Kerja', icon: Home },
      { href: '/rulemaking', label: 'Rulemaking', icon: Landmark },
    ],
    workspace: [
      { href: '/chat', label: 'Chat', icon: MessageSquare },
      { href: '/documents', label: 'Documents', icon: FileText },
      { href: '/team', label: 'Team', icon: Users, requiredRole: 'Sub-Directorate Head' },
      { href: '/reports', label: 'Reports', icon: LineChart },
      { href: '/ccefod', label: 'CC/EFOD Monitoring', icon: ClipboardCheck },
      { href: '/pqs', label: 'Protocol Questions', icon: CircleHelp },
      { href: '/gap-analysis', label: 'GAP Analysis', icon: GitCompareArrows },
      { href: '/glossary', label: 'Glossary', icon: BookText },
      { href: '/rsi', label: 'RSI', icon: ShieldAlert },
    ]
}

function LiveClock() {
    const [time, setTime] = React.useState(new Date());

    React.useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    return (
        <div className="text-sm font-mono text-foreground bg-background/50 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border/50 shadow-sm">
            {format(time, 'HH:mm:ss')}
        </div>
    )
}

function AppLayoutLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex items-center space-x-2">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    </div>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);
  const [userId, setUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    // This effect runs only once on mount to check for the user ID.
    const loggedInUserId = localStorage.getItem('loggedInUserId');
    if (!loggedInUserId) {
      router.push('/login');
    } else {
      setUserId(loggedInUserId);
    }
    setIsCheckingAuth(false);
  }, [router]);

  React.useEffect(() => {
    // This effect runs when the userId is set.
    if (!userId) {
      // If after the initial check, userId is still null, and we're not checking anymore,
      // it means the user should be redirected.
      if (!isCheckingAuth) {
        router.push('/login');
      }
      return;
    }

    setLoading(true);
    const userRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
            setCurrentUser({ id: doc.id, ...doc.data() } as User);
        } else {
            console.log("User not found in Firestore, redirecting to login");
            localStorage.removeItem('loggedInUserId');
            router.push('/login');
        }
        setLoading(false);
    });

    // Set up a recurring task to update the user's online status
    updateUserOnlineStatus(userId); // Update immediately
    const presenceInterval = setInterval(() => {
        updateUserOnlineStatus(userId);
    }, 60 * 1000); // Every 1 minute

    return () => {
        unsubscribe();
        clearInterval(presenceInterval);
    };
  }, [userId, router, isCheckingAuth]);

  const handleLogout = () => {
    localStorage.removeItem('loggedInUserId');
    router.push('/login');
  };
  
  if (isCheckingAuth || loading || !currentUser) {
    return <AppLayoutLoader />;
  }
  
  const isAdmin = currentUser?.role === 'Sub-Directorate Head' || currentUser?.email === 'admin@admin2023.com' || currentUser?.email === 'hakimalifrahman@gmail.com' || currentUser?.email === 'rizkywirapratama434@gmail.com';

  const isCurrentUserOnline = currentUser.lastOnline ? (new Date().getTime() - new Date(currentUser.lastOnline).getTime()) / (1000 * 60) < 5 : false;

  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
           <div className="flex items-center gap-2">
              <div className="flex items-center justify-center h-10 w-10 shrink-0 rounded-full bg-primary text-primary-foreground">
                <Plane className="h-5 w-5" />
              </div>
              <span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">AirTrack</span>
            </div>
        </SidebarHeader>
        <SidebarContent>
            <SidebarGroup>
                <SidebarGroupLabel>Dashboards</SidebarGroupLabel>
                <SidebarMenu>
                    {navItems.dashboards.map((item) => (
                    <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                        asChild
                        isActive={pathname.startsWith(item.href)}
                        >
                        <Link href={item.href}>
                            <item.icon />
                            <span>{item.label}</span>
                        </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroup>
             <SidebarGroup>
                <SidebarGroupLabel>Workspace</SidebarGroupLabel>
                <SidebarMenu>
                    {navItems.workspace.map((item) => {
                      if (item.requiredRole && !isAdmin) {
                        return null;
                      }
                      return (
                        <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                            asChild
                            isActive={pathname.startsWith(item.href)}
                            >
                            <Link href={item.href}>
                                <item.icon />
                                <span>{item.label}</span>
                            </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                </SidebarMenu>
            </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="flex flex-col gap-3">
            <SidebarSeparator />
            <div className='flex items-center justify-between gap-2 px-2'>
                <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
                    <Avatar className="h-9 w-9" online={isCurrentUserOnline}>
                        <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
                        <AvatarFallback>
                            <UserIcon className="h-5 w-5" />
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className='text-sm font-semibold'>{currentUser.name ? currentUser.name.split(' ')[0] : ''}</span>
                        <span className='text-xs text-muted-foreground'>{currentUser.role}</span>
                    </div>
                </div>
                 <div className="group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                    <ThemeToggle />
                </div>
            </div>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/profile'}>
                        <Link href="/profile">
                            <Settings />
                            <span>Profile</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleLogout} className="text-red-500 hover:bg-red-500/10 hover:text-red-500 dark:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400">
                        <LogOut />
                        <span>Logout</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
            <div className='px-2'>
                <StatusIndicator />
            </div>
            <div className="text-center text-xs text-sidebar-foreground/50 pt-2 group-data-[collapsible=icon]:hidden">
                stdatabase © 2025
            </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-background/20 backdrop-blur-lg">
        <header className="absolute top-0 left-0 right-0 flex items-center justify-between p-2 z-10">
            <div className="flex items-center gap-2">
                <SidebarTrigger />
            </div>
            <div className="flex items-center gap-2">
                <NotificationBell userId={userId} />
                <LiveClock />
            </div>
        </header>
        <div className="animate-in fade-in-50 duration-500 pt-12">
            {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
