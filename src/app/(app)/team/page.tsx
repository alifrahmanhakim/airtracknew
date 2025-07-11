
'use client';

import * as React from 'react';
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { User } from "@/lib/types";
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2 } from 'lucide-react';
import { findUserById } from '@/lib/data';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { deleteUser } from '@/lib/actions';
import { AssignRoleDialog } from '@/components/assign-role-dialog';

export default function TeamPage() {
  const [users, setUsers] = React.useState<User[]>([]);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [userToDelete, setUserToDelete] = React.useState<User | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const loggedInUserId = localStorage.getItem('loggedInUserId');
        if (loggedInUserId) {
          const user = findUserById(loggedInUserId); // Still using static for current user check
          setCurrentUser(user || null);
        }

        const querySnapshot = await getDocs(collection(db, "users"));
        const usersFromDb: User[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setUsers(usersFromDb);

      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast({
            variant: 'destructive',
            title: 'Error fetching users',
            description: 'Could not load team members from the database.'
        });
      }
      setIsLoading(false);
    }
    fetchData();
  }, [toast]);

  const handleUserUpdate = (updatedUser: User) => {
    setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
  };
  
  const handleDeleteClick = (user: User) => {
    if (user.id === currentUser?.id) {
        toast({ variant: 'destructive', title: 'Error', description: "You cannot delete yourself." });
        return;
    }
    setUserToDelete(user);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    const result = await deleteUser(userToDelete.id);
    if (result.success) {
        setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
        toast({ title: "User Deleted", description: `${userToDelete.name} has been removed.` });
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setUserToDelete(null);
  };


  if (isLoading) {
    return (
        <div className="p-4 md:p-8">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-5 w-72" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                             <div key={i} className="flex items-center space-x-4">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
  }
  
  const isAdmin = currentUser?.role === 'Sub-Directorate Head';

  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            An overview of all team members and their roles.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map(user => (
                        <TableRow key={user.id}>
                            <TableCell>
                                <div className="flex items-center gap-4">
                                    <Avatar className="hidden h-9 w-9 sm:flex">
                                        <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="person portrait" />
                                        <AvatarFallback>{user.name ? user.name.charAt(0) : '?'}</AvatarFallback>
                                    </Avatar>
                                    <div className="grid gap-1">
                                        <p className="text-sm font-medium leading-none">{user.name}</p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>{user.role}</TableCell>
                            {isAdmin && (
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <AssignRoleDialog user={user} onUserUpdate={handleUserUpdate} />
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteClick(user)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
      
       <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account for <span className="font-semibold">{userToDelete?.name}</span> and remove them from all projects.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
