
'use client'

import { projects, users, getProjectsForUser } from '@/lib/data';
import { DashboardPage } from '@/components/dashboard-page';
import { useEffect, useState } from 'react';
import type { Project } from '@/lib/types';

export default function Dashboard() {
  const [userProjects, setUserProjects] = useState<Project[]>([]);

  useEffect(() => {
    const userId = localStorage.getItem('loggedInUserId');
    if (userId) {
      const projects = getProjectsForUser(userId);
      setUserProjects(projects);
    }
  }, []);

  if (!userProjects.length) {
    // You can add a nicer loading state here
    return <div>Loading projects...</div>;
  }

  return <DashboardPage projects={userProjects} users={users} />;
}
