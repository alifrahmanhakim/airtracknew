
import type { User, Task } from './types';
import { users as staticUsers } from './data';

/**
 * Finds a user by their ID from a provided list of users.
 * @param id The ID of the user to find.
 * @param users The list of users to search through. Defaults to the static user list.
 * @returns The user object if found, otherwise undefined.
 */
export const findUserById = (id: string, users: User[] = staticUsers) => {
  return users.find(u => u.id === id);
};

/**
 * Recursively counts all tasks and subtasks to get a total and completed count.
 * @param tasks The array of tasks to count.
 * @returns An object with the total number of tasks, the number of completed tasks, and a flag if any task is critical.
 */
export const countAllTasks = (tasks: Task[]): { total: number; completed: number; hasCritical: boolean } => {
    let total = 0;
    let completed = 0;
    let hasCritical = false;

    tasks.forEach(task => {
        total++;
        if (task.status === 'Done') {
            completed++;
        }
        if (task.criticalIssue) {
          hasCritical = true;
        }
        if (task.subTasks && task.subTasks.length > 0) {
            const subCounts = countAllTasks(task.subTasks);
            total += subCounts.total;
            completed += subCounts.completed;
            if (subCounts.hasCritical) {
              hasCritical = true;
            }
        }
    });

    return { total, completed, hasCritical };
};
