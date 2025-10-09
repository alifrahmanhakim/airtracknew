
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowRight, BarChart, FileSearch, ShieldQuestion, FileWarning, Search, List } from 'lucide-react';
import Link from 'next/link';

const rsiModules = [
  {
    title: 'Data Accident & Serious Incident',
    description: 'Review and analyze accident and serious incident data.',
    icon: <FileWarning className="h-8 w-8 text-destructive" />,
    href: '/rsi/data-accident-incident',
  },
  {
    title: 'Pemeriksaan',
    description: 'Conduct and manage examinations related to safety.',
    icon: <Search className="h-8 w-8 text-blue-500" />,
    href: '#',
  },
  {
    title: 'Laporan Investigasi KNKT',
    description: 'Access and manage NTSC investigation reports.',
    icon: <FileSearch className="h-8 w-8 text-yellow-500" />,
    href: '/rsi/laporan-investigasi-knkt',
  },
  {
    title: 'Monitoring Tindak Lanjut Rekomendasi Keselamatan KNKT',
    description: 'Track follow-ups on NTSC safety recommendations.',
    icon: <BarChart className="h-8 w-8 text-green-500" />,
    href: '#',
  },
  {
    title: 'Monitoring Tindak Lanjut Rekomendasi Keselamatan KNKT ke DGCA',
    description: 'Track follow-ups on NTSC recommendations to the DGCA.',
    icon: <ShieldQuestion className="h-8 w-8 text-purple-500" />,
    href: '#',
  },
  {
    title: 'List of Law Enforcement',
    description: 'View and manage the list of law enforcement actions.',
    icon: <List className="h-8 w-8 text-gray-500" />,
    href: '#',
  },
];

export default function RsiPage() {
  return (
    <main className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Resolved Safety Issues (RSI) Dashboard</h1>
        <p className="text-muted-foreground">
          A centralized hub for managing and monitoring safety incidents and recommendations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rsiModules.map((module) => (
          <Link key={module.title} href={module.href}>
            <Card className="h-full flex flex-col hover:shadow-lg hover:border-primary transition-all">
              <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                {module.icon}
                <CardTitle>{module.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">
                  {module.description}
                </p>
              </CardContent>
              <div className="p-6 pt-0 mt-auto">
                  <div className="flex items-center text-sm text-primary font-semibold">
                      Open Module <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
