
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Project, User } from '@/lib/types';
import { RulemakingDashboardPage } from '@/components/rulemaking-dashboard-page';

async function getRulemakingData() {
    try {
        const usersPromise = getDocs(collection(db, 'users'));
        const projectsPromise = getDocs(collection(db, 'rulemakingProjects'));

        const [usersSnapshot, projectsSnapshot] = await Promise.all([usersPromise, projectsPromise]);

        const allUsers: User[] = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        
        const allProjects: Project[] = projectsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                projectType: 'Rulemaking',
                subProjects: data.subProjects || [],
                documents: data.documents || [],
                tasks: data.tasks || [],
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            } as Project;
        });
        
        return { allProjects, allUsers };
    } catch (error) {
        console.error("Error fetching initial rulemaking data:", error);
        return { allProjects: [], allUsers: [] };
    }
}


export default async function RulemakingDashboard() {
  const { allProjects, allUsers } = await getRulemakingData();
  
  // The onProjectAdd callback for client components might need adjustment.
  // For now, we rely on server-rendering for fresh data.
  // A full solution might involve router.refresh() or revalidatePath.
  return <RulemakingDashboardPage projects={allProjects} allUsers={allUsers} onProjectAdd={() => {}} />;
}
