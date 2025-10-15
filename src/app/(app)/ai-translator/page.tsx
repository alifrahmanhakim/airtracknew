
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExternalLink, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AiTranslatorPage() {
  const huggingFaceSpaceUrl = "https://unesco-nllb.hf.space";

  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                  <CardTitle>AI Translator (Embedded)</CardTitle>
                  <CardDescription>
                    This page embeds an external AI translation service from Hugging Face.
                  </CardDescription>
              </div>
              <Button asChild>
                  <a href={huggingFaceSpaceUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open in New Tab
                  </a>
              </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Embedding Notice</AlertTitle>
            <AlertDescription>
              Please note that some Hugging Face Spaces have security settings that may prevent them from being embedded on other websites. If you see an "Unauthorized Embedding" error, please use the "Open in New Tab" button.
            </AlertDescription>
          </Alert>
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
