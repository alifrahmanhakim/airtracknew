
"use client";

import { Chart } from "react-google-charts";
import type { Project, Task } from "@/lib/types";

interface GanttChartProps {
  projects: Project[];
}

// Recursive function to flatten tasks
const flattenTasks = (tasks: Task[], parentProjectName: string): any[] => {
  let flatList: any[] = [];
  tasks.forEach(task => {
    // Basic validation
    if (!task.id || !task.title || !task.startDate || !task.endDate) {
        console.warn('Skipping invalid task:', task);
        return;
    }
      
    flatList.push([
      task.id,
      task.title,
      parentProjectName, // Resource column now holds the project name
      new Date(task.startDate),
      new Date(task.endDate),
      null, // Duration
      task.progress || 0,
      null, // Dependencies
    ]);

    if (task.subTasks && task.subTasks.length > 0) {
      flatList = flatList.concat(flattenTasks(task.subTasks, parentProjectName));
    }
  });
  return flatList;
};

export function GanttChart({ projects }: GanttChartProps) {
  if (!projects || projects.length === 0) {
    return <div className="text-center text-muted-foreground">No project data to display.</div>;
  }
    
  const columns = [
    { type: "string", label: "Task ID" },
    { type: "string", label: "Task Name" },
    { type: "string", label: "Project Name" }, // Changed from "Resource"
    { type: "date", label: "Start Date" },
    { type: "date", label: "End Date" },
    { type: "number", label: "Duration" },
    { type: "number", label: "Percent Complete" },
    { type: "string", label: "Dependencies" },
  ];

  const rows = projects.reduce((acc: any[], project) => {
    if (project.tasks && project.tasks.length > 0) {
      return acc.concat(flattenTasks(project.tasks, project.name));
    }
    return acc;
  }, []);

  if (rows.length === 0) {
    return <div className="text-center text-muted-foreground">No tasks with valid dates found in any project.</div>;
  }
    
  const data = [columns, ...rows];
  const options = {
    height: Math.max(400, rows.length * 40 + 50), // Dynamic height
    gantt: {
      trackHeight: 30,
      criticalPathEnabled: false, // Turn off for simplicity
       arrow: {
        angle: 100,
        width: 1,
        color: 'grey',
        radius: 0
      },
       labelStyle: {
        fontName: 'Inter',
        fontSize: 12,
        color: '#757575'
      },
    },
     tooltip: {
      isHtml: true, // Allow HTML in tooltips if needed
    },
  };

  return (
    <Chart
      chartType="Gantt"
      width="100%"
      height={options.height}
      data={data}
      options={options}
      loader={<div className="text-center">Loading Chart...</div>}
    />
  );
}
