
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
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ThemeToggle } from '@/components/theme-toggle';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const navItems = {
    dashboards: [
      { href: '/my-dashboard', label: 'My Dashboard', icon: UserSquare },
      { href: '/dashboard', label: 'Tim Kerja', icon: Home },
      { href: '/rulemaking', label: 'Rulemaking', icon: Landmark },
    ],
    workspace: [
      { href: '/documents', label: 'Documents', icon: FileText },
      { href: '/team', label: 'Team', icon: Users, requiredRole: 'Sub-Directorate Head' },
      { href: '/reports', label: 'Reports', icon: LineChart },
      { href: '/ccefod', label: 'CC/EFOD Monitoring', icon: ClipboardCheck },
      { href: '/pqs', label: 'Protocol Questions', icon: CircleHelp },
      { href: '/gap-analysis', label: 'GAP Analysis', icon: GitCompareArrows },
      { href: '/glossary', label: 'Glossary', icon: BookText },
    ]
}

function LiveClock() {
    const [time, setTime] = React.useState(new Date());

    React.useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    return (
        <div className="text-xs font-mono text-muted-foreground">
            {format(time, 'HH:mm:ss')}
        </div>
    )
}


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchUser = async (userId: string) => {
        try {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                setCurrentUser({ id: userSnap.id, ...userSnap.data() } as User);
            } else {
                console.log("User not found in Firestore, redirecting to login");
                router.push('/login');
            }
        } catch (error) {
            console.error("Error fetching user from Firestore:", error);
            router.push('/login');
        } finally {
            setLoading(false);
        }
    };

    const userId = localStorage.getItem('loggedInUserId');
    if (userId) {
        fetchUser(userId);
    } else {
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('loggedInUserId');
    router.push('/login');
  };
  
  if (loading || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
          <p>Loading user profile...</p>
      </div>
    );
  }
  
  const isAdmin = currentUser?.role === 'Sub-Directorate Head' || currentUser?.email === 'admin@admin2023.com' || currentUser?.email === 'hakimalifrahman@gmail.com';

  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-full bg-primary text-primary-foreground">
                  <Plane className="h-5 w-5" />
              </Button>
              <span className="text-lg font-semibold">AirTrack</span>
            </div>
            <div className="flex items-center gap-2">
                <LiveClock />
            </div>
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
                <div className="flex items-center gap-2">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
                        <AvatarFallback>{currentUser.name?.charAt(0) || currentUser.email?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                        <span className='text-sm font-semibold'>{currentUser.name}</span>
                        <span className='text-xs text-muted-foreground'>{currentUser.role}</span>
                    </div>
                </div>
                <ThemeToggle />
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
                    <SidebarMenuButton onClick={handleLogout}>
                        <LogOut />
                        <span>Logout</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-background/20 backdrop-blur-lg">
        <div className="p-2 absolute top-0 left-0">
          <SidebarTrigger />
        </div>
        <div className="animate-in fade-in-50 duration-500 pt-12">
            {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
