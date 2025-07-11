
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Project } from '@/lib/types';
import { users } from '@/lib/data';
import { ProjectDetailsPage } from '@/components/project-details-page';
import { ProjectDetailsPageLoader } from '@/components/project-details-page-loader';
import { Suspense } from 'react';

type ProjectPageProps = {
  params: {
    id: string;
  };
};

async function fetchProjectData(id: string): Promise<Project | null> {
    if (!id) return null;
    try {
        const projectRef = doc(db, 'projects', id);
        const projectSnap = await getDoc(projectRef);

        if (projectSnap.exists()) {
            return { id: projectSnap.id, ...projectSnap.data() } as Project;
        } else {
            return null;
        }
    } catch (err) {
        console.error("Error fetching project:", err);
        // In a real app, you might want to log this error to a service
        return null;
    }
}


async function ProjectData({ projectId }: { projectId: string }) {
    const project = await fetchProjectData(projectId);

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
