
import type { User, Project } from './types';

export const users: User[] = [
  { id: 'user-1', name: 'Alex Johnson', avatarUrl: 'https://placehold.co/100x100.png', role: 'Ketua Tim' },
  { id: 'user-2', name: 'Maria Garcia', avatarUrl: 'https://placehold.co/100x100.png', role: 'PIC' },
  { id: 'user-3', name: 'James Smith', avatarUrl: 'https://placehold.co/100x100.png', role: 'Asisten PIC' },
  { id: 'user-4', name: 'Patricia Williams', avatarUrl: 'https://placehold.co/100x100.png', role: 'Fungsional' },
  { id: 'user-5', name: 'Robert Brown', avatarUrl: 'https://placehold.co/100x100.png', role: 'Kepala Sub-Direktorat' },
];

export const projects: Project[] = [
  {
    id: 'proj-1',
    name: 'Sistem Pengendalian Lalu Lintas Udara Generasi Berikutnya',
    description: 'Pengembangan dan penerapan sistem pengendalian lalu lintas udara generasi baru untuk meningkatkan keselamatan dan efisiensi.',
    startDate: '2023-01-15',
    endDate: '2024-12-31',
    status: 'Sesuai Jalur',
    tasks: [
      { id: 'task-1-1', title: 'Desain Arsitektur Sistem', assigneeId: 'user-1', dueDate: '2023-03-31', status: 'Selesai' },
      { id: 'task-1-2', title: 'Pengembangan Perangkat Lunak - Fase 1', assigneeId: 'user-2', dueDate: '2023-08-31', status: 'Selesai' },
      { id: 'task-1-3', title: 'Integrasi Perangkat Keras', assigneeId: 'user-3', dueDate: '2024-02-28', status: 'Sedang Berjalan' },
      { id: 'task-1-4', title: 'Mockup Antarmuka Pengguna', assigneeId: 'user-4', dueDate: '2024-05-15', status: 'Akan Dikerjakan' },
    ],
    documents: [
      { id: 'doc-1-1', name: 'Piagam Proyek.pdf', type: 'PDF', uploadDate: '2023-01-20', url: '#' },
      { id: 'doc-1-2', name: 'Persyaratan Sistem.docx', type: 'Word', uploadDate: '2023-02-10', url: '#' },
    ],
    notes: 'Fase 1 pengembangan perangkat lunak selesai lebih cepat dari jadwal. Integrasi perangkat keras menjadi fokus saat ini dan berjalan sesuai rencana. Semangat tim tinggi.',
    team: [users[0], users[1], users[2], users[3]],
    subProjects: [
        { id: 'sub-1-1', name: 'Desain Ulang UI/UX', description: 'Mendesain ulang antarmuka pengguna untuk sistem baru', status: 'Sesuai Jalur' },
        { id: 'sub-1-2', name: 'Refactor Backend', description: 'Memfaktorkan ulang backend untuk meningkatkan kinerja', status: 'Selesai' },
    ],
  },
  {
    id: 'proj-2',
    name: 'Inisiatif Bahan Bakar Penerbangan Berkelanjutan',
    description: 'Penelitian dan implementasi bahan bakar penerbangan berkelanjutan (SAF) di seluruh armada untuk mengurangi emisi karbon.',
    startDate: '2023-06-01',
    endDate: '2025-05-30',
    status: 'Beresiko',
    tasks: [
      { id: 'task-2-1', title: 'Identifikasi & Pemeriksaan Pemasok', assigneeId: 'user-2', dueDate: '2023-09-30', status: 'Selesai' },
      { id: 'task-2-2', title: 'Pengujian Kompatibilitas Mesin', assigneeId: 'user-1', dueDate: '2024-04-30', status: 'Sedang Berjalan' },
      { id: 'task-2-3', title: 'Pengajuan Persetujuan Regulasi', assigneeId: 'user-5', dueDate: '2024-08-15', status: 'Terhambat' },
      { id: 'task-2-4', title: 'Pengaturan Logistik dan Rantai Pasokan', assigneeId: 'user-3', dueDate: '2025-01-20', status: 'Akan Dikerjakan' },
    ],
    documents: [
      { id: 'doc-2-1', name: 'Makalah Riset SAF.pdf', type: 'PDF', uploadDate: '2023-06-05', url: '#' },
      { id: 'doc-2-2', name: 'Daftar Pemasok.xlsx', type: 'Excel', uploadDate: '2023-09-15', url: '#' },
    ],
    notes: 'Uji kompatibilitas mesin menunjukkan keausan tak terduga yang menyebabkan penundaan. Persetujuan regulasi terhambat menunggu hasil dari pengujian ini. Hal ini membahayakan jadwal proyek.',
    team: [users[1], users[0], users[4], users[2]],
    subProjects: [],
  },
  {
    id: 'proj-3',
    name: 'Program Inspeksi Drone Otomatis',
    description: 'Menerapkan program inspeksi pesawat otomatis menggunakan armada drone otonom.',
    startDate: '2024-02-01',
    endDate: '2024-11-30',
    status: 'Keluar Jalur',
    tasks: [
      { id: 'task-3-1', title: 'Pengadaan Armada Drone', assigneeId: 'user-3', dueDate: '2024-03-15', status: 'Selesai' },
      { id: 'task-3-2', title: 'Pengembangan Perangkat Lunak Kontrol Penerbangan', assigneeId: 'user-1', dueDate: '2024-07-31', status: 'Sedang Berjalan' },
      { id: 'task-3-3', title: 'Pelatihan AI Pengenalan Gambar', assigneeId: 'user-4', dueDate: '2024-09-30', status: 'Akan Dikerjakan' },
      { id: 'task-3-4', title: 'Uji Coba Lapangan', assigneeId: 'user-2', dueDate: '2024-11-15', status: 'Akan Dikerjakan' },
    ],
    documents: [
      { id: 'doc-3-1', name: 'Lembar Spesifikasi Drone.pdf', type: 'PDF', uploadDate: '2024-02-10', url: '#' },
      { id: 'doc-3-2', name: 'Proposal Model AI.docx', type: 'Word', uploadDate: '2024-03-20', url: '#' },
    ],
    notes: 'Pengembangan perangkat lunak kontrol penerbangan jauh di belakang jadwal karena kompleksitas yang tidak terduga. Ini memiliki efek berantai pada semua tugas berikutnya, membahayakan tanggal penyelesaian proyek.',
    team: [users[2], users[0], users[3], users[1]],
    subProjects: [],
  },
  {
    id: 'proj-4',
    name: 'Perombakan Pengalaman Penumpang',
    description: 'Desain ulang lengkap pengalaman penumpang dalam penerbangan, dari tempat duduk hingga hiburan.',
    startDate: '2024-01-10',
    endDate: '2024-09-20',
    status: 'Selesai',
    tasks: [
      { id: 'task-4-1', title: 'Survei dan Analisis Umpan Balik Pelanggan', assigneeId: 'user-4', dueDate: '2024-02-28', status: 'Selesai' },
      { id: 'task-4-2', title: 'Desain & Prototyping Kursi Baru', assigneeId: 'user-3', dueDate: '2024-05-31', status: 'Selesai' },
      { id: 'task-4-3', title: 'Peningkatan Sistem Hiburan Dalam Penerbangan', assigneeId: 'user-1', dueDate: '2024-08-15', status: 'Selesai' },
      { id: 'task-4-4', title: 'Kampanye Pemasaran Peluncuran', assigneeId: 'user-2', dueDate: '2024-09-15', status: 'Selesai' },
    ],
    documents: [
        { id: 'doc-4-1', name: 'Desain Akhir.pdf', type: 'PDF', uploadDate: '2024-06-01', url: '#' },
    ],
    notes: 'Proyek selesai dengan sukses di semua lini. Umpan balik pelanggan tentang pengalaman baru sangat positif. Kampanye pemasaran menghasilkan gebrakan yang signifikan.',
    team: [users[3], users[2], users[0], users[1]],
    subProjects: [],
  },
];

export const findProjectById = (id: string) => projects.find(p => p.id === id);
export const findUserById = (id: string) => users.find(u => u.id === id);
