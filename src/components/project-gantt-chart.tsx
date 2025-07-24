
"use client";

import { useEffect, useState } from "react";
import { getAllProjects } from "@/lib/actions/project";
import type { Project } from "@/lib/types";
import { GanttChart } from "@/components/gantt-chart";
import { Skeleton } from "@/components/ui/skeleton";

export function ProjectGanttChart() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const fetchedProjects = await getAllProjects();
        setProjects(fetchedProjects);
      } catch (error) {
        console.error("Failed to fetch projects for Gantt chart:", error);
        // Optionally, show a toast or an error message to the user
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  return <GanttChart projects={projects} />;
}
