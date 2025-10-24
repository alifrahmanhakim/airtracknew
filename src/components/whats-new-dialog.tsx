
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from './ui/button';
import { Rocket, Lightbulb, Settings, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface WhatsNewDialogProps {
  trigger: React.ReactNode;
}

const UpdateSection = ({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) => (
    <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-3">
            {icon}
            {title}
        </h2>
        <div className="space-y-3 text-muted-foreground text-sm pl-8">
            {children}
        </div>
    </section>
);

export function WhatsNewDialog({ trigger }: WhatsNewDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className={cn(
          "sm:max-w-3xl max-h-[80vh] bg-background/80 backdrop-blur-sm",
        )}>
        <DialogHeader>
          <DialogTitle>What's New in AirTrack?</DialogTitle>
          <DialogDescription>
            Rangkuman pembaruan dari versi `06b753e` ke `714731b`.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-6">
          <div className="space-y-8">
            <UpdateSection title="Fitur & Modul Baru yang Signifikan" icon={<Rocket className="text-primary" />}>
                <div>
                    <h3 className="font-bold text-foreground">Resolution Safety Issues (RSI) Dashboard</h3>
                    <p>Memperkenalkan modul RSI sebagai pusat pemantauan keamanan penerbangan yang komprehensif, mencakup Data Accident & Incident, Pemeriksaan, Laporan Investigasi KNKT, Monitoring Rekomendasi, dan List of Law Enforcement.</p>
                </div>
                 <div>
                    <h3 className="font-bold text-foreground">Kegiatan Subdirektorat (Subdit)</h3>
                    <p>Menu baru untuk mencatat, melacak, dan menganalisis semua jadwal kegiatan internal Subdirektorat Standardisasi, ditampilkan dalam format mingguan dan bulanan.</p>
                </div>
                 <div>
                    <h3 className="font-bold text-foreground">Integrasi Kecerdasan Buatan (AI)</h3>
                    <p><strong>Ask STD.Ai</strong>: Sebuah asisten AI baru yang terintegrasi di sidebar untuk membantu menjawab pertanyaan terkait regulasi dan standar keselamatan, dengan widget akses cepat di pojok kanan bawah.</p>
                </div>
            </UpdateSection>

            <UpdateSection title="Peningkatan Fitur & Antarmuka" icon={<Lightbulb className="text-yellow-500" />}>
                 <div>
                    <h3 className="font-bold text-foreground">Peningkatan Dasbor RSI</h3>
                    <p>Kartu "Awaiting Operator Follow-Up" dan "Pending Follow-Ups by Operator" kini lebih interaktif dengan fitur pencarian, highlight, progress bar, dan dialog pop-up untuk melihat detail tanpa meninggalkan halaman.</p>
                </div>
                <div>
                    <h3 className="font-bold text-foreground">Peningkatan Modul "Translation Analysis" (Glossary)</h3>
                    <p>Integrasi KBBI dan AI Translator dari UNESCO untuk mempercepat dan memvalidasi proses penerjemahan.</p>
                </div>
                 <div>
                    <h3 className="font-bold text-foreground">Desain Ulang Dasbor Utama</h3>
                    <p>Dasbor "Tim Kerja" dan "Rulemaking" telah didesain ulang dengan tata letak yang lebih informatif dan visual.</p>
                </div>
                 <div>
                    <h3 className="font-bold text-foreground">Fungsionalitas Pencarian Universal</h3>
                    <p>Fitur pencarian di seluruh aplikasi sekarang memberikan sorotan (highlight) pada teks yang cocok.</p>
                </div>
                 <div>
                    <h3 className="font-bold text-foreground">Perbaikan Menu "State Letter"</h3>
                    <p>Fungsionalitas menu "State Letter" telah disesuaikan agar selaras dengan alur kerja formulir GAP Analysis.</p>
                </div>
            </UpdateSection>

            <UpdateSection title="Perbaikan Logika dan Stabilitas" icon={<Settings className="text-gray-500" />}>
                <div>
                    <h3 className="font-bold text-foreground">Logika Status Proyek yang Dinamis</h3>
                    <p>Status "Completed" pada sebuah proyek kini akan otomatis dievaluasi ulang jika ada tugas baru yang ditambahkan.</p>
                </div>
                <div>
                    <h3 className="font-bold text-foreground">Perbaikan Sidebar & Error</h3>
                    <p>Memperbaiki masalah hilangnya sidebar di beberapa halaman dan mengatasi "Hydration Error" untuk meningkatkan stabilitas aplikasi.</p>
                </div>
                <div>
                    <h3 className="font-bold text-foreground">Desain yang Lebih Halus</h3>
                    <p>Efek visual seperti gradien pada tombol "My Tasks" di sidebar telah diperhalus.</p>
                </div>
            </UpdateSection>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
