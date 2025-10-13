
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { GapAnalysisRecord, Project } from '@/lib/types';
import { StateLetterClientPage } from '@/components/state-letter-client-page';


async function getGapAnalysisData() {
    try {
        const projectsPromise = getDocs(collection(db, "rulemakingProjects"));
        const recordsPromise = getDocs(query(collection(db, "gapAnalysisRecords"), orderBy("createdAt", "desc")));
        
        const [projectsSnapshot, recordsSnapshot] = await Promise.all([projectsPromise, recordsPromise]);

        const projectsFromDb: Project[] = projectsSnapshot.docs.map(doc => {
            const data = doc.data();
            return { 
                id: doc.id, 
                ...data,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            } as Project
        });
        
        const recordsFromDb: GapAnalysisRecord[] = recordsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt
            } as GapAnalysisRecord
        });
        
        return { projects: projectsFromDb, records: recordsFromDb };

    } catch (error) {
        console.error("Error fetching State Letter page data:", error);
        return { projects: [], records: [] };
    }
}

export default async function StateLetterPage() {
    const { projects, records } = await getGapAnalysisData();

    return <StateLetterClientPage initialRecords={records} initialRulemakingProjects={projects} />;
}
