
import { CcefodForm } from '@/components/ccefod-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CcefodPage() {
  return (
    <div className="p-4 md:p-8">
       <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Compliance Checklist (CC) / EFOD</CardTitle>
          <CardDescription>
            Formulir untuk memonitor dan mengelola Compliance Checklist dan Electronic Filing of Differences (EFOD).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CcefodForm />
        </CardContent>
      </Card>
    </div>
  );
}
