
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function AiTranslatorPage() {
  const huggingFaceSpaceUrl = "https://enzostvs-deepsite.hf.space";

  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>AI Translator (Embedded)</CardTitle>
          <CardDescription>
            This page embeds an external AI translation service from Hugging Face.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-video w-full rounded-lg border bg-muted overflow-hidden">
            <iframe
              src={huggingFaceSpaceUrl}
              className="h-full w-full"
              title="AI Translator"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            ></iframe>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
