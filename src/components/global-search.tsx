
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
import { Button } from './ui/button';
import { Search, Home, Landmark, Users, FileText, ClipboardCheck, CircleHelp, Mail, BookType, Plane, ListChecks, Search as SearchIcon, FileWarning, BookCheck, BookOpenCheck, Gavel, Leaf, CalendarDays, BotMessageSquare, FileSearch } from 'lucide-react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Project, User, CcefodRecord, PqRecord, GapAnalysisRecord, GlossaryRecord, RulemakingRecord, AccidentIncidentRecord, KnktReport, TindakLanjutDgcaRecord, TindakLanjutRecord, LawEnforcementRecord, PemeriksaanRecord, Kegiatan } from '@/lib/types';
import { Highlight } from './ui/highlight';
import { cn } from '@/lib/utils';

interface GlobalSearchProps {
  onViewProfile: (user: User) => void;
}

export function GlobalSearch({ onViewProfile }: GlobalSearchProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [search, setSearch] = React.useState('');
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
    } else {
        // Clear search when dialog closes
        setInputValue('');
        setSearch('');
    }
  }, [open]);

  const runCommand = (command: () => unknown) => {
    setOpen(false)
    command()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setSearch(inputValue);
    }
  };


  return (
    <>
      <div className="relative group">
            <Button
                variant="outline"
                onClick={() => setOpen(true)}
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
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
            placeholder="Type a command or search..."
            value={inputValue}
            onValueChange={setInputValue}
            onKeyDown={handleKeyDown}
        />
        <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Projects">
                {projects.filter(p => search ? p.name.toLowerCase().includes(search.toLowerCase()) : true).map((project) => (
                <CommandItem
                    key={project.id}
                    onSelect={() => runCommand(() => router.push(`/projects/${project.id}?type=${project.projectType.toLowerCase().replace(' ', '')}`))}
                    value={`Project ${project.name} ${project.casr || ''} ${project.annex || ''}`}
                >
                    {project.projectType === 'Tim Kerja' ? <Home className="mr-2 h-4 w-4" /> : <Landmark className="mr-2 h-4 w-4" />}
                    <span><Highlight text={project.name} query={search} /></span>
                    <span className="ml-2 text-xs text-muted-foreground">{project.projectType}</span>
                </CommandItem>
                ))}
            </CommandGroup>
            <CommandGroup heading="Users">
                {users.filter(u => search ? u.name.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()) : true).map((user) => (
                <CommandItem
                    key={user.id}
                    onSelect={() => runCommand(() => onViewProfile(user))}
                    value={`User ${user.name} ${user.email}`}
                >
                    <Users className="mr-2 h-4 w-4" />
                    <span><Highlight text={user.name} query={search} /></span>
                     <span className="ml-2 text-xs text-muted-foreground"><Highlight text={user.role} query={search} /></span>
                </CommandItem>
                ))}
            </CommandGroup>
            <CommandGroup heading="Workspace">
                 {ccefodRecords.filter(r => search ? `${r.annexReference} ${r.annex}`.toLowerCase().includes(search.toLowerCase()) : true).map(record => (
                    <CommandItem key={record.id} onSelect={() => runCommand(() => router.push('/ccefod'))} value={`CC/EFOD ${record.annexReference} ${record.annex}`}>
                       <ClipboardCheck className="mr-2 h-4 w-4" />
                       <span className='whitespace-normal'><Highlight text={record.annexReference} query={search} /></span>
                       <span className="ml-2 text-xs text-muted-foreground whitespace-normal"><Highlight text={record.annex} query={search} /></span>
                    </CommandItem>
                ))}
                 {pqsRecords.filter(r => search ? `${r.pqNumber} ${r.protocolQuestion}`.toLowerCase().includes(search.toLowerCase()) : true).map(record => (
                    <CommandItem key={record.id} onSelect={() => runCommand(() => router.push('/pqs'))} value={`PQ ${record.pqNumber} ${record.protocolQuestion}`}>
                       <CircleHelp className="mr-2 h-4 w-4" />
                       <span className='whitespace-normal'>PQ <Highlight text={record.pqNumber} query={search} /></span>
                       <span className="ml-2 text-xs text-muted-foreground whitespace-normal"><Highlight text={record.protocolQuestion} query={search} /></span>
                    </CommandItem>
                ))}
                 {gapAnalysisRecords.filter(r => search ? `${r.slReferenceNumber} ${r.subject}`.toLowerCase().includes(search.toLowerCase()) : true).map(record => (
                    <CommandItem key={record.id} onSelect={() => runCommand(() => router.push('/state-letter'))} value={`State Letter ${record.slReferenceNumber} ${record.subject}`}>
                       <Mail className="mr-2 h-4 w-4" />
                       <span className='whitespace-normal'><Highlight text={record.slReferenceNumber} query={search} /></span>
                       <span className="ml-2 text-xs text-muted-foreground whitespace-normal"><Highlight text={record.subject} query={search} /></span>
                    </CommandItem>
                ))}
                 {glossaryRecords.filter(r => search ? `${r.tsu} ${r.tsa}`.toLowerCase().includes(search.toLowerCase()) : true).map(record => (
                    <CommandItem key={record.id} onSelect={() => runCommand(() => router.push('/glossary'))} value={`Glossary ${record.tsu} ${record.tsa}`}>
                       <BookType className="mr-2 h-4 w-4" />
                       <span className='whitespace-normal'><Highlight text={record.tsu} query={search} /></span>
                       <span className="ml-2 text-xs text-muted-foreground whitespace-normal"><Highlight text={record.tsa} query={search} /></span>
                    </CommandItem>
                ))}
            </CommandGroup>
            <CommandGroup heading="Rulemaking Monitoring">
                 {rulemakingRecords.filter(r => search ? `${r.perihal} ${r.kategori}`.toLowerCase().includes(search.toLowerCase()) : true).map(record => (
                    <CommandItem key={record.id} onSelect={() => runCommand(() => router.push('/rulemaking-monitoring'))} value={`Rulemaking ${record.perihal} ${record.kategori}`}>
                       <ListChecks className="mr-2 h-4 w-4" />
                       <span className='whitespace-normal'><Highlight text={record.perihal} query={search} /></span>
                        <span className="ml-2 text-xs text-muted-foreground whitespace-normal"><Highlight text={record.kategori} query={search} /></span>
                    </CommandItem>
                ))}
            </CommandGroup>
            <CommandGroup heading="Resolution Safety Issues (RSI)">
                 {accidentRecords.filter(r => search ? `${r.registrasiPesawat} ${r.lokasi}`.toLowerCase().includes(search.toLowerCase()) : true).map(record => (
                    <CommandItem key={record.id} onSelect={() => runCommand(() => router.push('/rsi/data-accident-incident'))} value={`Accident ${record.registrasiPesawat} ${record.lokasi}`}>
                       <FileWarning className="mr-2 h-4 w-4" />
                       <span className='whitespace-normal'><Highlight text={record.registrasiPesawat} query={search} /></span>
                       <span className="ml-2 text-xs text-muted-foreground whitespace-normal"><Highlight text={record.kategori} query={search} /> at <Highlight text={record.lokasi} query={search} /></span>
                    </CommandItem>
                ))}
                 {pemeriksaanRecords.filter(r => search ? `${r.registrasi} ${r.operator}`.toLowerCase().includes(search.toLowerCase()) : true).map(record => (
                    <CommandItem key={record.id} onSelect={() => runCommand(() => router.push('/rsi/pemeriksaan'))} value={`Pemeriksaan ${record.registrasi} ${record.operator}`}>
                       <SearchIcon className="mr-2 h-4 w-4" />
                       <span className='whitespace-normal'><Highlight text={record.registrasi} query={search} /></span>
                       <span className="ml-2 text-xs text-muted-foreground whitespace-normal"><Highlight text={record.operator} query={search} /></span>
                    </CommandItem>
                ))}
                {knktReports.map(record => (
                    <CommandItem key={record.id} onSelect={() => runCommand(() => router.push('/rsi/laporan-investigasi-knkt'))} value={`KNKT ${record.nomor_laporan} ${record.operator}`}>
                       <FileSearch className="mr-2 h-4 w-4" />
                       <span><Highlight text={record.nomor_laporan} query={search} /></span>
                       <span className="ml-2 text-xs text-muted-foreground"><Highlight text={record.operator} query={search} /></span>
                    </CommandItem>
                ))}
                {tindakLanjutRecords.filter(r => search ? `${r.nomorLaporan} ${r.judulLaporan}`.toLowerCase().includes(search.toLowerCase()) : true).map(record => (
                    <CommandItem key={record.id} onSelect={() => runCommand(() => router.push('/rsi/monitoring-rekomendasi'))} value={`Tindak Lanjut ${record.nomorLaporan} ${record.judulLaporan}`}>
                       <BookCheck className="mr-2 h-4 w-4" />
                       <span className='whitespace-normal'><Highlight text={record.nomorLaporan} query={search} /></span>
                       <span className="ml-2 text-xs text-muted-foreground whitespace-normal"><Highlight text={record.judulLaporan} query={search} /></span>
                    </CommandItem>
                ))}
                 {tindakLanjutDgcaRecords.filter(r => search ? `${r.nomorLaporan} ${r.judulLaporan}`.toLowerCase().includes(search.toLowerCase()) : true).map(record => (
                    <CommandItem key={record.id} onSelect={() => runCommand(() => router.push('/rsi/monitoring-rekomendasi-dgca'))} value={`Tindak Lanjut DGCA ${record.nomorLaporan} ${record.judulLaporan}`}>
                       <BookOpenCheck className="mr-2 h-4 w-4" />
                       <span className='whitespace-normal'><Highlight text={record.nomorLaporan} query={search} /></span>
                       <span className="ml-2 text-xs text-muted-foreground whitespace-normal"><Highlight text={record.judulLaporan} query={search} /></span>
                    </CommandItem>
                ))}
                {lawEnforcementRecords.filter(r => search ? `${r.impositionType} ${r.references[0]?.sanctionType}`.toLowerCase().includes(search.toLowerCase()) : true).map(record => (
                    <CommandItem key={record.id} onSelect={() => runCommand(() => router.push('/rsi/law-enforcement'))} value={`Law Enforcement ${record.impositionType} ${record.references[0]?.sanctionType}`}>
                       <Gavel className="mr-2 h-4 w-4" />
                       <span className="capitalize whitespace-normal"><Highlight text={record.impositionType} query={search} /></span>
                       <span className="ml-2 text-xs text-muted-foreground whitespace-normal"><Highlight text={record.references[0]?.sanctionType || ''} query={search} /></span>
                    </CommandItem>
                ))}
            </CommandGroup>
             <CommandGroup heading="Kegiatan">
                 {kegiatanRecords.filter(r => search ? `${r.subjek} ${r.lokasi}`.toLowerCase().includes(search.toLowerCase()) : true).map(record => (
                    <CommandItem key={record.id} onSelect={() => runCommand(() => router.push('/kegiatan'))} value={`Kegiatan ${record.subjek} ${record.lokasi}`}>
                       <CalendarDays className="mr-2 h-4 w-4" />
                       <span className='whitespace-normal'><Highlight text={record.subjek} query={search} /></span>
                       <span className="ml-2 text-xs text-muted-foreground whitespace-normal"><Highlight text={record.lokasi} query={search} /></span>
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
        </CommandList>
      </CommandDialog>
    </>
  );
}

    