
import type { ComboboxOption } from '@/components/ui/combobox';

// This file should ONLY contain static data arrays.
// No functions, no complex imports.

export const users = [
    { id: 'admin-00', name: 'Admin User', email: 'admin@admin2023.com', avatarUrl: 'https://placehold.co/100x100.png', role: 'Sub-Directorate Head', isApproved: true },
    { id: 'admin-01', name: 'Hakim Alif Rahman', email: 'hakimalifrahman@gmail.com', avatarUrl: 'https://placehold.co/100x100.png', role: 'Sub-Directorate Head', isApproved: true },
    { id: '8aOs7OSaL8XFXLq7DxzbnuXN5eC3', name: 'Chewy Sihusky', email: 'chewysihusky@gmail.com', avatarUrl: 'https://placehold.co/100x100.png', role: 'Sub-Directorate Head' },
    { id: 'user-1', name: 'Alex Johnson', email: 'alex.johnson@example.com', avatarUrl: 'https://placehold.co/100x100.png', role: 'Team Lead' },
    { id: 'user-2', name: 'Maria Garcia', email: 'maria.garcia@example.com', avatarUrl: 'https://placehold.co/100x100.png', role: 'PIC' },
    { id: 'user-3', name: 'James Smith', email: 'james.smith@example.com', avatarUrl: 'https://placehold.co/100x100.png', role: 'PIC Assistant' },
    { id: 'user-4', name: 'Patricia Williams', email: 'patricia.williams@example.com', avatarUrl: 'https://placehold.co/100x100.png', role: 'Functional' },
];

export const rulemakingTaskOptions: ComboboxOption[] = [
    { value: 'Gap Analysis', label: 'Gap Analysis' },
    { value: 'Penyusunan Draft', label: 'Penyusunan Draft' },
    { value: 'Diskusi dengan SME', label: 'Diskusi dengan SME' },
    { value: 'Diskusi dengan Stakeholder', label: 'Diskusi dengan Stakeholder' },
    { value: 'Penyusunan KP/PM', label: 'Penyusunan KP/PM' },
    { value: 'Persetujuan Manajemen', label: 'Persetujuan Manajemen' },
    { value: 'Evaluasi Bagkum', label: 'Evaluasi Bagkum' },
    { value: 'Revisi oleh Direktorat hasil koreksi Bagkum record keeping dan sinkronisasi', label: 'Revisi oleh Direktorat hasil koreksi Bagkum record keeping dan sinkronisasi' },
    { value: 'Finalisasi oleh Bagkum', label: 'Finalisasi oleh Bagkum' },
    { value: 'Evaluasi oleh Biro Hukum', label: 'Evaluasi oleh Biro Hukum' },
    { value: 'Evaluasi oleh Kumham', label: 'Evaluasi oleh Kumham' },
    { value: 'Setneg dan Pengesahan', label: 'Setneg dan Pengesahan' },
    { value: 'Sosialisasi oleh Direktorat', label: 'Sosialisasi oleh Direktorat' },
];

export const timKerjaTaskOptions: ComboboxOption[] = [
    { value: 'Initial Planning', label: 'Initial Planning' },
    { value: 'Requirement Gathering', label: 'Requirement Gathering' },
    { value: 'Design Phase', label: 'Design Phase' },
    { value: 'Development Sprint 1', label: 'Development Sprint 1' },
    { value: 'Development Sprint 2', label: 'Development Sprint 2' },
    { value: 'Testing & QA', label: 'Testing & QA' },
    { value: 'User Acceptance Testing (UAT)', label: 'User Acceptance Testing (UAT)' },
    { value: 'Deployment', label: 'Deployment' },
    { value: 'Post-launch Support', label: 'Post-launch Support' },
];
