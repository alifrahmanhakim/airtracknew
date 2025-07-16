
"use client";

import { StateLetterAnalyticsDashboard } from "src/components/state-letter-analytics-dashboard";
import { StateLetterRecordsTable } from "src/components/state-letter-records-table";
import { db } from "src/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { StateLetterRecord } from "src/lib/types";
import { useToast } from "src/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function StateLetterPage() {
  const [records, setRecords] = useState<StateLetterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "stateLetterRecords"),
      (snapshot) => {
        const newRecords = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as StateLetterRecord[];
        setRecords(newRecords);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching state letter records:", error);
        toast({
          title: "Error",
          description: "Failed to fetch state letter records.",
          variant: "destructive",
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [toast]);

  return (
    <main className="p-4 md:p-8 space-y-8">
       <h1 className="text-3xl font-bold">State Letter Monitoring</h1>
       {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-1" />
          <Skeleton className="h-96 lg:col-span-2" />
        </div>
       ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-1 space-y-6">
            <StateLetterAnalyticsDashboard records={records} />
          </div>
          <div className="lg:col-span-2">
             <Card>
              <CardHeader>
                <CardTitle>State Letter Records</CardTitle>
              </CardHeader>
              <CardContent>
                <StateLetterRecordsTable data={records} />
              </CardContent>
            </Card>
          </div>
        </div>
       )}
    </main>
  );
}
