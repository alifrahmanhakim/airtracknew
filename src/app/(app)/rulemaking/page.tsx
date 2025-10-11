
'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Project, User } from '@/lib/types';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { RulemakingDashboardPage } from '@/components/rulemaking-dashboard-page';

export default function RulemakingDashboard() {
  const [rulemakingProjects, setRulemakingProjects] = useState<Project[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(() => {
    setIsLoading(true);

    const usersQuery = query(collection(db, "users"));
    const projectsQuery = query(collection(db, "rulemakingProjects"));

    const usersUnsub = onSnapshot(usersQuery, (snapshot) => {
        const usersFromDb: User[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setAllUsers(usersFromDb);
    });

    const projectsUnsub = onSnapshot(projectsQuery, (snapshot) => {
        const projectsFromDb: Project[] = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(), 
            projectType: 'Rulemaking',
            subProjects: doc.data().subProjects || [],
            documents: doc.data().documents || [],
        } as Project));
        
        setRulemakingProjects(projectsFromDb);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching rulemaking projects:", error);
        setIsLoading(false);
    });

    return () => {
        usersUnsub();
        projectsUnsub();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = fetchData();
    return () => unsubscribe();
  }, [fetchData]);


  if (isLoading) {
    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className='mb-4'>
                <Skeleton className="h-8 w-96 mb-2" />
                <Skeleton className="h-5 w-1/2" />
            </div>
            <div className='flex justify-between items-center mb-6'>
                <Skeleton className="h-10 w-1/3" />
                <div className='flex gap-2'>
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1 space-y-6">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
                <div className="md:col-span-3 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-60 w-full" />
                    ))}
                </div>
            </div>
        </main>
    );
  }

  return <RulemakingDashboardPage projects={rulemakingProjects} allUsers={allUsers} onProjectAdd={fetchData} />;
}
