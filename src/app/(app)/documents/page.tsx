import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DocumentsPage() {
  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            A centralized repository for all project-related documents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>The centralized document repository feature will be built here. For now, documents are available within each project's detail page.</p>
        </CardContent>
      </Card>
    </div>
  );
}
