
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Search, Home, Landmark, Users } from 'lucide-react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Project, User } from '@/lib/types';
import { cn } from '@/lib/utils';

interface GlobalSearchProps {
  onViewProfile: (user: User) => void;
}

export function GlobalSearch({ onViewProfile }: GlobalSearchProps) {
  const [open, setOpen] = React.useState(false);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [users, setUsers] = React.useState<User[]>([]);
  const [modifierKey, setModifierKey] = React.useState('⌘');
  const router = useRouter();

  React.useEffect(() => {
    // Detect OS to show correct modifier key.
    const isMac = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);
    setModifierKey(isMac ? '⌘' : 'Ctrl');

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  React.useEffect(() => {
    if (open) {
      const unsubProjects = onSnapshot(query(collection(db, 'timKerjaProjects')), (snapshot) => {
        setProjects(prev => [
            ...prev.filter(p => p.projectType !== 'Tim Kerja'), 
            ...snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), projectType: 'Tim Kerja' } as Project))
        ]);
      });
      const unsubRulemaking = onSnapshot(query(collection(db, 'rulemakingProjects')), (snapshot) => {
         setProjects(prev => [
            ...prev.filter(p => p.projectType !== 'Rulemaking'), 
            ...snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), projectType: 'Rulemaking' } as Project))
        ]);
      });
      const unsubUsers = onSnapshot(query(collection(db, 'users')), (snapshot) => {
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
      });

      return () => {
        unsubProjects();
        unsubRulemaking();
        unsubUsers();
      };
    }
  }, [open]);

  const handleSelectProject = (href: string) => {
    router.push(href);
    setOpen(false);
  };
  
  const handleSelectUser = (user: User) => {
    // This functionality is now handled on the chats page directly
    // onViewProfile(user);
    router.push('/chats');
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative group">
            <Button
                variant="outline"
                className="h-9 w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64 transition-transform duration-200 group-hover:scale-105"
            >
                 <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg blur opacity-0 group-hover:opacity-75 transition duration-1000"></div>
                <div className="relative flex items-center w-full">
                    <Search className="mr-2 h-4 w-4" />
                    <span className="hidden lg:inline-flex">Search...</span>
                    <span className="inline-flex lg:hidden">Search...</span>
                    <kbd className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex transition-colors group-hover:bg-background/80 group-hover:text-muted-foreground">
                        <span className="text-xs">{modifierKey}</span>K
                    </kbd>
                </div>
            </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Projects">
                    {projects.map((project) => (
                    <CommandItem
                        key={project.id}
                        onSelect={() => handleSelectProject(`/projects/${project.id}?type=${project.projectType.toLowerCase().replace(' ', '')}`)}
                        value={`Project ${project.name} ${project.casr || ''} ${project.annex || ''}`}
                    >
                        {project.projectType === 'Tim Kerja' ? <Home className="mr-2 h-4 w-4" /> : <Landmark className="mr-2 h-4 w-4" />}
                        <span>{project.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{project.projectType}</span>
                    </CommandItem>
                    ))}
                </CommandGroup>
                <CommandGroup heading="Users">
                    {users.map((user) => (
                    <CommandItem
                        key={user.id}
                        onSelect={() => handleSelectUser(user)}
                        value={`User ${user.name} ${user.email}`}
                    >
                        <Users className="mr-2 h-4 w-4" />
                        <span>{user.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{user.role}</span>
                    </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
