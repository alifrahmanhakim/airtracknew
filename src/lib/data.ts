
import type { ComboboxOption } from '@/components/ui/combobox';

// This file should ONLY contain static data arrays.
// No functions, no complex imports.

export const users = [
    { id: 'admin-00', name: 'Admin User', email: 'admin@admin2023.com', avatarUrl: 'https://placehold.co/100x100.png', role: 'Sub-Directorate Head', isApproved: true },
    { id: 'admin-01', name: 'Hakim Alif Rahman', email: 'hakimalifrahman@gmail.com', avatarUrl: 'https://placehold.co/100x100.png', role: 'Sub-Directorate Head', isApproved: true },
    { id: '8aOs7OSaL8XFXLq7DxzbnuXN5eC3', name: 'Chewy Sihusky', email: 'chewysihusky@gmail.com', avatarUrl: 'https://placehold.co/100x100.png', role: 'Sub-Directorate Head' },
    { id: 'rizkywirapratama434', name: 'Rizky Wirapratama', email: 'rizkywirapratama434@gmail.com', avatarUrl: 'https://placehold.co/100x100.png', role: 'Sub-Directorate Head', isApproved: true },
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

export const indonesianAircraftTypes: ComboboxOption[] = [
    { value: 'Airbus A320', label: 'Airbus A320' },
    { value: 'Airbus A321', label: 'Airbus A321' },
    { value: 'Airbus A330', label: 'Airbus A330' },
    { value: 'ATR 72', label: 'ATR 72' },
    { value: 'Bell 206', label: 'Bell 206' },
    { value: 'Bell 412', label: 'Bell 412' },
    { value: 'Bell 505', label: 'Bell 505' },
    { value: 'Boeing 737', label: 'Boeing 737' },
    { value: 'Boeing 737-300F', label: 'Boeing 737-300F' },
    { value: 'Boeing 737-800', label: 'Boeing 737-800' },
    { value: 'Boeing 737-900ER', label: 'Boeing 737-900ER' },
    { value: 'Boeing 777', label: 'Boeing 777' },
    { value: 'Bombardier CRJ1000', label: 'Bombardier CRJ1000' },
    { value: 'Cessna C172', label: 'Cessna C172' },
    { value: 'Cessna C208B - Grand Caravan', label: 'Cessna C208B - Grand Caravan' },
    { value: 'DHC-6 Twin Otter', label: 'DHC-6 Twin Otter' },
    { value: 'Eurocopter AS350', label: 'Eurocopter AS350' },
    { value: 'Eurocopter EC135P2', label: 'Eurocopter EC135P2' },
    { value: 'PAC 750XL', label: 'PAC 750XL' },
    { value: 'Pilatus PC-6 Porter', label: 'Pilatus PC-6 Porter' },
    { value: 'Robinson R44', label: 'Robinson R44' },
    { value: 'Robinson R66', label: 'Robinson R66' },
    { value: 'Thrush S2R-T34', label: 'Thrush S2R-T34' },
];
