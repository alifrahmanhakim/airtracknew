
import { collection, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Project, Task, User } from '@/lib/types';
import { MyDashboardPageComponent } from '@/components/my-dashboard-page';
import { headers } from 'next/headers';

async function getDashboardData() {
  // This page is a server component. We fetch all data and the client component
  // will filter it based on the logged-in user. This is more efficient
  // than multiple client-side queries.
  try {
    const usersPromise = getDocs(collection(db, 'users'));
    const timKerjaPromise = getDocs(collection(db, 'timKerjaProjects'));
    const rulemakingPromise = getDocs(collection(db, 'rulemakingProjects'));
    
    const [
      usersSnapshot,
      timKerjaSnapshot,
      rulemakingSnapshot,
    ] = await Promise.all([
      usersPromise,
      timKerjaPromise,
      rulemakingPromise,
    ]);

    const allUsers: User[] = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    
    const timKerjaProjects = timKerjaSnapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        ...data, 
        projectType: 'Tim Kerja', 
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
      } as Project
    });
    
    const rulemakingProjects = rulemakingSnapshot.docs.map(doc => {
        const data = doc.data();
        return { 
            id: doc.id, 
            ...data, 
            projectType: 'Rulemaking',
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        } as Project
    });

    const allProjects = [...timKerjaProjects, ...rulemakingProjects];
    
    return { allProjects, allUsers };

  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    return { allProjects: [], allUsers: [] };
  }
}


export default async function MyDashboardPage() {
    const { allProjects, allUsers } = await getDashboardData();
    return <MyDashboardPageComponent initialProjects={allProjects} initialUsers={allUsers} />;
}
