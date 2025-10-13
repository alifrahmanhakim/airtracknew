
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Project, Document as ProjectDocument, Task, Attachment } from '@/lib/types';
import { DocumentsClientPage } from '@/components/documents-client-page';
import { parseISO } from 'date-fns';

type LinkedFile = {
  id: string;
  name: string;
  url: string;
  type: ProjectDocument['type'];
  date: string;
  projectId: string;
  projectName: string;
  projectType: Project['projectType'];
  source: 'Project' | 'Task';
  taskTitle?: string;
};

const determineFileType = (url: string): ProjectDocument['type'] => {
    try {
      const pathname = new URL(url).pathname;
      const extension = pathname.split('.').pop()?.toLowerCase();
      if (!extension) return 'Other';
  
      if (extension === 'pdf') return 'PDF';
      if (['doc', 'docx'].includes(extension)) return 'Word';
      if (['xls', 'xlsx', 'csv'].includes(extension)) return 'Excel';
      if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(extension)) return 'Image';
      
      return 'Other';
    } catch {
      return 'Other';
    }
};

async function getAllLinkedFiles() {
    try {
        const timKerjaPromise = getDocs(collection(db, 'timKerjaProjects'));
        const rulemakingPromise = getDocs(collection(db, 'rulemakingProjects'));
        
        const [timKerjaSnapshot, rulemakingSnapshot] = await Promise.all([
          timKerjaPromise,
          rulemakingPromise,
        ]);

        const allProjects: Project[] = [
          ...timKerjaSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)),
          ...rulemakingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)),
        ];

        const linkedFiles: LinkedFile[] = [];

        const extractTaskAttachments = (tasks: Task[], project: Project) => {
            tasks.forEach(task => {
                if (task.attachments && task.attachments.length > 0) {
                    task.attachments.forEach((att: Attachment) => {
                        linkedFiles.push({
                            id: att.id,
                            name: att.name,
                            url: att.url,
                            type: determineFileType(att.url),
                            date: task.dueDate,
                            projectId: project.id,
                            projectName: project.name,
                            projectType: project.projectType,
                            source: 'Task',
                            taskTitle: task.title,
                        });
                    });
                }
                if (task.subTasks && task.subTasks.length > 0) {
                    extractTaskAttachments(task.subTasks, project);
                }
            });
        };

        allProjects.forEach(project => {
          if (project.documents && project.documents.length > 0) {
            project.documents.forEach(doc => {
              linkedFiles.push({
                ...doc,
                type: determineFileType(doc.url),
                date: doc.uploadDate,
                projectId: project.id,
                projectName: project.name,
                projectType: project.projectType,
                source: 'Project',
              });
            });
          }
          if (project.tasks && project.tasks.length > 0) {
              extractTaskAttachments(project.tasks, project);
          }
        });
        
        linkedFiles.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
        return linkedFiles;

    } catch (error) {
        console.error("Failed to fetch linked files:", error);
        return [];
    }
}

export default async function DocumentsPage() {
    const files = await getAllLinkedFiles();
    return <DocumentsClientPage initialFiles={files} />;
}
