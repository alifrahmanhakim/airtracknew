
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
  BookType,
  Settings,
  LogOut,
  MessageSquare,
  ShieldAlert,
  Mail,
  User as UserIcon,
  Leaf,
  Plane,
  Languages, // Import Languages icon
  BotMessageSquare,
  AlertTriangle,
  BookCheck,
  ListChecks,
  ListTodo,
  Clock,
  Activity,
  CalendarDays,
  Sparkles,
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
  SidebarMenuBadge,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Project, Task, User, Notification, GapAnalysisRecord, RulemakingRecord } from '@/lib/types';
import { doc, onSnapshot, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ThemeToggle } from '@/components/theme-toggle';
import { format, isAfter, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { StatusIndicator } from '@/components/status-indicator';
import { updateUserOnlineStatus } from '@/lib/actions/user';
import { Skeleton } from '@/components/ui/skeleton';
import { NotificationBell } from '@/components/notification-bell';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { GlobalSearch } from '@/components/global-search';
import { UserProfileDialog } from '@/components/chat/user-profile-dialog';
import { AskStdAiWidget } from '@/components/ask-std-ai-widget';
import { PrivacyDialog } from '@/components/privacy-dialog';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { MyTasksDialog } from '@/components/my-tasks-dialog';
import { WhatsNewDialog } from './whats-new-dialog';

const navItems = {
    dashboards: [
      { href: '/my-dashboard', label: 'My Dashboard', icon: UserSquare, countId: 'overdueTasks' },
      { href: '/dashboard', label: 'Tim Kerja', icon: Home, countId: 'timKerja' },
      { 
        href: '/rulemaking', 
        label: 'Rulemaking', 
        icon: Landmark, 
        countId: 'rulemaking',
        children: [
          { href: '/rulemaking-monitoring', label: 'Monitoring', icon: ListChecks }
        ]
      },
      { href: '/kegiatan', label: 'Kegiatan Subdit', icon: CalendarDays },
    ],
    workspace: [
      { href: '/chats', label: 'Chats', icon: MessageSquare, countId: 'unreadChats' },
      { href: '/documents', label: 'Documents', icon: FileText },
      { href: '/team', label: 'Team', icon: Users, requiredRole: 'Sub-Directorate Head' },
      { href: '/ccefod', label: 'CC/EFOD Monitoring', icon: ClipboardCheck },
      { href: '/pqs', label: 'Protocol Questions', icon: CircleHelp },
      { href: '/state-letter', label: 'State Letter', icon: Mail, countId: 'openStateLetters' },
      { href: '/glossary', label: 'Glossary', icon: BookType },
      { href: '/rsi', label: 'RSI', icon: Plane },
      { href: 'https://dgcaems.vercel.app/', label: 'Environment', icon: Leaf, isExternal: true },
    ],
    tools: [
      { href: '/tools/ask-std-ai', label: 'Ask STD.Ai', icon: BotMessageSquare, isBeta: true },
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
            {format(time, 'dd MMM, HH:mm')}
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

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [allUsers, setAllUsers] = React.useState<User[]>([]);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);
  const [userId, setUserId] = React.useState<string | null>(null);
  
  const [allProjects, setAllProjects] = React.useState<Project[]>([]);
  const [rulemakingRecords, setRulemakingRecords] = React.useState<RulemakingRecord[]>([]);
  const [projectCounts, setProjectCounts] = React.useState({ timKerja: 0, rulemaking: 0 });
  const [overdueTasksCount, setOverdueTasksCount] = React.useState(0);
  const [criticalProjectsCount, setCriticalProjectsCount] = React.useState(0);
  const [unreadChatsCount, setUnreadChatsCount] = React.useState(0);
  const [openStateLettersCount, setOpenStateLettersCount] = React.useState(0);
  const [rulemakingEvaluasiCount, setRulemakingEvaluasiCount] = React.useState(0);
  const [rulemakingRevisiCount, setRulemakingRevisiCount] = React.useState(0);

  const [myTasks, setMyTasks] = React.useState<AssignedTask[]>([]);
  const [isMyTasksDialogOpen, setIsMyTasksDialogOpen] = React.useState(false);
  
  const [myTaskStats, setMyTaskStats] = React.useState({
    todo: 0,
    inProgress: 0,
    done: 0,
    total: 0,
    completionPercentage: 0,
  });

  React.useEffect(() => {
    const loggedInUserId = localStorage.getItem('loggedInUserId');
    if (!loggedInUserId) {
      router.push('/login');
    } else {
      setUserId(loggedInUserId);
    }
    setIsCheckingAuth(false);
  }, [router]);

  React.useEffect(() => {
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

    const timKerjaQuery = query(collection(db, 'timKerjaProjects'));
    const rulemakingQuery = query(collection(db, 'rulemakingProjects'));

    const projectsFromTimKerja: Project[] = [];
    const projectsFromRulemaking: Project[] = [];

    const updateAllProjects = () => {
        const combined = [...projectsFromTimKerja, ...projectsFromRulemaking];
        setAllProjects(combined);
    };

    const unsubTimKerja = onSnapshot(timKerjaQuery, (snapshot) => {
        projectsFromTimKerja.length = 0; // Clear the array
        snapshot.forEach(doc => {
            projectsFromTimKerja.push({ ...doc.data(), id: doc.id, projectType: 'Tim Kerja' } as Project);
        });
        setProjectCounts(prev => ({ ...prev, timKerja: snapshot.size }));
        updateAllProjects();
    });
    unsubs.push(unsubTimKerja);

    const unsubRulemaking = onSnapshot(rulemakingQuery, (snapshot) => {
        projectsFromRulemaking.length = 0; // Clear the array
        snapshot.forEach(doc => {
            projectsFromRulemaking.push({ ...doc.data(), id: doc.id, projectType: 'Rulemaking' } as Project);
        });
        setProjectCounts(prev => ({ ...prev, rulemaking: snapshot.size }));
        updateAllProjects();
    });
    unsubs.push(unsubRulemaking);
    
    const unsubRulemakingRecords = onSnapshot(collection(db, 'rulemakingRecords'), (snapshot) => {
        let evaluasiCount = 0;
        let revisiCount = 0;

        snapshot.forEach(doc => {
            const record = { id: doc.id, ...doc.data() } as RulemakingRecord;
            const lastStage = record.stages && record.stages.length > 0 ? record.stages[record.stages.length - 1] : null;
            if (lastStage) {
                const lastStatusDesc = lastStage.status.deskripsi.toLowerCase();
                if (!lastStatusDesc.includes('selesai')) {
                    if (lastStatusDesc.includes('dikembalikan')) {
                        revisiCount++;
                    } else {
                        evaluasiCount++;
                    }
                }
            }
        });
        setRulemakingEvaluasiCount(evaluasiCount);
        setRulemakingRevisiCount(revisiCount);
    });
    unsubs.push(unsubRulemakingRecords);

    const notifsQuery = query(
      collection(db, 'users', userId, 'notifications'),
      where('isRead', '==', false)
    );
    const notifsUnsub = onSnapshot(notifsQuery, (snapshot) => {
      const chatCount = snapshot.docs.filter(doc => {
          const data = doc.data() as Notification;
          return data.title && data.title.toLowerCase().startsWith('new message from');
      }).length;
      setUnreadChatsCount(chatCount);
    });
    unsubs.push(notifsUnsub);
    
    const gapAnalysisQuery = query(collection(db, 'gapAnalysisRecords'), where('statusItem', '==', 'OPEN'));
    const unsubGapAnalysis = onSnapshot(gapAnalysisQuery, (snapshot) => {
        setOpenStateLettersCount(snapshot.size);
    });
    unsubs.push(unsubGapAnalysis);


    updateUserOnlineStatus(userId);
    const presenceInterval = setInterval(() => {
        updateUserOnlineStatus(userId);
    }, 60 * 1000); 
    unsubs.push(() => clearInterval(presenceInterval));

    return () => {
        unsubs.forEach(unsub => unsub());
    };
  }, [userId, router, isCheckingAuth]);

  React.useEffect(() => {
    if (!userId || allProjects.length === 0) {
        setOverdueTasksCount(0);
        setCriticalProjectsCount(0);
        setMyTaskStats({ todo: 0, inProgress: 0, done: 0, total: 0, completionPercentage: 0 });
        setMyTasks([]);
        return;
    };
    
    const today = new Date();
    
    const myProjects = allProjects.filter(p => p.team.some(member => member.id === userId));

    const tasksForUser: AssignedTask[] = [];
    const criticalProjectIds = new Set<string>();

    let myTodo = 0;
    let myInProgress = 0;
    let myDone = 0;
    
    myProjects.forEach(project => {
        const processTasksRecursively = (tasks: Task[]) => {
            for (const task of tasks) {
                if (task.assigneeIds?.includes(userId)) {
                    tasksForUser.push({
                        ...task,
                        projectId: project.id,
                        projectName: project.name,
                        projectType: project.projectType,
                    });
                    if (task.status === 'To Do') myTodo++;
                    if (task.status === 'In Progress') myInProgress++;
                    if (task.status === 'Done') myDone++;
                }

                if (task.criticalIssue) {
                    criticalProjectIds.add(project.id);
                }

                if (task.subTasks) {
                    processTasksRecursively(task.subTasks);
                }
            }
        };
        processTasksRecursively(project.tasks || []);
    });

    const overdueCount = tasksForUser.filter(task => 
        task.status !== 'Done' && isAfter(today, parseISO(task.dueDate))
    ).length;

    const myTotal = tasksForUser.length;

    setOverdueTasksCount(overdueCount);
    setCriticalProjectsCount(criticalProjectIds.size);
    setMyTasks(tasksForUser.sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
    setMyTaskStats({
        todo: myTodo,
        inProgress: myInProgress,
        done: myDone,
        total: myTotal,
        completionPercentage: myTotal > 0 ? (myDone / myTotal) * 100 : 0
    });

  }, [allProjects, userId]);


  const handleLogout = () => {
    localStorage.removeItem('loggedInUserId');
    router.push('/login');
  };
  
  if (isCheckingAuth || loading || !currentUser) {
    return <AppLayoutLoader />;
  }
  
  const isAdmin = currentUser?.role === 'Sub-Directorate Head' || currentUser?.email === 'admin@admin2023.com' || currentUser?.email === 'hakimalifrahman@gmail.com' || currentUser?.email === 'rizkywirapratama434@gmail.com';

  const isCurrentUserOnline = currentUser.lastOnline ? (new Date().getTime() - new Date(currentUser.lastOnline).getTime()) / (1000 * 60) < 5 : false;

  const dynamicCounts = {
      ...projectCounts,
      overdueTasks: overdueTasksCount,
      criticalProjects: criticalProjectsCount,
      unreadChats: unreadChatsCount,
      openStateLetters: openStateLettersCount,
  }

  return (
    <>
      <SidebarProvider>
          <Sidebar variant="inset" collapsible="icon">
          <SidebarHeader>
              <div className="flex items-center justify-center gap-2 py-4">
              <Image src="https://i.postimg.cc/3NNnNB5C/LOGO-AIRTRACK.png" alt="AirTrack Logo" width={97} height={24} style={{ width: 'auto', height: 'auto' }} />
              </div>
          </SidebarHeader>
          <SidebarContent>
              <SidebarGroup>
              <SidebarGroupLabel>Quick Start</SidebarGroupLabel>
              <div className="relative group/menu-item px-2 block">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg blur opacity-0 transition duration-1000 group-hover/menu-item:opacity-25"></div>
                  <div
                  className="relative p-3 rounded-lg bg-sidebar-accent/50 hover:bg-sidebar-accent/80 transition-colors cursor-pointer"
                  onClick={() => setIsMyTasksDialogOpen(true)}
                  >
                  <div className="flex justify-between items-center text-xs font-semibold text-sidebar-foreground/80 mb-2 group-data-[collapsible=icon]:hidden">
                      <span>My Tasks</span>
                      <span>{myTaskStats.done}/{myTaskStats.total} Done</span>
                  </div>
                  <Progress value={myTaskStats.completionPercentage} className="h-2 group-data-[collapsible=icon]:hidden" />
                  <div className="flex items-center gap-2 mt-2 text-sm text-sidebar-foreground">
                      <Activity className="h-4 w-4 text-sidebar-primary" />
                      <div className="group-data-[collapsible=icon]:hidden flex items-center gap-2">
                          <span className="font-bold">{myTaskStats.todo + myTaskStats.inProgress}</span>
                          <span>Active Tasks</span>
                      </div>
                  </div>
                  </div>
              </div>
              </SidebarGroup>
              <SidebarGroup>
              <SidebarGroupLabel>Dashboards</SidebarGroupLabel>
              <SidebarMenu>
                  {navItems.dashboards.map((item) => {
                      const isActive = pathname.startsWith(item.href);
                      const hasChildren = item.children && item.children.length > 0;
                      
                      return (
                        <SidebarMenuItem key={item.href} isActive={isActive}>
                            <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-500 to-green-500 blur opacity-0 transition duration-1000 group-hover/menu-item:opacity-75 data-[active=true]:opacity-75" data-active={isActive}></div>
                            <SidebarMenuButton asChild isActive={isActive} className="transition-colors">
                                <Link href={item.href}>
                                    <item.icon />
                                    <span>{item.label}</span>
                                    <div className="flex items-center gap-1 ml-auto">
                                        {item.countId && dynamicCounts[item.countId as keyof typeof dynamicCounts] > 0 && item.countId !== 'overdueTasks' && (
                                            <SidebarMenuBadge className="bg-primary text-primary-foreground !relative">
                                                {dynamicCounts[item.countId as keyof typeof dynamicCounts]}
                                            </SidebarMenuBadge>
                                        )}
                                        {item.href === '/my-dashboard' && dynamicCounts.criticalProjects > 0 && (
                                            <SidebarMenuBadge className="bg-red-500 text-white !relative">
                                                <AlertTriangle className="h-3 w-3 mr-1" />
                                                {dynamicCounts.criticalProjects}
                                            </SidebarMenuBadge>
                                        )}
                                         {item.href === '/my-dashboard' && dynamicCounts.overdueTasks > 0 && (
                                            <SidebarMenuBadge className="bg-yellow-400 text-yellow-900 !relative">
                                                <AlertTriangle className="h-3 w-3 mr-1" />
                                                {dynamicCounts.overdueTasks}
                                            </SidebarMenuBadge>
                                        )}
                                    </div>
                                </Link>
                            </SidebarMenuButton>
                            {hasChildren && (
                                <SidebarMenuSub>
                                    {item.children?.map(child => {
                                        const isChildActive = pathname.startsWith(child.href);
                                        return (
                                            <SidebarMenuSubItem key={child.href}>
                                                <SidebarMenuSubButton asChild isActive={isChildActive}>
                                                    <Link href={child.href}>
                                                        <child.icon />
                                                        <span>{child.label}</span>
                                                        <div className="flex items-center gap-1 ml-auto">
                                                          {rulemakingEvaluasiCount > 0 && (
                                                              <SidebarMenuBadge className="bg-yellow-400 text-yellow-900 !relative">
                                                                  {rulemakingEvaluasiCount}
                                                              </SidebarMenuBadge>
                                                          )}
                                                          {rulemakingRevisiCount > 0 && (
                                                              <SidebarMenuBadge className="bg-red-500 text-white !relative">
                                                                  {rulemakingRevisiCount}
                                                              </SidebarMenuBadge>
                                                          )}
                                                        </div>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        )
                                    })}
                                </SidebarMenuSub>
                            )}
                        </SidebarMenuItem>
                      )
                  })}
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
                  const count = item.countId ? dynamicCounts[item.countId as keyof typeof dynamicCounts] : 0;
                  const isActive = !item.isExternal && pathname.startsWith(item.href);
                  
                  return (
                      <SidebarMenuItem key={item.href} isActive={isActive}>
                      <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-500 to-green-500 blur opacity-0 transition duration-1000 group-hover/menu-item:opacity-75 data-[active=true]:opacity-75" data-active={isActive}></div>
                      <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className="transition-colors"
                      >
                          <Link href={item.href} {...linkProps}>
                          <item.icon />
                          <span>{item.label}</span>
                           <div className="flex items-center gap-1 ml-auto">
                          {count > 0 && item.countId === 'openStateLetters' ? (
                              <SidebarMenuBadge className="bg-destructive text-destructive-foreground !relative">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {count}
                              </SidebarMenuBadge>
                          ) : count > 0 ? (
                              <SidebarMenuBadge className={cn(
                              'bg-destructive text-destructive-foreground !relative'
                              )}>
                              {count}
                              </SidebarMenuBadge>
                          ) : null}
                          </div>
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
                  {navItems.tools.map((item: any) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                      <div key={item.href} className="relative group/menu-item">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg blur opacity-0 transition duration-1000 group-hover/menu-item:opacity-75 animate-gradient-move"></div>
                      <SidebarMenuItem isActive={isActive}>
                          <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className="transition-colors !bg-transparent"
                          >
                          <Link href={item.href}>
                              <item.icon />
                              <span>{item.label}</span>
                              {item.isBeta && (
                              <SidebarMenuBadge 
                                  className="bg-gradient-to-r from-green-400 to-blue-500 text-white shadow-lg animate-gradient-move !relative"
                                  style={{ backgroundSize: '200% 200%' }}
                              >
                                  Beta
                              </SidebarMenuBadge>
                              )}
                          </Link>
                          </SidebarMenuButton>
                      </SidebarMenuItem>
                      </div>
                  )
                  })}
              </SidebarMenu>
              </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
              <div className="px-2 py-1 group-data-[collapsible=icon]:hidden">
              <PrivacyDialog />
              </div>
              <div className="text-center text-xs text-sidebar-foreground/50 pt-2 group-data-[collapsible=icon]:hidden">
              stdatabase © 2025
              </div>
          </SidebarFooter>
          </Sidebar>
          <SidebarInset>
          <header className="sticky top-0 z-30 m-2 mt-4 flex items-center justify-between rounded-lg border bg-card/80 p-2 backdrop-blur-sm">
              <div className="flex items-center gap-2">
              <SidebarTrigger />
              <GlobalSearch onViewProfile={() => {}} />
              </div>
              <div className="flex items-center gap-2">
                <LiveClock />
                <StatusIndicator variant="server-icon" />
                <NotificationBell userId={userId} />
                <WhatsNewDialog
                    trigger={
                        <Button asChild variant="ghost" size="icon" className="relative">
                            <div>
                                <Sparkles className="h-5 w-5 text-yellow-500" />
                                <span className="sr-only">What's New</span>
                                <span className="absolute top-1 right-1 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                            </div>
                        </Button>
                    }
                />
                <ThemeToggle />
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-green-500 rounded-full blur opacity-0 group-hover:opacity-75 transition duration-1000 animate-gradient-move"></div>
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
                                <Link href="/whats-new">
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    <span>What's New</span>
                                </Link>
                            </DropdownMenuItem>
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
          <AskStdAiWidget />
          </SidebarInset>
      </SidebarProvider>
      {currentUser && (
          <MyTasksDialog
              open={isMyTasksDialogOpen}
              onOpenChange={setIsMyTasksDialogOpen}
              user={currentUser}
              tasks={myTasks}
          />
      )}
    </>
  );
}
