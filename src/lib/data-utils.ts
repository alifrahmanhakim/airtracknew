
import type { User } from './types';
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
