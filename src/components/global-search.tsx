
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { DialogTitle } from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Search, Home, Landmark, Users, FileText, ClipboardCheck, CircleHelp, Mail, BookType, Plane, ListChecks, Search as SearchIcon, FileWarning, BookCheck, BookOpenCheck, Gavel, Leaf, CalendarDays, BotMessageSquare, FileSearch } from 'lucide-react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Project, User, CcefodRecord, PqRecord, GapAnalysisRecord, GlossaryRecord, RulemakingRecord, AccidentIncidentRecord, KnktReport, TindakLanjutDgcaRecord, TindakLanjutRecord, LawEnforcementRecord, PemeriksaanRecord, Kegiatan } from '@/lib/types';
import { Highlight } from './ui/highlight';

interface GlobalSearchProps {
  onViewProfile: (user: User) => void;
}

export function GlobalSearch({ onViewProfile }: GlobalSearchProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const router = useRouter();
  const [modifierKey, setModifierKey] = React.useState('⌘');
  
  // State for all data sources
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [users, setUsers] = React.useState<User[]>([]);
  const [ccefodRecords, setCcefodRecords] = React.useState<CcefodRecord[]>([]);
  const [pqsRecords, setPqsRecords] = React.useState<PqRecord[]>([]);
  const [gapAnalysisRecords, setGapAnalysisRecords] = React.useState<GapAnalysisRecord[]>([]);
  const [glossaryRecords, setGlossaryRecords] = React.useState<GlossaryRecord[]>([]);
  const [rulemakingRecords, setRulemakingRecords] = React.useState<RulemakingRecord[]>([]);
  
  // RSI Data
  const [accidentRecords, setAccidentRecords] = React.useState<AccidentIncidentRecord[]>([]);
  const [knktReports, setKnktReports] = React.useState<KnktReport[]>([]);
  const [tindakLanjutRecords, setTindakLanjutRecords] = React.useState<TindakLanjutRecord[]>([]);
  const [tindakLanjutDgcaRecords, setTindakLanjutDgcaRecords] = React.useState<TindakLanjutDgcaRecord[]>([]);
  const [lawEnforcementRecords, setLawEnforcementRecords] = React.useState<LawEnforcementRecord[]>([]);
  const [pemeriksaanRecords, setPemeriksaanRecords] = React.useState<PemeriksaanRecord[]>([]);
  const [kegiatanRecords, setKegiatanRecords] = React.useState<Kegiatan[]>([]);


  React.useEffect(() => {
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
      const collections = {
        timKerjaProjects: (data: any[]) => setProjects(prev => [...prev.filter(p => p.projectType !== 'Tim Kerja'), ...data.map(d => ({ ...d, projectType: 'Tim Kerja' } as Project))]),
        rulemakingProjects: (data: any[]) => setProjects(prev => [...prev.filter(p => p.projectType !== 'Rulemaking'), ...data.map(d => ({ ...d, projectType: 'Rulemaking' } as Project))]),
        users: setUsers,
        ccefodRecords: setCcefodRecords,
        pqsRecords: setPqsRecords,
        gapAnalysisRecords: setGapAnalysisRecords,
        glossaryRecords: setGlossaryRecords,
        rulemakingRecords: setRulemakingRecords,
        accidentIncidentRecords: setAccidentRecords,
        knktReports: setKnktReports,
        tindakLanjutRecords: setTindakLanjutRecords,
        tindakLanjutDgcaRecords: setTindakLanjutDgcaRecords,
        lawEnforcementRecords: setLawEnforcementRecords,
        pemeriksaanRecords: setPemeriksaanRecords,
        kegiatanRecords: setKegiatanRecords,
      };

      const unsubs = Object.entries(collections).map(([name, setter]) => {
        return onSnapshot(query(collection(db, name)), (snapshot) => {
          setter(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
      });

      return () => unsubs.forEach(unsub => unsub());
    }
  }, [open]);

  const runCommand = (command: () => unknown) => {
    setOpen(false)
    command()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setSearchQuery(inputValue);
    }
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
        setInputValue('');
        setSearchQuery('');
    }
  }


  return (
    <>
      <div className="relative group">
            <Button
                variant="outline"
                onClick={() => handleOpenChange(true)}
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
      <CommandDialog open={open} onOpenChange={handleOpenChange}>
        <DialogTitle className="sr-only">Global Search</DialogTitle>
        <CommandInput 
            placeholder="Type what you want to search and press Enter"
            value={inputValue}
            onValueChange={setInputValue}
            onKeyDown={handleKeyDown}
        />
        <CommandList>
          {!searchQuery ? (
             <div className="py-6 text-center text-sm text-muted-foreground">Type what you want to search and press Enter.</div>
          ) : (
            <>
              <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Projects">
                    {projects.filter(p => searchQuery ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.casr?.toLowerCase().includes(searchQuery.toLowerCase()) || p.annex?.toLowerCase().includes(searchQuery.toLowerCase()) : true).map((project) => (
                    <CommandItem
                        key={project.id}
                        onSelect={() => runCommand(() => router.push(`/projects/${project.id}?type=${project.projectType.toLowerCase().replace(' ', '')}`))}
                        value={`Project ${project.name} ${project.casr || ''} ${project.annex || ''}`}
                        className="flex-wrap h-auto"
                    >
                        {project.projectType === 'Tim Kerja' ? <Home className="mr-2 h-4 w-4" /> : <Landmark className="mr-2 h-4 w-4" />}
                        <span className='whitespace-normal'><Highlight text={project.name} query={searchQuery} /></span>
                        <span className="ml-2 text-xs text-muted-foreground">{project.projectType}</span>
                    </CommandItem>
                    ))}
                </CommandGroup>
                <CommandGroup heading="Users">
                    {users.filter(u => searchQuery ? u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase()) : true).map((user) => (
                    <CommandItem
                        key={user.id}
                        onSelect={() => runCommand(() => onViewProfile(user))}
                        value={`User ${user.name} ${user.email}`}
                        className="flex-wrap h-auto"
                    >
                        <Users className="mr-2 h-4 w-4" />
                        <span><Highlight text={user.name || ''} query={searchQuery} /></span>
                        <span className="ml-2 text-xs text-muted-foreground"><Highlight text={user.role || ''} query={searchQuery} /></span>
                    </CommandItem>
                    ))}
                </CommandGroup>
                <CommandGroup heading="Workspace">
                    {ccefodRecords.filter(r => searchQuery ? `${r.annexReference} ${r.annex} ${r.standardPractice}`.toLowerCase().includes(searchQuery.toLowerCase()) : true).map(record => (
                        <CommandItem key={record.id} onSelect={() => runCommand(() => router.push(`/ccefod?view=${record.id}`))} value={`CC/EFOD ${record.annexReference} ${record.annex}`} className="flex-wrap h-auto">
                        <ClipboardCheck className="mr-2 h-4 w-4" />
                        <span className='whitespace-normal'><Highlight text={record.annexReference} query={searchQuery} /></span>
                        <span className="ml-2 text-xs text-muted-foreground whitespace-normal"><Highlight text={record.annex} query={searchQuery} /></span>
                        </CommandItem>
                    ))}
                    {pqsRecords.filter(r => searchQuery ? `${r.pqNumber} ${r.protocolQuestion}`.toLowerCase().includes(searchQuery.toLowerCase()) : true).map(record => (
                        <CommandItem key={record.id} onSelect={() => runCommand(() => router.push(`/pqs?view=${record.id}`))} value={`PQ ${record.pqNumber} ${record.protocolQuestion}`} className="flex-wrap h-auto">
                        <CircleHelp className="mr-2 h-4 w-4" />
                        <span className='whitespace-normal'>PQ <Highlight text={record.pqNumber} query={searchQuery} /></span>
                        <span className="ml-2 text-xs text-muted-foreground whitespace-normal"><Highlight text={record.protocolQuestion} query={searchQuery} /></span>
                        </CommandItem>
                    ))}
                    {gapAnalysisRecords.filter(r => searchQuery ? `${r.slReferenceNumber} ${r.subject}`.toLowerCase().includes(searchQuery.toLowerCase()) : true).map(record => (
                        <CommandItem key={record.id} onSelect={() => runCommand(() => router.push(`/state-letter?view=${record.id}`))} value={`State Letter ${record.slReferenceNumber} ${record.subject}`} className="flex-wrap h-auto">
                        <Mail className="mr-2 h-4 w-4" />
                        <span className='whitespace-normal'><Highlight text={record.slReferenceNumber} query={searchQuery} /></span>
                        <span className="ml-2 text-xs text-muted-foreground whitespace-normal"><Highlight text={record.subject} query={searchQuery} /></span>
                        </CommandItem>
                    ))}
                    {glossaryRecords.filter(r => searchQuery ? `${r.tsu} ${r.tsa}`.toLowerCase().includes(searchQuery.toLowerCase()) : true).map(record => (
                        <CommandItem key={record.id} onSelect={() => runCommand(() => router.push(`/glossary?view=${record.id}`))} value={`Glossary ${record.tsu} ${record.tsa}`} className="flex-wrap h-auto">
                        <BookType className="mr-2 h-4 w-4" />
                        <span className='whitespace-normal'><Highlight text={record.tsu} query={searchQuery} /></span>
                        <span className="ml-2 text-xs text-muted-foreground whitespace-normal"><Highlight text={record.tsa} query={searchQuery} /></span>
                        </CommandItem>
                    ))}
                </CommandGroup>
                <CommandGroup heading="Rulemaking Monitoring">
                    {rulemakingRecords.filter(r => searchQuery ? `${r.perihal} ${r.kategori}`.toLowerCase().includes(searchQuery.toLowerCase()) : true).map(record => (
                        <CommandItem key={record.id} onSelect={() => runCommand(() => router.push(`/rulemaking-monitoring?view=${record.id}`))} value={`Rulemaking ${record.perihal} ${record.kategori}`} className="flex-wrap h-auto">
                        <ListChecks className="mr-2 h-4 w-4" />
                        <span className='whitespace-normal'><Highlight text={record.perihal} query={searchQuery} /></span>
                            <span className="ml-2 text-xs text-muted-foreground whitespace-normal"><Highlight text={record.kategori} query={searchQuery} /></span>
                        </CommandItem>
                    ))}
                </CommandGroup>
                <CommandGroup heading="Resolution Safety Issues (RSI)">
                    {accidentRecords.filter(r => searchQuery ? `${r.registrasiPesawat} ${r.lokasi}`.toLowerCase().includes(searchQuery.toLowerCase()) : true).map(record => (
                        <CommandItem key={record.id} onSelect={() => runCommand(() => router.push(`/rsi/data-accident-incident?view=${record.id}`))} value={`Accident ${record.registrasiPesawat} ${record.lokasi}`} className="flex-wrap h-auto">
                        <FileWarning className="mr-2 h-4 w-4" />
                        <span className='whitespace-normal'><Highlight text={record.registrasiPesawat} query={searchQuery} /></span>
                        <span className="ml-2 text-xs text-muted-foreground whitespace-normal"><Highlight text={record.kategori} query={searchQuery} /> at <Highlight text={record.lokasi} query={searchQuery} /></span>
                        </CommandItem>
                    ))}
                    {pemeriksaanRecords.filter(r => searchQuery ? `${r.registrasi} ${r.operator}`.toLowerCase().includes(searchQuery.toLowerCase()) : true).map(record => (
                        <CommandItem key={record.id} onSelect={() => runCommand(() => router.push(`/rsi/pemeriksaan?view=${record.id}`))} value={`Pemeriksaan ${record.registrasi} ${record.operator}`} className="flex-wrap h-auto">
                        <SearchIcon className="mr-2 h-4 w-4" />
                        <span className='whitespace-normal'><Highlight text={record.registrasi} query={searchQuery} /></span>
                        <span className="ml-2 text-xs text-muted-foreground whitespace-normal"><Highlight text={record.operator} query={searchQuery} /></span>
                        </CommandItem>
                    ))}
                    {knktReports.filter(r => searchQuery ? `${r.nomor_laporan} ${r.operator}`.toLowerCase().includes(searchQuery.toLowerCase()) : true).map(record => (
                        <CommandItem key={record.id} onSelect={() => runCommand(() => router.push(`/rsi/laporan-investigasi-knkt?view=${record.id}`))} value={`KNKT ${record.nomor_laporan} ${record.operator}`}>
                       <FileSearch className="mr-2 h-4 w-4" />
                       <span className="whitespace-normal"><Highlight text={record.nomor_laporan} query={searchQuery} /></span>
                       <span className="ml-2 text-xs text-muted-foreground"><Highlight text={record.operator} query={searchQuery} /></span>
                        </CommandItem>
                    ))}
                    {tindakLanjutRecords.filter(r => searchQuery ? `${r.nomorLaporan} ${r.judulLaporan}`.toLowerCase().includes(searchQuery.toLowerCase()) : true).map(record => (
                        <CommandItem key={record.id} onSelect={() => runCommand(() => router.push(`/rsi/monitoring-rekomendasi?view=${record.id}`))} value={`Tindak Lanjut ${record.nomorLaporan} ${record.judulLaporan}`} className="flex-wrap h-auto">
                        <BookCheck className="mr-2 h-4 w-4" />
                        <span className='whitespace-normal'><Highlight text={record.nomorLaporan} query={searchQuery} /></span>
                        <span className="ml-2 text-xs text-muted-foreground whitespace-normal"><Highlight text={record.judulLaporan} query={searchQuery} /></span>
                        </CommandItem>
                    ))}
                    {tindakLanjutDgcaRecords.filter(r => searchQuery ? `${r.nomorLaporan} ${r.judulLaporan}`.toLowerCase().includes(searchQuery.toLowerCase()) : true).map(record => (
                        <CommandItem key={record.id} onSelect={() => runCommand(() => router.push(`/rsi/monitoring-rekomendasi-dgca?view=${record.id}`))} value={`Tindak Lanjut DGCA ${record.nomorLaporan} ${record.judulLaporan}`} className="flex-wrap h-auto">
                        <BookOpenCheck className="mr-2 h-4 w-4" />
                        <span className='whitespace-normal'><Highlight text={record.nomorLaporan} query={searchQuery} /></span>
                        <span className="ml-2 text-xs text-muted-foreground whitespace-normal"><Highlight text={record.judulLaporan} query={searchQuery} /></span>
                        </CommandItem>
                    ))}
                    {lawEnforcementRecords.filter(r => searchQuery ? `${r.impositionType} ${r.references[0]?.sanctionType}`.toLowerCase().includes(searchQuery.toLowerCase()) : true).map(record => (
                        <CommandItem key={record.id} onSelect={() => runCommand(() => router.push(`/rsi/law-enforcement?view=${record.id}`))} value={`Law Enforcement ${record.impositionType} ${record.references[0]?.sanctionType}`} className="flex-wrap h-auto">
                        <Gavel className="mr-2 h-4 w-4" />
                        <span className="capitalize whitespace-normal"><Highlight text={record.impositionType} query={searchQuery} /></span>
                        <span className="ml-2 text-xs text-muted-foreground whitespace-normal"><Highlight text={record.references[0]?.sanctionType || ''} query={searchQuery} /></span>
                        </CommandItem>
                    ))}
                </CommandGroup>
                <CommandGroup heading="Kegiatan">
                    {kegiatanRecords.filter(r => searchQuery ? `${r.subjek} ${r.lokasi}`.toLowerCase().includes(searchQuery.toLowerCase()) : true).map(record => (
                        <CommandItem key={record.id} onSelect={() => runCommand(() => router.push(`/kegiatan?view=${record.id}`))} value={`Kegiatan ${record.subjek} ${record.lokasi}`} className="flex-wrap h-auto">
                        <CalendarDays className="mr-2 h-4 w-4" />
                        <span className='whitespace-normal'><Highlight text={record.subjek} query={searchQuery} /></span>
                        <span className="ml-2 text-xs text-muted-foreground whitespace-normal"><Highlight text={record.lokasi} query={searchQuery} /></span>
                        </CommandItem>
                    ))}
                </CommandGroup>
                <CommandGroup heading="Tools">
                    <CommandItem onSelect={() => runCommand(() => router.push('/tools/ask-std-ai'))}>
                        <BotMessageSquare className="mr-2 h-4 w-4" />
                        <span>Ask STD.Ai</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => window.open('https://dgcaems.vercel.app/', '_blank'))}>
                        <Leaf className="mr-2 h-4 w-4" />
                        <span>Environment</span>
                    </CommandItem>
                </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}

    