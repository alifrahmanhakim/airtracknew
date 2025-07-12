
'use client'

import { getProjectsForUser } from '@/lib/data';
import { useEffect, useState } from 'react';
import type { Project, User } from '@/lib/types';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { RulemakingDashboardPage } from '@/components/rulemaking-dashboard-page';

export default function RulemakingDashboard() {
  const [rulemakingProjects, setRulemakingProjects] = useState<Project[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const loggedInUserId = localStorage.getItem('loggedInUserId');
    setUserId(loggedInUserId);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      if (userId) {
        try {
          // Fetch users
          const usersQuerySnapshot = await getDocs(collection(db, "users"));
          const usersFromDb: User[] = usersQuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
          setAllUsers(usersFromDb);

          // Fetch Rulemaking projects
          const projectsQuerySnapshot = await getDocs(collection(db, "rulemakingProjects"));
          const projectsFromDb: Project[] = projectsQuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), projectType: 'Rulemaking' } as Project));
          
          const projectsWithDefaults = projectsFromDb.map(p => ({
            ...p,
            subProjects: p.subProjects || [],
            documents: p.documents || [],
          }));

          const userVisibleProjects = getProjectsForUser(userId, projectsWithDefaults, usersFromDb);
          setRulemakingProjects(userVisibleProjects);
        } catch (error) {
          console.error("Error fetching projects from Firestore:", error);
        }
      }
      setIsLoading(false);
    };

    if (userId) {
        fetchData();
    } else {
        setIsLoading(false);
    }
  }, [userId]);

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
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
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

  return <RulemakingDashboardPage projects={rulemakingProjects} allUsers={allUsers} />;
}
