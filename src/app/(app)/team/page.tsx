

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
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, AlertTriangle, Loader2, UserCheck, UserX, ArrowUpDown, Search, User as UserIcon } from 'lucide-react';
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
import { deleteUser, updateUserApproval } from '@/lib/actions/user';
import { AssignRoleDialog } from '@/components/assign-role-dialog';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const USERS_PER_PAGE = 10;
const userRoles: User['role'][] = ['Sub-Directorate Head', 'Team Lead', 'PIC', 'PIC Assistant', 'Functional'];

type SortDescriptor = {
    column: keyof User;
    direction: 'asc' | 'desc';
} | null;

export default function TeamPage() {
  const [users, setUsers] = React.useState<User[]>([]);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [userToDelete, setUserToDelete] = React.useState<User | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const { toast } = useToast();

  // State for filtering and sorting
  const [searchTerm, setSearchTerm] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [sort, setSort] = React.useState<SortDescriptor>({ column: 'name', direction: 'asc' });

  React.useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const loggedInUserId = localStorage.getItem('loggedInUserId');
        if (loggedInUserId) {
          const userDoc = await getDoc(doc(db, "users", loggedInUserId));
          if (userDoc.exists()) {
              setCurrentUser({ id: userDoc.id, ...userDoc.data() } as User);
          }
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
  
  const filteredAndSortedUsers = React.useMemo(() => {
      let filtered = [...users];

      // Filter by search term
      if (searchTerm) {
          const lowercasedTerm = searchTerm.toLowerCase();
          filtered = filtered.filter(user => 
              user.name.toLowerCase().includes(lowercasedTerm) || 
              user.email?.toLowerCase().includes(lowercasedTerm)
          );
      }

      // Filter by role
      if (roleFilter !== 'all') {
          filtered = filtered.filter(user => user.role === roleFilter);
      }

      // Filter by status
      if (statusFilter !== 'all') {
          const isApproved = statusFilter === 'approved';
          filtered = filtered.filter(user => !!user.isApproved === isApproved);
      }

      // Sort
      if (sort) {
          filtered.sort((a, b) => {
              const aVal = a[sort.column as keyof User] as string | undefined;
              const bVal = b[sort.column as keyof User] as string | undefined;
              if (!aVal) return 1;
              if (!bVal) return -1;
              if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
              if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
              return 0;
          });
      }
      
      return filtered;
  }, [users, searchTerm, roleFilter, statusFilter, sort]);

  const totalPages = Math.ceil(filteredAndSortedUsers.length / USERS_PER_PAGE);
  const paginatedUsers = filteredAndSortedUsers.slice((currentPage - 1) * USERS_PER_PAGE, currentPage * USERS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleUserUpdate = (updatedUser: User) => {
    setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
  };
  
  const handleApprovalChange = async (user: User, isApproved: boolean) => {
    const result = await updateUserApproval(user.id, isApproved);
    if (result.success) {
      handleUserUpdate({ ...user, isApproved });
      toast({
        title: `User ${isApproved ? 'Approved' : 'Unapproved'}`,
        description: `${user.name} has been ${isApproved ? 'approved' : 'unapproved'}.`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error || 'Failed to update approval status.',
      });
    }
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
    setIsDeleting(true);
    const result = await deleteUser(userToDelete.id);
    if (result.success) {
        setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
        toast({ title: "User Deleted", description: `${userToDelete.name} has been removed.` });
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setIsDeleting(false);
    setUserToDelete(null);
  };

  const handleSort = (column: keyof User) => {
    setSort(prevSort => {
        if (prevSort?.column === column) {
            return { column, direction: prevSort.direction === 'asc' ? 'desc' : 'asc' };
        }
        return { column, direction: 'asc' };
    });
  }

  const renderSortIcon = (column: keyof User) => {
      if (sort?.column !== column) return <ArrowUpDown className="h-4 w-4 ml-2 opacity-30" />;
      return sort.direction === 'asc' ? <ArrowUpDown className="h-4 w-4 ml-2" /> : <ArrowUpDown className="h-4 w-4 ml-2" />;
  }


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
                             <div key={i} className="flex items-center space-x-4 p-2">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-4/5" />
                                </div>
                                <Skeleton className="h-4 w-1/5" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
  }
  
  const isAdmin = currentUser?.role === 'Sub-Directorate Head' || currentUser?.email === 'admin@admin2023.com' || currentUser?.email === 'hakimalifrahman@gmail.com';

  return (
    <TooltipProvider>
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            An overview of all team members and their roles.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filter by role..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        {userRoles.map(role => (
                            <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filter by status..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="border rounded-md overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                                <div className="flex items-center">User {renderSortIcon('name')}</div>
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('role')}>
                                <div className="flex items-center">Role {renderSortIcon('role')}</div>
                            </TableHead>
                            <TableHead>Status</TableHead>
                            {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedUsers.map(user => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="flex items-center gap-4">
                                        <Avatar className="hidden h-9 w-9 sm:flex">
                                            <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="person portrait" />
                                            <AvatarFallback>
                                                <UserIcon className="h-5 w-5" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="grid gap-1">
                                            <p className="text-sm font-medium leading-none">{user.name}</p>
                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>{user.role}</TableCell>
                                <TableCell>
                                    <div className={cn("flex items-center gap-2 text-sm", user.isApproved ? "text-green-600" : "text-yellow-600")}>
                                        {user.isApproved ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                                        <span>{user.isApproved ? 'Approved' : 'Pending'}</span>
                                    </div>
                                </TableCell>
                                {isAdmin && (
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <AssignRoleDialog user={user} onUserUpdate={handleUserUpdate} />
                                            {user.isApproved ? (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="outline" size="icon" onClick={() => handleApprovalChange(user, false)}>
                                                            <UserX className="h-4 w-4 text-yellow-600" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent><p>Unapprove User</p></TooltipContent>
                                                </Tooltip>
                                            ) : (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="outline" size="icon" onClick={() => handleApprovalChange(user, true)}>
                                                            <UserCheck className="h-4 w-4 text-green-600" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent><p>Approve User</p></TooltipContent>
                                                </Tooltip>
                                            )}
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
            </div>
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }} 
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''} 
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="px-4 py-2 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                    className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
        </CardContent>
      </Card>
      
       <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader className="text-center items-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-2">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the user account for <span className="font-semibold">{userToDelete?.name}</span> and remove them from all projects.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isDeleting}>
                        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
      </AlertDialog>
    </div>
    </TooltipProvider>
  );
}
