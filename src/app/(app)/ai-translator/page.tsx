
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function AiTranslatorPage() {
  // IMPORTANT: Replace this with the actual URL of your Hugging Face Space
  const huggingFaceSpaceUrl = "https://huggingface.co/spaces/YOUR_SPACE_HERE";

  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>AI Translator (Embedded)</CardTitle>
          <CardDescription>
            This page embeds an external AI translation service.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertTitle>Developer Note</AlertTitle>
            <AlertDescription>
              Please replace the placeholder URL in the code with the actual URL of your Hugging Face Space to enable this feature. The current URL is a placeholder and will not work.
            </AlertDescription>
          </Alert>

          <div className="aspect-video w-full rounded-lg border bg-muted">
            <iframe
              src={huggingFaceSpaceUrl}
              className="h-full w-full"
              title="AI Translator"
              sandbox="allow-scripts allow-same-origin"
            ></iframe>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
