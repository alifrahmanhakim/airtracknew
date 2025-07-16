

import type { User, Project } from './types';
import type { ComboboxOption } from '@/components/ui/combobox';

// Updated user data to be consistent with seed.js
export const users: User[] = [
    { id: 'admin-00', name: 'Admin User', email: 'admin@admin2023.com', avatarUrl: 'https://placehold.co/100x100.png', role: 'Sub-Directorate Head', isApproved: true },
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

// This data can be used to seed your Firestore database.
// The app will gradually be updated to read from Firestore instead of this static file.
export const projects: Project[] = [
  {
    id: 'proj-1',
    ownerId: 'user-1',
    name: 'Next-Gen Air Traffic Control System',
    description: 'Development and deployment of a new generation air traffic control system to enhance safety and efficiency.',
    startDate: '2023-01-15',
    endDate: '2024-12-31',
    status: 'On Track',
    projectType: 'Tim Kerja',
    tags: ['Core', 'Infrastructure'],
    tasks: [
      { id: 'task-1-1', title: 'System Architecture Design', assigneeIds: ['user-1'], startDate: '2023-02-01', dueDate: '2023-03-31', status: 'Done' },
      { id: 'task-1-2', title: 'Software Development - Phase 1', assigneeIds: ['user-2'], startDate: '2023-04-01', dueDate: '2023-08-31', status: 'Done' },
      { id: 'task-1-3', title: 'Hardware Integration', assigneeIds: ['user-3'], startDate: '2023-09-01', dueDate: '2024-02-28', status: 'In Progress' },
      { id: 'task-1-4', title: 'User Interface Mockups', assigneeIds: ['user-4'], startDate: '2024-03-01', dueDate: '2024-05-15', status: 'To Do' },
    ],
    documents: [],
    notes: 'Software development phase 1 was completed ahead of schedule. Hardware integration is the current focus and is proceeding as planned. Team morale is high.',
    team: [users[0], users[1], users[2], users[3]],
    subProjects: [
        { id: 'sub-1-1', name: 'UI/UX Redesign', description: 'Redesigning the user interface for the new system', status: 'On Track' },
        { id: 'sub-1-2', name: 'Backend Refactor', description: 'Refactoring the backend for performance improvements', status: 'Completed' },
    ],
  },
  {
    id: 'proj-2',
    ownerId: 'user-2',
    name: 'Certification Procedures for Products and Parts',
    description: 'Research and implementation of sustainable aviation fuels (SAFs) across the fleet to reduce carbon emissions.',
    startDate: '2023-06-01',
    endDate: '2025-05-30',
    status: 'At Risk',
    projectType: 'Rulemaking',
    annex: '8',
    casr: '21',
    tags: ['High Priority', 'Technical'],
    tasks: [
      { id: 'task-2-1', title: 'Supplier Identification & Vetting', assigneeIds: ['user-2'], startDate: '2023-07-01', dueDate: '2023-09-30', status: 'Done' },
      { id: 'task-2-2', title: 'Engine Compatibility Testing', assigneeIds: ['user-1'], startDate: '2023-10-01', dueDate: '2024-04-30', status: 'In Progress' },
      { id: 'task-2-3', title: 'Regulatory Approval Submission', assigneeIds: ['user-4'], startDate: '2024-05-01', dueDate: '2024-08-15', status: 'Blocked' },
      { id: 'task-2-4', title: 'Logistics and Supply Chain Setup', assigneeIds: ['user-3'], startDate: '2024-08-16', dueDate: '2025-01-20', status: 'To Do' },
    ],
    documents: [],
    notes: 'Engine compatibility tests are showing unexpected wear, causing delays. Regulatory submission is blocked pending results from these tests. This puts the project timeline at risk.',
    team: [users[1], users[0], users[4], users[2]],
    subProjects: [],
  },
  {
    id: 'proj-3',
    ownerId: 'user-1',
    name: 'Automated Drone Inspection Program',
    description: 'Implementing an automated aircraft inspection program using a fleet of autonomous drones.',
    startDate: '2024-02-01',
    endDate: '2024-11-30',
    status: 'Off Track',
    projectType: 'Tim Kerja',
    tags: ['Innovation', 'Drones'],
    tasks: [
      { id: 'task-3-1', title: 'Drone Fleet Procurement', assigneeIds: ['user-3'], startDate: '2024-02-15', dueDate: '2024-03-15', status: 'Done' },
      { id: 'task-3-2', title: 'Flight Control Software Development', assigneeIds: ['user-1'], startDate: '2024-03-16', dueDate: '2024-07-31', status: 'In Progress' },
      { id: 'task-3-3', title: 'Image Recognition AI Training', assigneeIds: ['user-4'], startDate: '2024-08-01', dueDate: '2024-09-30', status: 'To Do' },
      { id: 'task-3-4', title: 'Field Trials', assigneeIds: ['user-2'], startDate: '2024-10-01', dueDate: '2024-11-15', status: 'To Do' },
    ],
    documents: [],
    notes: 'Flight control software development is significantly behind schedule due to unforeseen complexities. This has a knock-on effect on all subsequent tasks, jeopardizing the project completion date.',
    team: [users[2], users[0], users[3], users[1]],
    subProjects: [],
  },
  {
    id: 'proj-4',
    ownerId: 'user-4',
    name: 'General Operating and Flight Rules',
    description: 'A complete redesign of the in-flight passenger experience, from seating to entertainment.',
    startDate: '2024-01-10',
    endDate: '2024-09-20',
    status: 'Completed',
    projectType: 'Rulemaking',
    annex: '6',
    casr: '91',
    tags: ['Operations', 'Finalized'],
    tasks: [
      { id: 'task-4-1', title: 'Customer Feedback Surveys & Analysis', assigneeIds: ['user-4'], startDate: '2024-01-20', dueDate: '2024-02-28', status: 'Done' },
      { id: 'task-4-2', title: 'New Seat Design & Prototyping', assigneeIds: ['user-3'], startDate: '2024-03-01', dueDate: '2024-05-31', status: 'Done' },
      { id: 'task-4-3', title: 'In-Flight Entertainment System Upgrade', assigneeIds: ['user-1'], startDate: '2024-06-01', dueDate: '2024-08-15', status: 'Done' },
      { id: 'task-4-4', title: 'Launch Marketing Campaign', assigneeIds: ['user-2'], startDate: '2024-08-16', dueDate: '2024-09-15', status: 'Done' },
    ],
    documents: [],
    notes: 'Project completed successfully across all deliverables. Customer feedback on the new experience has been overwhelmingly positive. Marketing campaign generated significant buzz.',
    team: [users[3], users[2], users[0], users[1]],
    subProjects: [],
  },
];


export const getProjectsForUser = (userId: string, allProjects: Project[], allUsers: User[]) => {
    // For now, return all projects for all users.
    return allProjects;
}

export const findProjectById = (id: string, allProjects: Project[]) => allProjects.find(p => p.id === id);
export const findUserById = (id: string, allUsers: User[] = users) => allUsers.find(u => u.id === id);
