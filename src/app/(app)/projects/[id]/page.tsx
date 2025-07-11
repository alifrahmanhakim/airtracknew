
'use client';

import { notFound } from 'next/navigation';
import { users } from '@/lib/data';
import { ProjectDetailsPage } from '@/components/project-details-page';
import { useEffect, useState } from 'react';
import type { Project } from '@/lib/types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';


type ProjectPageProps = {
  params: {
    id: string;
  };
};

export default function ProjectPage({ params }: ProjectPageProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const projectId = params.id;
    if (!projectId) {
      setIsLoading(false);
      setError("No project ID provided.");
      return;
    };

    const fetchProject = async () => {
      setIsLoading(true);
      try {
        const projectRef = doc(db, 'projects', projectId);
        const projectSnap = await getDoc(projectRef);

        if (projectSnap.exists()) {
          setProject({ id: projectSnap.id, ...projectSnap.data() } as Project);
        } else {
          setError('Project not found.');
        }
      } catch (err) {
        console.error("Error fetching project:", err);
        setError('Failed to load project data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [params.id]);

  if (isLoading) {
    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-9 w-96 mb-2" />
                    <Skeleton className="h-5 w-full max-w-lg" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>
             <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            </div>
        </main>
    )
  }

  if (error) {
    // A simple error message, can be styled better
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }
  
  if (!project) {
    // This can happen briefly before loading completes or if notFound() is triggered.
    // Instead of calling notFound() here, we let the loading/error state handle it.
    // If loading is done and there's no project and no error, notFound() should be called,
    // which can be triggered inside the fetch logic.
    return null;
  }

  return <ProjectDetailsPage project={project} users={users} />;
}
