
'use client'

import { getProjectsForUser, users } from '@/lib/data';
import { DashboardPage } from '@/components/dashboard-page';
import { useEffect, useState } from 'react';
import type { Project } from '@/lib/types';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      const userId = localStorage.getItem('loggedInUserId');
      if (userId) {
        try {
          const querySnapshot = await getDocs(collection(db, "projects"));
          const projectsFromDb: Project[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
          
          // You can still use the local filter logic, but now with live data
          const filteredProjects = getProjectsForUser(userId, projectsFromDb);
          setUserProjects(filteredProjects);
        } catch (error) {
          console.error("Error fetching projects from Firestore:", error);
          // Handle error, maybe show a toast
        }
      }
      setIsLoading(false);
    };

    fetchProjects();
  }, []);

  if (isLoading) {
    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
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
                <Skeleton className="h-8 w-48 mb-4" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-48" />
                    <Skeleton className="h-48" />
                    <Skeleton className="h-48" />
                </div>
            </div>
        </main>
    );
  }

  return <DashboardPage projects={userProjects} users={users} />;
}
