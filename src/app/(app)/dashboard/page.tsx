
'use client'

import { getProjectsForUser } from '@/lib/data';
import { DashboardPage } from '@/components/dashboard-page';
import { useEffect, useState } from 'react';
import type { Project, User } from '@/lib/types';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const [userProjects, setUserProjects] = useState<Project[]>([]);
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

          // Fetch projects
          const projectsQuerySnapshot = await getDocs(collection(db, "projects"));
          const projectsFromDb: Project[] = projectsQuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
          
          const projectsWithDefaults = projectsFromDb.map(p => ({
            ...p,
            subProjects: p.subProjects || [],
            documents: p.documents || [],
          }));

          const userVisibleProjects = getProjectsForUser(userId, projectsWithDefaults, usersFromDb);
          // Filter for "Tim Kerja" projects for this dashboard
          const timKerjaProjects = userVisibleProjects.filter(p => p.projectType === 'Tim Kerja');
          setUserProjects(timKerjaProjects);
        } catch (error) {
          console.error("Error fetching data from Firestore:", error);
        }
      }
      setIsLoading(false);
    };

    if (userId) {
        fetchData();
    } else {
        // If no userId, we are likely redirecting, so no need to fetch data.
        // We can stop loading to prevent showing a perpetual skeleton screen.
        setIsLoading(false);
    }
  }, [userId]);

  if (isLoading) {
    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
            </div>
            <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
                <Skeleton className="h-80 lg:col-span-2" />
            </div>
             <div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-48" />
                    <Skeleton className="h-48" />
                    <Skeleton className="h-48" />
                </div>
            </div>
        </main>
    );
  }

  return <DashboardPage projects={userProjects} users={allUsers} />;
}
