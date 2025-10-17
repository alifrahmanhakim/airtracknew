
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
import { Search, Home, Landmark, Users, HelpCircle } from 'lucide-react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Project, User } from '@/lib/types';
import { cn } from '@/lib/utils';

interface GlobalSearchProps {
  onViewProfile: (user: User) => void;
}

// Jaro-Winkler similarity function for "Did you mean?" feature
const jaroWinkler = (s1: string, s2: string): number => {
    let m = 0;
    
    if (s1.length === 0 || s2.length === 0) {
        return 0;
    }

    if (s1 === s2) {
        return 1;
    }
    
    const range = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
    const s1Matches = new Array(s1.length).fill(false);
    const s2Matches = new Array(s2.length).fill(false);

    for (let i = 0; i < s1.length; i++) {
        const start = Math.max(0, i - range);
        const end = Math.min(i + range + 1, s2.length);
        for (let j = start; j < end; j++) {
            if (!s2Matches[j] && s1[i] === s2[j]) {
                s1Matches[i] = true;
                s2Matches[j] = true;
                m++;
                break;
            }
        }
    }

    if (m === 0) {
        return 0;
    }

    let t = 0;
    let k = 0;
    for (let i = 0; i < s1.length; i++) {
        if (s1Matches[i]) {
            while (!s2Matches[k]) {
                k++;
            }
            if (s1[i] !== s2[k]) {
                t++;
            }
            k++;
        }
    }

    const jaro = (m / s1.length + m / s2.length + (m - t / 2) / m) / 3;
    
    let l = 0;
    const p = 0.1;
    if (jaro > 0.7) {
        while (s1[l] === s2[l] && l < 4) {
            l++;
        }
    }
    
    return jaro + l * p * (1 - jaro);
};


export function GlobalSearch({ onViewProfile }: GlobalSearchProps) {
  const [open, setOpen] = React.useState(false);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [users, setUsers] = React.useState<User[]>([]);
  const [modifierKey, setModifierKey] = React.useState('⌘');
  const [searchQuery, setSearchQuery] = React.useState('');
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
  
  const suggestion = React.useMemo(() => {
    if (!searchQuery) return null;
    
    let bestMatch: { item: Project | User; score: number } | null = null;
    
    const allSearchableItems = [
        ...projects.map(p => ({ ...p, type: 'project' })),
        ...users.map(u => ({ ...u, type: 'user' }))
    ];

    for (const item of allSearchableItems) {
        if (item.name && typeof item.name === 'string') {
            const score = jaroWinkler(searchQuery.toLowerCase(), item.name.toLowerCase());
            if (score > 0.8 && (!bestMatch || score > bestMatch.score)) {
                bestMatch = { item, score };
            }
        }
    }
    
    return bestMatch;
  }, [searchQuery, projects, users]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative group">
            <Button
                variant="outline"
                className="h-9 w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64 transition-transform duration-200"
            >
                 <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg blur opacity-0 group-hover:opacity-75 transition duration-1000"></div>
                <div className="relative flex items-center">
                    <Search className="mr-2 h-4 w-4" />
                    <span className="hidden lg:inline-flex">Search...</span>
                    <span className="inline-flex lg:hidden">Search...</span>
                </div>
                 <kbd className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 transition-colors group-hover:bg-background/80 group-hover:text-muted-foreground sm:flex">
                    <span className="text-xs">{modifierKey}</span>K
                </kbd>
            </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
            <CommandInput 
              placeholder="Type a command or search..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
                <CommandEmpty>
                    {suggestion ? (
                         <div className="p-4 text-center text-sm">
                            No results found. Did you mean:{" "}
                            <Button
                                variant="link"
                                className="p-0 h-auto"
                                onClick={() => {
                                    if(suggestion.item.name) {
                                        setSearchQuery(suggestion.item.name);
                                    }
                                }}
                            >
                                {suggestion.item.name}?
                            </Button>
                        </div>
                    ) : 'No results found.'}
                </CommandEmpty>
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
