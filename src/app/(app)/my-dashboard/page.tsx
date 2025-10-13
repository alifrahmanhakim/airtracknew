
import { collection, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Project, Task, User } from '@/lib/types';
import { MyDashboardPageComponent } from '@/components/my-dashboard-page';
import { headers } from 'next/headers';

async function getDashboardData() {
  const headersList = headers();
  // This is a workaround to get the user ID on the server.
  // A more robust solution would use a proper session management library.
  // We can't use localStorage on the server.
  // This approach relies on the client sending the user ID in a header, which isn't implemented.
  // Let's assume for now we fetch all data and filter on the client,
  // but this highlights the need for better server-side auth handling.
  // For now, we will fetch all projects and let the client component filter.
  // A proper fix would involve getting the user ID server-side.

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
