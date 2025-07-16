
'use client';

import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import { z } from 'zod';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from './ui/button';
import { CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from './ui/calendar';
import { Combobox, ComboboxOption } from './ui/combobox';

export const formSchema = z.object({
  slReferenceNumber: z.string().min(1, 'SL Reference Number is required'),
  annex: z.string().min(1, 'Annex is required'),
  typeOfStateLetter: z.string().min(1, 'Type of State Letter is required'),
  dateOfEvaluation: z.string().min(1, 'Date of Evaluation is required'),
  subject: z.string().min(1, 'Subject is required'),
  actionRequired: z.string().min(1, 'Action Required is required'),
  effectiveDate: z.string().min(1, 'Effective Date is required'),
  applicabilityDate: z.string().min(1, 'Applicability Date is required'),
  embeddedApplicabilityDate: z.date({ required_error: 'Embedded applicability date is required.' }),
  evaluations: z.array(z.object({
    id: z.string(),
    icaoSarp: z.string().min(1, 'ICAO SARP is required'),
    review: z.string().min(1, 'Review is required'),
    complianceStatus: z.enum([
      'No Differences',
      'More Exacting or Exceeds',
      'Different in character or other means of compliance',
      'Less protective or partially implemented or not implemented',
      'Not Applicable',
    ]),
  })).min(1, 'At least one evaluation item is required'),
  statusItem: z.enum(['OPEN', 'CLOSED']),
  summary: z.string().optional(),
  inspectorNames: z.array(z.string()).optional(),
  casrAffected: z.string().min(1, 'CASR to be affected is required'),
});

export type GapAnalysisFormValues = z.infer<typeof formSchema>;

const complianceStatusOptions: GapAnalysisFormValues['evaluations'][0]['complianceStatus'][] = [
    'No Differences',
    'More Exacting or Exceeds',
    'Different in character or other means of compliance',
    'Less protective or partially implemented or not implemented',
    'Not Applicable',
];

type GapAnalysisSharedFormFieldsProps = {
  form: ReturnType<typeof useFormContext<GapAnalysisFormValues>>;
  casrOptions: ComboboxOption[];
}

export function GapAnalysisSharedFormFields({ form, casrOptions }: GapAnalysisSharedFormFieldsProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'evaluations',
  });

  return (
    <>
      <Card>
        <CardHeader><CardTitle>A. GENERAL</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="slReferenceNumber" render={({ field }) => ( <FormItem> <FormLabel>SL Reference Number</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
            <FormField control={form.control} name="annex" render={({ field }) => ( <FormItem> <FormLabel>ANNEX</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
            <FormField control={form.control} name="typeOfStateLetter" render={({ field }) => ( <FormItem> <FormLabel>Type of State Letter</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
            <FormField control={form.control} name="dateOfEvaluation" render={({ field }) => ( <FormItem> <FormLabel>Date of Evaluation</FormLabel> <FormControl><Input type="date" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
          </div>
          <FormField
            control={form.control}
            name="casrAffected"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel>CASR to be affected</FormLabel>
                <Combobox 
                    options={casrOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select or type a CASR..."
                />
                <FormMessage />
                </FormItem>
            )}
            />
          <FormField control={form.control} name="subject" render={({ field }) => ( <FormItem> <FormLabel>Subject</FormLabel> <FormControl><Textarea {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
          <FormField control={form.control} name="actionRequired" render={({ field }) => ( <FormItem> <FormLabel>Action required</FormLabel> <FormControl><Textarea {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
          <fieldset className="border p-4 rounded-md">
            <legend className="text-sm font-medium px-1">Standardization Process</legend>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <FormField control={form.control} name="effectiveDate" render={({ field }) => ( <FormItem> <FormLabel>Effective Date</FormLabel> <FormControl><Input type="date" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="applicabilityDate" render={({ field }) => ( <FormItem> <FormLabel>Applicability Date</FormLabel> <FormControl><Input type="date" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField
                  control={form.control}
                  name="embeddedApplicabilityDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Embedded applicability date(s)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
          </fieldset>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>EVALUATION</CardTitle>
            <Button type="button" size="sm" onClick={() => append({ id: `eval-${Date.now()}`, icaoSarp: '', review: '', complianceStatus: 'No Differences' })}>
                <Plus className="mr-2 h-4 w-4" /> Add Evaluation Item
            </Button>
        </CardHeader>
        <CardContent className="space-y-6">
            {fields.map((field, index) => (
                <div key={field.id} className="border p-4 rounded-lg relative space-y-4">
                    <h4 className="font-semibold text-lg">Number: {index + 1}</h4>
                    <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                    <FormField control={form.control} name={`evaluations.${index}.icaoSarp`} render={({ field }) => ( <FormItem> <FormLabel>ICAO SARP</FormLabel> <FormControl><Textarea {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                    <FormField control={form.control} name={`evaluations.${index}.review`} render={({ field }) => ( <FormItem> <FormLabel>REVIEW</FormLabel> <FormControl><Textarea {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                    <FormField control={form.control} name={`evaluations.${index}.complianceStatus`} render={({ field }) => (
                        <FormItem>
                            <FormLabel>DGCA Compliance/Differences Status</FormLabel>
                            <FormControl>
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
                                    {complianceStatusOptions.map(option => (
                                        <FormItem key={option} className="flex items-center space-x-3 space-y-0">
                                            <FormControl><RadioGroupItem value={option} /></FormControl>
                                            <FormLabel className="font-normal">{option}</FormLabel>
                                        </FormItem>
                                    ))}
                                </RadioGroup>
                            </FormControl>
                        </FormItem>
                    )}/>
                </div>
            ))}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle>FOLLOW UP</CardTitle></CardHeader>
        <CardContent className="space-y-4">
            <FormField control={form.control} name="statusItem" render={({ field }) => (
                <FormItem>
                    <FormLabel>STATUS ITEM</FormLabel>
                    <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center space-x-4">
                            <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="OPEN" /></FormControl><FormLabel className="font-normal">OPEN</FormLabel></FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="CLOSED" /></FormControl><FormLabel className="font-normal">CLOSED</FormLabel></FormItem>
                        </RadioGroup>
                    </FormControl>
                </FormItem>
            )}/>
            <FormField control={form.control} name="summary" render={({ field }) => ( <FormItem> <FormLabel>SUMMARY</FormLabel> <FormControl><Textarea {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
            <Controller
                control={form.control}
                name="inspectorNames"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>INSPECTOR NAME</FormLabel>
                        <FormControl>
                            <div>
                                <Input value={field.value?.[0] || ''} onChange={e => form.setValue('inspectorNames', [e.target.value, field.value?.[1] || ''])} placeholder="1." />
                                <Input value={field.value?.[1] || ''} onChange={e => form.setValue('inspectorNames', [field.value?.[0] || '', e.target.value])} placeholder="2." className="mt-2" />
                            </div>
                        </FormControl>
                    </FormItem>
                )}
            />
        </CardContent>
      </Card>
    </>
  );
}
