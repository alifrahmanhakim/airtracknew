
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Project, User, GapAnalysisRecord } from '@/lib/types';
import { ProjectDetailsPage } from '@/components/project-details-page';
import { ProjectDetailsPageLoader } from '@/components/project-details-page-loader';
import { Suspense } from 'react';

type ProjectPageProps = {
  params: {
    id: string;
  };
  searchParams: {
    type?: 'rulemaking' | 'timkerja';
  };
};

async function fetchProjectData(id: string, type: 'rulemaking' | 'timkerja' = 'timkerja'): Promise<{ project: Project | null, users: User[], gapAnalysisRecords: GapAnalysisRecord[] }> {
    if (!id) return { project: null, users: [], gapAnalysisRecords: [] };
    try {
        const collectionName = type === 'rulemaking' ? 'rulemakingProjects' : 'timKerjaProjects';
        const projectRef = doc(db, collectionName, id);
        const usersRef = collection(db, 'users');
        const gapAnalysisRef = collection(db, 'gapAnalysisRecords');

        const [projectSnap, usersSnap, gapAnalysisSnap] = await Promise.all([
            getDoc(projectRef),
            getDocs(usersRef),
            getDocs(gapAnalysisRef)
        ]);

        const project = projectSnap.exists() ? { id: projectSnap.id, ...projectSnap.data() } as Project : null;
        if (project) {
          project.projectType = type === 'rulemaking' ? 'Rulemaking' : 'Tim Kerja';
        }
        const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        const gapAnalysisRecords = gapAnalysisSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as GapAnalysisRecord));

        return { project, users, gapAnalysisRecords };
    } catch (err) {
        console.error("Error fetching project data:", err);
        return { project: null, users: [], gapAnalysisRecords: [] };
    }
}


async function ProjectData({ projectId, projectType }: { projectId: string, projectType: 'rulemaking' | 'timkerja' }) {
    const { project, users, gapAnalysisRecords } = await fetchProjectData(projectId, projectType);

    if (!project) {
        return <div className="p-8 text-center text-red-500">Project not found or failed to load.</div>;
    }

    return <ProjectDetailsPage project={project} users={users} allGapAnalysisRecords={gapAnalysisRecords} />;
}


export default function ProjectPage({ params, searchParams }: ProjectPageProps) {
  const projectId = params.id;
  const projectType = searchParams.type || 'timkerja';

  return (
    <Suspense fallback={<ProjectDetailsPageLoader />}>
      <ProjectData projectId={projectId} projectType={projectType} />
    </Suspense>
  );
}
