import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReportsPage() {
  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Reporting</CardTitle>
          <CardDescription>
            Generate reports on project progress, resource allocation, and potential bottlenecks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Advanced reporting and analytics features will be available here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
