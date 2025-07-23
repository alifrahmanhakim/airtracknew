

'use server';

import { z } from 'zod';
import { db } from '../firebase';
import { collection, getDocs, query, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, arrayUnion, writeBatch, getDoc } from 'firebase/firestore';
import type { Document as ProjectDocument, Project, SubProject, Task, ChecklistItem, User } from '../types';
import { summarizeProjectStatus, type SummarizeProjectStatusInput } from '@/ai/flows/summarize-project-status';
import { generateChecklist, type GenerateChecklistInput } from '@/ai/flows/generate-checklist';
import { createNotification } from './notifications';


export async function addRulemakingProject(projectData: unknown) {
    const projectSchema = z.object({
        name: z.string().min(1, 'Project name is required.'),
        description: z.string().min(1, 'Description is required.'),
        ownerId: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        status: z.enum(['On Track', 'Off Track', 'At Risk', 'Completed']),
        team: z.array(z.string()).min(1, 'At least one team member must be selected.'),
        annex: z.string().min(1, 'Annex is required.'),
        casr: z.string().min(1, 'CASR is required.'),
        casrRevision: z.string().optional(),
        tags: z.array(z.string()).optional(),
    });

    const parsed = projectSchema.safeParse(projectData);

    if (!parsed.success) {
        return {
            success: false,
            error: parsed.error.errors.map(e => e.message).join(', '),
        };
    }

    // Fetch full user objects for the team
    const teamUsers: User[] = [];
    if (parsed.data.team.length > 0) {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        parsed.data.team.forEach(userId => {
            const user = allUsers.find(u => u.id === userId);
            if (user) {
                teamUsers.push(user);
            }
        });
    }

    try {
        const docRef = await addDoc(collection(db, 'rulemakingProjects'), {
            ...parsed.data,
            team: teamUsers, // Store full user objects
            projectType: 'Rulemaking',
            tasks: [],
            documents: [],
            subProjects: [],
            notes: '',
            checklist: [],
            createdAt: serverTimestamp(),
        });
        
        // Create notifications for team members
        for (const user of teamUsers) {
            await createNotification({
                userId: user.id,
                title: 'Added to New Project',
                description: `You have been added to the rulemaking project: "${parsed.data.name}".`,
                href: `/projects/${docRef.id}?type=rulemaking`,
            });
        }
        
        return { success: true, id: docRef.id };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}


export async function addTimKerjaProject(projectData: Omit<Project, 'id' | 'projectType' | 'tasks' | 'documents' | 'subProjects' | 'notes' | 'checklist' | 'team'> & { team: string[] }) {
    try {
        // Fetch full user objects for the team
        const teamUsers: User[] = [];
        if (projectData.team.length > 0) {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            projectData.team.forEach(userId => {
                const user = allUsers.find(u => u.id === userId);
                if (user) {
                    teamUsers.push(user);
                }
            });
        }
        
        const docRef = await addDoc(collection(db, 'timKerjaProjects'), {
            ...projectData,
            team: teamUsers, // Store full user objects
            projectType: 'Tim Kerja',
            tasks: [],
            documents: [],
            subProjects: [],
            notes: '',
            checklist: [],
            createdAt: serverTimestamp(),
        });
        
        // Create notifications for team members
        for (const user of teamUsers) {
            await createNotification({
                userId: user.id,
                title: 'Added to New Project',
                description: `You have been added to the Tim Kerja project: "${projectData.name}".`,
                href: `/projects/${docRef.id}?type=timkerja`,
            });
        }

        return { success: true, id: docRef.id };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function deleteAllTimKerjaProjects() {
    try {
        const q = query(collection(db, 'timKerjaProjects'));
        const querySnapshot = await getDocs(q);
        const batch = writeBatch(db);
        let count = 0;
        querySnapshot.forEach((doc) => {
            batch.delete(doc.ref);
            count++;
        });
        await batch.commit();
        return { success: true, count };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function updateProject(projectId: string, projectType: Project['projectType'], projectData: Partial<Omit<Project, 'id'>>) {
    const collectionName = projectType === 'Rulemaking' ? 'rulemakingProjects' : 'timKerjaProjects';
    const projectRef = doc(db, collectionName, projectId);
    
    try {
        // Get the current project state to compare teams
        const currentProjectSnap = await getDoc(projectRef);
        if (!currentProjectSnap.exists()) {
            return { success: false, error: "Project not found." };
        }
        const currentProjectData = currentProjectSnap.data() as Project;
        const currentTeamIds = new Set(currentProjectData.team.map(m => m.id));

        // Update the document
        await updateDoc(projectRef, projectData);
        
        const projectLink = `/projects/${projectId}?type=${projectType.toLowerCase().replace(' ', '')}`;
        const projectName = projectData.name || currentProjectData.name;

        // Send notifications based on team changes
        if (projectData.team) {
            const newTeamIds = new Set(projectData.team.map(m => m.id));
            
            // Notify newly added members
            const addedMembers = projectData.team.filter(member => !currentTeamIds.has(member.id));
            for (const newMember of addedMembers) {
                 await createNotification({
                    userId: newMember.id,
                    title: 'Added to Project',
                    description: `You have been added to the project: "${projectName}".`,
                    href: projectLink,
                });
            }

            // Notify removed members
            const removedMemberIds = [...currentTeamIds].filter(id => !newTeamIds.has(id));
             for (const removedId of removedMemberIds) {
                 await createNotification({
                    userId: removedId,
                    title: 'Removed from Project',
                    description: `You have been removed from the project: "${projectName}".`,
                    href: projectLink,
                });
            }
        }
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function deleteProject(projectId: string, projectType: Project['projectType']) {
  const collectionName = projectType === 'Rulemaking' ? 'rulemakingProjects' : 'timKerjaProjects';
  try {
    const projectRef = doc(db, collectionName, projectId);
    await deleteDoc(projectRef);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
}

export async function addDocument(projectId: string, documentData: { name: string; url: string; }, projectType: Project['projectType']) {
    const collectionName = projectType === 'Rulemaking' ? 'rulemakingProjects' : 'timKerjaProjects';
    const projectRef = doc(db, collectionName, projectId);
    
    const getFileExtension = (url: string) => {
      try {
        const pathname = new URL(url).pathname;
        const extension = pathname.split('.').pop()?.toLowerCase();
        return extension;
      } catch (e) {
        return 'other';
      }
    };
  
    const determineFileType = (url: string): ProjectDocument['type'] => {
      const extension = getFileExtension(url);
      if (!extension) return 'Other';
  
      if (extension === 'pdf') return 'PDF';
      if (['doc', 'docx'].includes(extension)) return 'Word';
      if (['xls', 'xlsx', 'csv'].includes(extension)) return 'Excel';
      if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(extension)) return 'Image';
      
      return 'Other';
    }
  
    const newDocument: ProjectDocument = {
      id: `doc-${Date.now()}`,
      name: documentData.name,
      url: documentData.url,
      type: determineFileType(documentData.url),
      uploadDate: new Date().toISOString(),
    };
  
    try {
      await updateDoc(projectRef, {
        documents: arrayUnion(newDocument)
      });
      return { success: true, data: newDocument };
    } catch (error) {
      return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to add document link.' 
      };
    }
}

export async function deleteDocument(projectId: string, documentId: string, projectType: Project['projectType']) {
    const collectionName = projectType === 'Rulemaking' ? 'rulemakingProjects' : 'timKerjaProjects';
    const projectRef = doc(db, collectionName, projectId);
    try {
        const projectSnap = await getDoc(projectRef);
        if (projectSnap.exists()) {
            const projectData = projectSnap.data() as Project;
            const updatedDocuments = projectData.documents.filter(doc => doc.id !== documentId);
            await updateDoc(projectRef, { documents: updatedDocuments });
            return { success: true };
        }
        return { success: false, error: "Project not found." };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to delete document.' };
    }
}

export async function addSubProject(projectId: string, subProjectData: SubProject, projectType: Project['projectType']) {
    const collectionName = projectType === 'Rulemaking' ? 'rulemakingProjects' : 'timKerjaProjects';
    const projectRef = doc(db, collectionName, projectId);

    try {
      await updateDoc(projectRef, {
        subProjects: arrayUnion(subProjectData)
      });
      return { success: true };
    } catch (error) {
      return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to add sub-project.' 
      };
    }
}


export async function updateSubProject(projectId: string, subProject: SubProject, projectType: Project['projectType']) {
    const collectionName = projectType === 'Rulemaking' ? 'rulemakingProjects' : 'timKerjaProjects';
    const projectRef = doc(db, collectionName, projectId);
    try {
        const projectSnap = await getDoc(projectRef);
        if (projectSnap.exists()) {
            const projectData = projectSnap.data() as Project;
            const updatedSubProjects = projectData.subProjects.map(sp => sp.id === subProject.id ? subProject : sp);
            await updateDoc(projectRef, { subProjects: updatedSubProjects });
            return { success: true };
        }
        return { success: false, error: 'Project not found' };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to update sub-project.' };
    }
}

// Recursive function to find and delete a task
function findAndDeleteTask(tasks: Task[], taskId: string): Task[] {
  return tasks.reduce((acc, task) => {
    if (task.id === taskId) {
      return acc; // Skip adding the task to be deleted
    }
    if (task.subTasks && task.subTasks.length > 0) {
      task.subTasks = findAndDeleteTask(task.subTasks, taskId);
    }
    acc.push(task);
    return acc;
  }, [] as Task[]);
}

// Recursive function to add a subtask
function findAndAddSubTask(tasks: Task[], parentId: string, subTask: Task): Task[] {
    return tasks.map(task => {
        if (task.id === parentId) {
            const newSubTasks = [...(task.subTasks || []), subTask];
            return { ...task, subTasks: newSubTasks };
        }
        if (task.subTasks && task.subTasks.length > 0) {
            return { ...task, subTasks: findAndAddSubTask(task.subTasks, parentId, subTask) };
        }
        return task;
    });
}

export async function addTask(projectId: string, task: Task, projectType: Project['projectType'], parentId: string | null = null) {
    const collectionName = projectType === 'Rulemaking' ? 'rulemakingProjects' : 'timKerjaProjects';
    const projectRef = doc(db, collectionName, projectId);

    try {
        const projectSnap = await getDoc(projectRef);
        if (!projectSnap.exists()) {
            return { success: false, error: 'Project not found' };
        }
        
        const projectData = projectSnap.data() as Project;
        let updatedTasks: Task[];

        if (parentId) {
            // Adding a subtask
            updatedTasks = findAndAddSubTask(projectData.tasks || [], parentId, task);
        } else {
            // Adding a top-level task
            updatedTasks = [...(projectData.tasks || []), task];
        }

        await updateDoc(projectRef, { tasks: updatedTasks });

        // Create notifications for assignees
        const projectLink = `/projects/${projectId}?type=${projectType.toLowerCase().replace(' ', '')}`;
        for (const userId of task.assigneeIds) {
            await createNotification({
                userId: userId,
                title: 'New Task Assigned',
                description: `You have been assigned a new task "${task.title}" in project "${projectData.name}".`,
                href: projectLink,
            });
        }

        return { success: true, tasks: updatedTasks };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to add task.' };
    }
}

// --- REFACTORED/FIXED `updateTask` function ---

// Recursive helper to find a task by ID in a nested structure
const findTaskById = (tasks: Task[], taskId: string): Task | null => {
    for (const task of tasks) {
        if (task.id === taskId) {
            return task;
        }
        if (task.subTasks) {
            const found = findTaskById(task.subTasks, taskId);
            if (found) {
                return found;
            }
        }
    }
    return null;
};

// Recursive helper to replace a task in a nested structure
const replaceTaskById = (tasks: Task[], updatedTask: Task): Task[] => {
    return tasks.map(task => {
        if (task.id === updatedTask.id) {
            return { ...updatedTask, subTasks: updatedTask.subTasks || task.subTasks || [] };
        }
        if (task.subTasks) {
            return { ...task, subTasks: replaceTaskById(task.subTasks, updatedTask) };
        }
        return task;
    });
};


export async function updateTask(projectId: string, updatedTaskData: Task, projectType: Project['projectType']) {
    const collectionName = projectType === 'Rulemaking' ? 'rulemakingProjects' : 'timKerjaProjects';
    const projectRef = doc(db, collectionName, projectId);
    
    try {
        const projectSnap = await getDoc(projectRef);
        if (!projectSnap.exists()) {
            return { success: false, error: 'Project not found' };
        }
        
        const projectData = projectSnap.data() as Project;
        const currentTasks = projectData.tasks || [];

        // 1. Find the original task from the current data in DB
        const oldTask = findTaskById(currentTasks, updatedTaskData.id);

        if (!oldTask) {
             return { success: false, error: 'Original task not found for update. This could happen if the task was deleted by another user.' };
        }

        // 2. Create the new task structure
        const updatedTasks = replaceTaskById(currentTasks, updatedTaskData);
        
        // 3. Update the document in Firestore
        await updateDoc(projectRef, { tasks: updatedTasks });

        // 4. Handle notifications by comparing old and new assignee sets
        const projectLink = `/projects/${projectId}?type=${projectType.toLowerCase().replace(' ', '')}`;
        
        const oldAssigneeIds = new Set(oldTask.assigneeIds || []);
        const newAssigneeIds = new Set(updatedTaskData.assigneeIds || []);

        // Notify added assignees
        const addedAssignees = updatedTaskData.assigneeIds.filter(id => !oldAssigneeIds.has(id));
        for (const userId of addedAssignees) {
            await createNotification({
                userId: userId,
                title: 'New Task Assigned',
                description: `You have been assigned to task "${updatedTaskData.title}" in project "${projectData.name}".`,
                href: projectLink,
            });
        }

        // Notify removed assignees
        const removedAssignees = [...oldAssigneeIds].filter(id => !newAssigneeIds.has(id));
        for (const userId of removedAssignees) {
            await createNotification({
                userId: userId,
                title: 'Unassigned from Task',
                description: `You have been unassigned from task "${updatedTaskData.title}" in project "${projectData.name}".`,
                href: projectLink,
            });
        }
        
        // Notify existing assignees of the update (if there were other changes)
        const existingAssignees = updatedTaskData.assigneeIds.filter(id => oldAssigneeIds.has(id));
        for (const userId of existingAssignees) {
            await createNotification({
                userId: userId,
                title: 'Task Updated',
                description: `The task "${updatedTaskData.title}" in project "${projectData.name}" has been updated.`,
                href: projectLink,
            });
        }

        return { success: true, tasks: updatedTasks };
    } catch (error) {
        console.error("Error in updateTask:", error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to update task.' };
    }
}


export async function deleteTask(projectId: string, taskId: string, projectType: Project['projectType']) {
    const collectionName = projectType === 'Rulemaking' ? 'rulemakingProjects' : 'timKerjaProjects';
    const projectRef = doc(db, collectionName, projectId);
    try {
        const projectSnap = await getDoc(projectRef);
        if (projectSnap.exists()) {
            const projectData = projectSnap.data() as Project;
            const updatedTasks = findAndDeleteTask(projectData.tasks, taskId);
            await updateDoc(projectRef, { tasks: updatedTasks });
            return { success: true, tasks: updatedTasks };
        }
        return { success: false, error: 'Project not found' };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to delete task.' };
    }
}

export async function updateProjectChecklist(projectId: string, checklist: ChecklistItem[], projectType: Project['projectType']) {
    const collectionName = projectType === 'Rulemaking' ? 'rulemakingProjects' : 'timKerjaProjects';
    try {
        const projectRef = doc(db, collectionName, projectId);
        await updateDoc(projectRef, { checklist });
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to update checklist.' };
    }
}

export async function getAiSummary(input: SummarizeProjectStatusInput) {
  try {
    const summary = await summarizeProjectStatus(input);
    return { success: true, data: summary };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'An unknown AI error occurred' };
  }
}

export async function generateAiChecklist(input: GenerateChecklistInput) {
  try {
    const checklist = await generateChecklist(input);
    return checklist;
  } catch (error) {
    console.error("AI Checklist generation failed:", error);
    return null;
  }
}


    
