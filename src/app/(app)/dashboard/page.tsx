
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Project, User } from '@/lib/types';
import { DashboardPage } from '@/components/dashboard-page';
import { AppLayout } from '@/components/app-layout-component';

// This page is now a Server Component that fetches data on the server.
async function getProjectsAndUsers() {
  try {
    const usersPromise = getDocs(collection(db, 'users'));
    const projectsPromise = getDocs(collection(db, 'timKerjaProjects'));
    
    const [usersSnapshot, projectsSnapshot] = await Promise.all([usersPromise, projectsPromise]);
    
    const allUsers: User[] = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    
    const allProjects: Project[] = projectsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        projectType: 'Tim Kerja',
        tasks: data.tasks || [],
        documents: data.documents || [],
        subProjects: data.subProjects || [],
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
      } as Project;
    });
    
    return { allProjects, allUsers };
  } catch (error) {
    console.error("Error fetching initial dashboard data:", error);
    return { allProjects: [], allUsers: [] };
  }
}

export default async function Dashboard() {
  const { allProjects, allUsers } = await getProjectsAndUsers();
  return (
    <AppLayout>
      <DashboardPage initialProjects={allProjects} initialUsers={allUsers} />
    </AppLayout>
  );
}
