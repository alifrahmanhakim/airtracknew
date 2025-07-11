
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Project, User } from '@/lib/types';
import { ProjectDetailsPage } from '@/components/project-details-page';
import { ProjectDetailsPageLoader } from '@/components/project-details-page-loader';
import { Suspense } from 'react';

type ProjectPageProps = {
  params: {
    id: string;
  };
};

async function fetchProjectData(id: string): Promise<{ project: Project | null, users: User[] }> {
    if (!id) return { project: null, users: [] };
    try {
        const projectRef = doc(db, 'projects', id);
        const usersRef = collection(db, 'users');

        const [projectSnap, usersSnap] = await Promise.all([
            getDoc(projectRef),
            getDocs(usersRef)
        ]);

        const project = projectSnap.exists() ? { id: projectSnap.id, ...projectSnap.data() } as Project : null;
        const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));

        return { project, users };
    } catch (err) {
        console.error("Error fetching project data:", err);
        return { project: null, users: [] };
    }
}


async function ProjectData({ projectId }: { projectId: string }) {
    const { project, users } = await fetchProjectData(projectId);

    if (!project) {
        return <div className="p-8 text-center text-red-500">Project not found or failed to load.</div>;
    }

    return <ProjectDetailsPage project={project} users={users} />;
}


export default function ProjectPage({ params }: ProjectPageProps) {
  const projectId = params.id;

  return (
    <Suspense fallback={<ProjectDetailsPageLoader />}>
      <ProjectData projectId={projectId} />
    </Suspense>
  );
}
