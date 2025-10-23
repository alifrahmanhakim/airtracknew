
import { AppLayout } from '@/components/app-layout-component';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AskStdAiPage() {
  return (
    <AppLayout>
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Ask STD.Ai</CardTitle>
          <CardDescription>
            Your intelligent assistant for aviation regulation and safety standards.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full rounded-lg border bg-muted overflow-hidden" style={{ height: 'calc(100vh - 280px)' }}>
            <iframe
              src="https://qwen-qwen3-vl-30b-a3b-demo.hf.space"
              className="h-full w-full"
              title="Ask STD.Ai Assistant"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            ></iframe>
          </div>
        </CardContent>
      </Card>
    </div>
    </AppLayout>
  );
}
