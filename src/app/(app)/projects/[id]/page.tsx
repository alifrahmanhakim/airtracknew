import { notFound } from 'next/navigation';
import { findProjectById, users } from '@/lib/data';
import { ProjectDetailsPage } from '@/components/project-details-page';

type ProjectPageProps = {
  params: {
    id: string;
  };
};

export default function ProjectPage({ params }: ProjectPageProps) {
  const project = findProjectById(params.id);

  if (!project) {
    notFound();
  }

  return <ProjectDetailsPage project={project} users={users} />;
}

// This function can be used by Next.js to pre-render all project pages at build time.
export async function generateStaticParams() {
  const { projects } = await import('@/lib/data');
 
  return projects.map((project) => ({
    id: project.id,
  }))
}
