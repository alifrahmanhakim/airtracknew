
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Users,
  FileText,
  Landmark,
  ClipboardCheck,
  CircleHelp,
  UserSquare,
  BookText,
  Settings,
  LogOut,
  MessageSquare,
  ShieldAlert,
  Mail,
  User as UserIcon,
  Leaf,
  Plane,
  Languages, // Import Languages icon
  FlaskConical,
} from 'lucide-react';
import Image from 'next/image';

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
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Project, Task, User } from '@/lib/types';
import { doc, onSnapshot, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ThemeToggle } from '@/components/theme-toggle';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { StatusIndicator } from '@/components/status-indicator';
import { updateUserOnlineStatus } from '@/lib/actions/user';
import { Skeleton } from '@/components/ui/skeleton';
import { NotificationBell } from '@/components/notification-bell';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { GlobalSearch } from '@/components/global-search';
import { UserProfileDialog } from '@/components/chat/user-profile-dialog';

const navItems = {
    dashboards: [
      { href: '/my-dashboard', label: 'My Dashboard', icon: UserSquare },
      { href: '/dashboard', label: 'Tim Kerja', icon: Home },
      { href: '/rulemaking', label: 'Rulemaking', icon: Landmark },
    ],
    workspace: [
      { href: '/chats', label: 'Chats', icon: MessageSquare },
      { href: '/documents', label: 'Documents', icon: FileText },
      { href: '/team', label: 'Team', icon: Users, requiredRole: 'Sub-Directorate Head' },
      { href: '/ccefod', label: 'CC/EFOD Monitoring', icon: ClipboardCheck },
      { href: '/pqs', label: 'Protocol Questions', icon: CircleHelp },
      { href: '/state-letter', label: 'State Letter', icon: Mail },
      { href: '/glossary', label: 'Glossary', icon: BookText },
      { href: '/rsi', label: 'RSI', icon: Plane },
      { href: 'https://dgcaems.vercel.app/', label: 'Environment', icon: Leaf, isExternal: true },
    ],
    tools: [
      { href: '/tools/ask-std-ai', label: 'Ask STD.Ai', icon: FlaskConical },
    ]
}

type AssignedTask = Task & {
  projectId: string;
  projectName: string;
  projectType: Project['projectType'];
};

function LiveClock() {
    const [time, setTime] = React.useState(new Date());

    React.useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    return (
        <div className="text-sm font-mono text-foreground bg-background/50 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border/50 shadow-sm">
            {format(time, 'dd MMM yyyy, HH:mm:ss')}
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
  const [allUsers, setAllUsers] = React.useState<User[]>([]);
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
      if (!isCheckingAuth) {
        router.push('/login');
      }
      return;
    }

    setLoading(true);
    const unsubs: (() => void)[] = [];

    const userRef = doc(db, 'users', userId);
    const userUnsub = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
            setCurrentUser({ id: doc.id, ...doc.data() } as User);
        } else {
            console.log("User not found in Firestore, redirecting to login");
            localStorage.removeItem('loggedInUserId');
            router.push('/login');
        }
        setLoading(false);
    });
    unsubs.push(userUnsub);
    
    const usersUnsub = onSnapshot(collection(db, 'users'), (snapshot) => {
        const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setAllUsers(usersList);
    });
    unsubs.push(usersUnsub);

    updateUserOnlineStatus(userId); // Update immediately
    const presenceInterval = setInterval(() => {
        updateUserOnlineStatus(userId);
    }, 60 * 1000); // Every 1 minute
    unsubs.push(() => clearInterval(presenceInterval));

    return () => {
        unsubs.forEach(unsub => unsub());
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
           <div className="flex items-center justify-center gap-2 py-4">
              <Image src="https://i.postimg.cc/3NNnNB5C/LOGO-AIRTRACK.png" alt="AirTrack Logo" width={150} height={40} className="object-contain" />
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
                    {navItems.workspace.map((item: any) => {
                      if (item.requiredRole && !isAdmin) {
                        return null;
                      }
                      
                      const linkProps = item.isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {};
                      
                      return (
                        <SidebarMenuItem key={item.href}>
                             <SidebarMenuButton
                                asChild
                                isActive={!item.isExternal && pathname.startsWith(item.href)}
                            >
                                <Link href={item.href} {...linkProps}>
                                    <item.icon />
                                    <span>{item.label}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                </SidebarMenu>
            </SidebarGroup>
             <SidebarGroup>
                <SidebarGroupLabel>Tools</SidebarGroupLabel>
                <SidebarMenu>
                    {navItems.tools.map((item) => (
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
        </SidebarContent>
        <SidebarFooter>
             <div className="text-center text-xs text-sidebar-foreground/50 pt-2 group-data-[collapsible=icon]:hidden">
                stdatabase © 2025
            </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 m-2 mt-4 flex items-center justify-between rounded-lg border bg-card/80 p-2 backdrop-blur-sm">
            <div className="flex items-center gap-2">
                <SidebarTrigger />
                <GlobalSearch onViewProfile={() => {}} />
            </div>
            <div className="flex items-center gap-2">
                <LiveClock />
                <StatusIndicator variant="icon" />
                <NotificationBell userId={userId} />
                <ThemeToggle />
                 <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full blur opacity-0 group-hover:opacity-75 transition duration-1000 animate-gradient-move"></div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                            <Avatar className="h-9 w-9 aspect-square" online={isCurrentUserOnline}>
                                <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
                                <AvatarFallback>
                                <UserIcon className="h-5 w-5" />
                                </AvatarFallback>
                            </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                                <p className="text-xs leading-none text-muted-foreground">{currentUser.email}</p>
                            </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                            <DropdownMenuItem asChild>
                                <Link href="/profile">
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Profile</span>
                                </Link>
                            </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:bg-red-500/10 focus:text-red-500">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Logout</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
        <main className="flex-1 overflow-auto">
            <div className="app-content-container animate-in fade-in-50 duration-500">
              {children}
            </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
