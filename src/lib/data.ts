
import type { User, Project } from './types';

export const users: User[] = [
  { id: 'user-1', name: 'Alex Johnson', avatarUrl: 'https://placehold.co/100x100.png', role: 'Team Lead' },
  { id: 'user-2', name: 'Maria Garcia', avatarUrl: 'https://placehold.co/100x100.png', role: 'PIC' },
  { id: 'user-3', name: 'James Smith', avatarUrl: 'https://placehold.co/100x100.png', role: 'PIC Assistant' },
  { id: 'user-4', name: 'Patricia Williams', avatarUrl: 'https://placehold.co/100x100.png', role: 'Functional' },
  { id: 'user-5', name: 'Robert Brown', avatarUrl: 'https://placehold.co/100x100.png', role: 'Sub-Directorate Head' },
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
    tasks: [
      { id: 'task-1-1', title: 'System Architecture Design', assigneeId: 'user-1', dueDate: '2023-03-31', status: 'Done' },
      { id: 'task-1-2', title: 'Software Development - Phase 1', assigneeId: 'user-2', dueDate: '2023-08-31', status: 'Done' },
      { id: 'task-1-3', title: 'Hardware Integration', assigneeId: 'user-3', dueDate: '2024-02-28', status: 'In Progress' },
      { id: 'task-1-4', title: 'User Interface Mockups', assigneeId: 'user-4', dueDate: '2024-05-15', status: 'To Do' },
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
    name: 'Sustainable Aviation Fuel Initiative',
    description: 'Research and implementation of sustainable aviation fuels (SAFs) across the fleet to reduce carbon emissions.',
    startDate: '2023-06-01',
    endDate: '2025-05-30',
    status: 'At Risk',
    tasks: [
      { id: 'task-2-1', title: 'Supplier Identification & Vetting', assigneeId: 'user-2', dueDate: '2023-09-30', status: 'Done' },
      { id: 'task-2-2', title: 'Engine Compatibility Testing', assigneeId: 'user-1', dueDate: '2024-04-30', status: 'In Progress' },
      { id: 'task-2-3', title: 'Regulatory Approval Submission', assigneeId: 'user-5', dueDate: '2024-08-15', status: 'Blocked' },
      { id: 'task-2-4', title: 'Logistics and Supply Chain Setup', assigneeId: 'user-3', dueDate: '2025-01-20', status: 'To Do' },
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
    tasks: [
      { id: 'task-3-1', title: 'Drone Fleet Procurement', assigneeId: 'user-3', dueDate: '2024-03-15', status: 'Done' },
      { id: 'task-3-2', title: 'Flight Control Software Development', assigneeId: 'user-1', dueDate: '2024-07-31', status: 'In Progress' },
      { id: 'task-3-3', title: 'Image Recognition AI Training', assigneeId: 'user-4', dueDate: '2024-09-30', status: 'To Do' },
      { id: 'task-3-4', title: 'Field Trials', assigneeId: 'user-2', dueDate: '2024-11-15', status: 'To Do' },
    ],
    documents: [],
    notes: 'Flight control software development is significantly behind schedule due to unforeseen complexities. This has a knock-on effect on all subsequent tasks, jeopardizing the project completion date.',
    team: [users[2], users[0], users[3], users[1]],
    subProjects: [],
  },
  {
    id: 'proj-4',
    ownerId: 'user-5',
    name: 'Passenger Experience Overhaul',
    description: 'A complete redesign of the in-flight passenger experience, from seating to entertainment.',
    startDate: '2024-01-10',
    endDate: '2024-09-20',
    status: 'Completed',
    tasks: [
      { id: 'task-4-1', title: 'Customer Feedback Surveys & Analysis', assigneeId: 'user-4', dueDate: '2024-02-28', status: 'Done' },
      { id: 'task-4-2', title: 'New Seat Design & Prototyping', assigneeId: 'user-3', dueDate: '2024-05-31', status: 'Done' },
      { id: 'task-4-3', title: 'In-Flight Entertainment System Upgrade', assigneeId: 'user-1', dueDate: '2024-08-15', status: 'Done' },
      { id: 'task-4-4', title: 'Launch Marketing Campaign', assigneeId: 'user-2', dueDate: '2024-09-15', status: 'Done' },
    ],
    documents: [],
    notes: 'Project completed successfully across all deliverables. Customer feedback on the new experience has been overwhelmingly positive. Marketing campaign generated significant buzz.',
    team: [users[3], users[2], users[0], users[1]],
    subProjects: [],
  },
];

export const getProjectsForUser = (userId: string, allProjects: Project[]) => {
    const user = findUserById(userId);
    if (user?.role === 'Sub-Directorate Head') {
        return allProjects; // Admins see all projects
    }
    // Ensure team array exists before checking
    return allProjects.filter(p => p.ownerId === userId || (p.team && p.team.some(member => member.id === userId)));
}

export const findProjectById = (id: string) => projects.find(p => p.id === id);
export const findUserById = (id: string) => users.find(u => u.id === id);
