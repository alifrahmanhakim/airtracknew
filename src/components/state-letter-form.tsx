
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
} from "@/components/ui/form";
import { StateLetterSharedFormFields } from "@/components/state-letter-shared-form-fields";
import { addStateLetterRecord } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export const stateLetterFormSchema = z.object({
  no: z.string().min(1, "No is required"),
  subject: z.string().min(1, "Subject is required"),
  reference: z.string().min(1, "Reference is required"),
  casr: z.string().min(1, "CASR is required"),
  description: z.string().min(1, "Description is required"),
  status: z.enum(["Open", "Closed", "In Progress"]),
  assignedTo: z.string().min(1, "Assigned to is required"),
  dueDate: z.string().min(1, "Due date is required"),
});

export function StateLetterForm({
  setOpen,
}: {
  setOpen: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof stateLetterFormSchema>>({
    resolver: zodResolver(stateLetterFormSchema),
    defaultValues: {
      status: "Open",
      no: "",
      subject: "",
      reference: "",
      casr: "",
      description: "",
      assignedTo: "",
      dueDate: ""
    },
  });

  async function onSubmit(values: z.infer<typeof stateLetterFormSchema>) {
    setIsSubmitting(true);
    const result = await addStateLetterRecord(values);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Record Added",
        description: "The state letter record has been created.",
      });
      setOpen(false);
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "Failed to create record.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <StateLetterSharedFormFields form={form} />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit
        </Button>
      </form>
    </Form>
  );
}
