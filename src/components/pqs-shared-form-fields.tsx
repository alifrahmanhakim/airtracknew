
'use client';

import { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Info } from 'lucide-react';
import { Label } from './ui/label';

export const formSchema = z.object({
  section: z.string().min(1, 'Section is required'),
  pqNumber: z.string().min(1, 'PQ Number is required'),
  protocolQuestion: z.string().min(1, 'Protocol Question is required'),
  guidance: z.string().min(1, 'Guidance for Review of Evidence is required'),
  icaoReferences: z.string().min(1, 'ICAO References are required'),
  ppq: z.enum(['YES', 'NO']),
  criticalElement: z.enum(['CE - 1','CE - 2','CE - 3','CE - 4','CE - 5','CE - 6','CE - 7','CE - 8']),
  remarks: z.string().min(1, 'Remarks are required'),
  evidence: z.string().min(1, 'Evidence is required'),
  answer: z.string().min(1, 'Answer is required'),
  poc: z.string().min(1, 'POC is required'),
  icaoStatus: z.enum(['Satisfactory', 'No Satisfactory']),
  cap: z.string().min(1, 'CAP is required'),
  sspComponent: z.string().optional(),
  status: z.enum(['Existing', 'Draft', 'Final']),
});

export type PqFormValues = z.infer<typeof formSchema>;

const ppqOptions = ["YES", "NO"];
const criticalElementOptions = ["CE - 1", "CE - 2", "CE - 3", "CE - 4", "CE - 5", "CE - 6", "CE - 7", "CE - 8"];
const icaoStatusOptions = ["Satisfactory", "No Satisfactory"];
const statusOptions = ["Existing", "Draft", "Final"];

type PqsSharedFormFieldsProps = {
  form: UseFormReturn<PqFormValues>;
}

export function PqsSharedFormFields({ form }: PqsSharedFormFieldsProps) {
  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="section"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Section</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="pqNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>PQ Number</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="protocolQuestion"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Protocol Question</FormLabel>
            <FormControl>
              <Textarea rows={4} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="guidance"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Guidance for Review of Evidence</FormLabel>
            <FormControl>
              <Textarea rows={4} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="icaoReferences"
        render={({ field }) => (
          <FormItem>
            <FormLabel>ICAO References</FormLabel>
            <FormControl>
              <Textarea rows={4} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="ppq"
          render={({ field }) => (
            <FormItem>
              <FormLabel>PPQ</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Select PPQ..." /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ppqOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="criticalElement"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Critical Element</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Select Critical Element..." /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {criticalElementOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="remarks"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Remarks</FormLabel>
            <FormControl>
              <Textarea rows={4} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="evidence"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Evidence</FormLabel>
            <FormControl>
              <Textarea rows={4} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="answer"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Answer</FormLabel>
            <FormControl>
              <Textarea rows={4} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="poc"
        render={({ field }) => (
          <FormItem>
            <FormLabel>POC</FormLabel>
            <FormControl>
              <Textarea rows={4} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="icaoStatus"
        render={({ field }) => (
          <FormItem>
            <FormLabel>ICAO Status Implementation</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger><SelectValue placeholder="Select ICAO Status..." /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {icaoStatusOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="cap"
        render={({ field }) => (
          <FormItem>
            <FormLabel>CAP</FormLabel>
            <FormControl>
              <Textarea rows={4} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="sspComponent"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center gap-2">
              <Label htmlFor={field.name}>SSP Component</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>if required</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <FormControl>
              <Textarea rows={4} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Status</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger><SelectValue placeholder="Select status..." /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {statusOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </TooltipProvider>
  );
}
