

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
import { CalendarIcon, Plus, Trash2, Edit, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Combobox, ComboboxOption } from './ui/combobox';
import { useState } from 'react';
import { SignaturePadDialog } from './signature-pad';
import Image from 'next/image';
import { gapAnalysisFormSchema } from '@/lib/schemas';
import { Checkbox } from './ui/checkbox';


export type GapAnalysisFormValues = z.infer<typeof gapAnalysisFormSchema>;

const complianceStatusOptions: GapAnalysisFormValues['evaluations'][0]['complianceStatus'][] = [
    'No Differences',
    'More Exacting or Exceeds',
    'Different in character or other means of compliance',
    'Less protective or partially implemented or not implemented',
    'Not Applicable',
];

const actionRequiredItems = [
  { id: 'disapproval', label: 'Notify any disapproval before' },
  { id: 'differences', label: 'Notify any differences and compliance before' },
  { id: 'efod', label: 'Consider the use of the Electronic Filing of Differences (EFOD) System for notification of differences and compliance' },
] as const;

const implementationTaskOptions: ComboboxOption[] = [
    { value: 'Identification of the rule-making process necessary to transpose the modified ICAO provisions into the national regulations', label: '1. Identification of the rule-making process necessary to transpose the modified ICAO provisions into the national regulations' },
    { value: 'Establishment of a national implementation plan that takes into account the modified ICAO provisions', label: '2. Establishment of a national implementation plan that takes into account the modified ICAO provisions' },
    { value: 'Drafting of the modification(s) to the national regulations and means of compliance', label: '3. Drafting of the modification(s) to the national regulations and means of compliance' },
    { value: 'Official adoption of the national regulations and means of compliance', label: '4. Official adoption of the national regulations and means of compliance' },
    { value: 'Filing of State differences with ICAO, if necessary', label: '5. Filing of State differences with ICAO, if necessary' },
    { value: 'Operator to develop risk assessment process', label: '6. Operator to develop risk assessment process' },
    { value: 'Review of Operators risk assessment process to ensure confidence in their interpretation of the provision and associated guidance', label: '7. Review of Operators risk assessment process to ensure confidence in their interpretation of the provision and associated guidance' },
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

  const { fields: inspectorFields, append: appendInspector, remove: removeInspector, update: updateInspector } = useFieldArray({
      control: form.control,
      name: "inspectors",
  });

  const { fields: verifierFields, append: appendVerifier, remove: removeVerifier, update: updateVerifier } = useFieldArray({
      control: form.control,
      name: "verifiers",
  });
  
  const { fields: actionFields } = useFieldArray({
    control: form.control,
    name: "actionRequired",
  });
  
  const { fields: taskFields, append: appendTask, remove: removeTask } = useFieldArray({
    control: form.control,
    name: "implementationTasks",
  });

  return (
    <>
      <Card>
        <CardHeader><CardTitle>A. GENERAL</CardTitle></CardHeader>
        <CardContent className="space-y-4">
            <FormField control={form.control} name="typeOfStateLetter" render={({ field }) => ( <FormItem> <FormLabel>Type of State Letter</FormLabel> <FormControl><Input autoComplete="off" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="slReferenceNumber" render={({ field }) => ( <FormItem> <FormLabel>SL Reference Number</FormLabel> <FormControl><Input autoComplete="off" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
              <FormField control={form.control} name="slReferenceDate" render={({ field }) => ( <FormItem> <FormLabel>SL Reference Date</FormLabel> <FormControl><Input autoComplete="off" placeholder="DD-MM-YYYY" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
            </div>
            <FormField control={form.control} name="subject" render={({ field }) => ( <FormItem> <FormLabel>Subject</FormLabel> <FormControl><Textarea autoComplete="off" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
             <FormField
              control={form.control}
              name="dateOfEvaluation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Evaluation</FormLabel>
                   <FormControl><Input autoComplete="off" placeholder="DD-MM-YYYY" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormItem>
                <FormLabel>Action required</FormLabel>
                <div className="space-y-4 rounded-md border p-4">
                    {actionFields.map((item, index) => (
                        <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <FormField
                                control={form.control}
                                name={`actionRequired.${index}.checked`}
                                render={({ field }) => (
                                    <FormItem className="flex items-center gap-2 flex-1">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormLabel className="font-normal leading-snug">
                                            {actionRequiredItems[index].label}
                                        </FormLabel>
                                    </FormItem>
                                )}
                            />
                            {item.id !== 'efod' && (
                                <FormField
                                    control={form.control}
                                    name={`actionRequired.${index}.date`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input
                                                    autoComplete="off"
                                                    type="text"
                                                    placeholder="DD-MM-YYYY"
                                                    disabled={!form.watch(`actionRequired.${index}.checked`)}
                                                    {...field}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>
                    ))}
                </div>
                <FormMessage>{form.formState.errors.actionRequired?.root?.message}</FormMessage>
            </FormItem>
            <fieldset className="border p-4 rounded-md">
                <legend className="text-sm font-medium px-1">Standardization Process</legend>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                    <FormField control={form.control} name="effectiveDate" render={({ field }) => ( 
                    <FormItem>
                        <FormLabel>Effective Date</FormLabel>
                        <FormControl><Input autoComplete="off" placeholder="DD-MM-YYYY" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem> 
                    )}/>
                    <FormField control={form.control} name="applicabilityDate" render={({ field }) => ( 
                    <FormItem>
                        <FormLabel>Applicability Date</FormLabel>
                        <FormControl><Input autoComplete="off" placeholder="DD-MM-YYYY" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem> 
                    )}/>
                    <FormField
                    control={form.control}
                    name="embeddedApplicabilityDate"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Embedded applicability date(s)</FormLabel>
                        <FormControl><Input autoComplete="off" placeholder="DD-MM-YYYY" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
            </fieldset>
            {/* Other fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <FormField control={form.control} name="annex" render={({ field }) => ( <FormItem> <FormLabel>ANNEX</FormLabel> <FormControl><Input autoComplete="off" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
              <FormField control={form.control} name="letterName" render={({ field }) => ( <FormItem> <FormLabel>Nama Surat</FormLabel> <FormControl><Input autoComplete="off" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
              <FormField
                control={form.control}
                name="implementationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Pelaksanaan</FormLabel>
                    <FormControl><Input autoComplete="off" placeholder="DD-MM-YYYY" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField control={form.control} name="letterSubject" render={({ field }) => ( <FormItem> <FormLabel>Perihal Surat</FormLabel> <FormControl><Textarea autoComplete="off" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>B. Implementation Task List (if applicable)</CardTitle>
             <Button type="button" size="sm" onClick={() => appendTask({ id: `task-${Date.now()}`, description: '', estimatedComplianceDate: '' })}>
                <Plus className="mr-2 h-4 w-4" /> Add Task
            </Button>
        </CardHeader>
        <CardContent className="space-y-4">
             {taskFields.map((field, index) => (
                <div key={field.id} className="border p-4 rounded-lg relative space-y-4">
                    <h4 className="font-semibold text-lg">Task: {index + 1}</h4>
                     <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => removeTask(index)}><Trash2 className="h-4 w-4" /></Button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <FormField
                            control={form.control}
                            name={`implementationTasks.${index}.description`}
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Task Description</FormLabel>
                                    <Combobox
                                        options={implementationTaskOptions}
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Select or type a task..."
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name={`implementationTasks.${index}.estimatedComplianceDate`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Estimated Compliance Date</FormLabel>
                                    <FormControl>
                                        <Input autoComplete="off" placeholder="DD-MM-YYYY" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
            ))}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>C. EVALUATION</CardTitle>
            <Button type="button" size="sm" onClick={() => append({ id: `eval-${Date.now()}`, icaoSarp: '', review: '', complianceStatus: 'No Differences', casrAffected: '', status: 'OPEN', followUp: '', proposedAmendment: '', reasonOrRemark: '' })}>
                <Plus className="mr-2 h-4 w-4" /> Add Evaluation Item
            </Button>
        </CardHeader>
        <CardContent className="space-y-6">
            {fields.map((field, index) => (
                <div key={field.id} className="border p-4 rounded-lg relative space-y-4">
                    <h4 className="font-semibold text-lg">Number: {index + 1}</h4>
                    <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                    <FormField control={form.control} name={`evaluations.${index}.icaoSarp`} render={({ field }) => ( <FormItem> <FormLabel>ICAO SARP</FormLabel> <FormControl><Textarea autoComplete="off" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                    <FormField control={form.control} name={`evaluations.${index}.review`} render={({ field }) => ( <FormItem> <FormLabel>REVIEW</FormLabel> <FormControl><Textarea autoComplete="off" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                    <FormField control={form.control} name={`evaluations.${index}.followUp`} render={({ field }) => ( <FormItem> <FormLabel>Follow Up</FormLabel> <FormControl><Textarea placeholder="Follow up actions..." {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                    <FormField control={form.control} name={`evaluations.${index}.proposedAmendment`} render={({ field }) => ( <FormItem> <FormLabel>Proposed Amendment</FormLabel> <FormControl><Textarea placeholder="Details of the proposed amendment..." {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                    <FormField control={form.control} name={`evaluations.${index}.reasonOrRemark`} render={({ field }) => ( <FormItem> <FormLabel>Reason/Remark</FormLabel> <FormControl><Textarea placeholder="Reason or remark for the evaluation..." {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                     <FormField
                        control={form.control}
                        name={`evaluations.${index}.casrAffected`}
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
                    <FormField control={form.control} name={`evaluations.${index}.complianceStatus`} render={({ field }) => (
                        <FormItem>
                            <FormLabel>PROPOSED DGCA COMPLIANCE/ DIFFERENCES STATUS</FormLabel>
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
                    <FormField control={form.control} name={`evaluations.${index}.status`} render={({ field }) => (
                        <FormItem>
                            <FormLabel>Status Item</FormLabel>
                             <FormControl>
                                <RadioGroup onValueChange={field.onChange} value={field.value} className="flex items-center space-x-4">
                                    <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="OPEN" /></FormControl><FormLabel className="font-normal">OPEN</FormLabel></FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="CLOSED" /></FormControl><FormLabel className="font-normal">CLOSED</FormLabel></FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                </div>
            ))}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle>D. SUMMARY</CardTitle></CardHeader>
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
            <FormField control={form.control} name="summary" render={({ field }) => ( <FormItem> <FormLabel>SUMMARY</FormLabel> <FormControl><Textarea autoComplete="off" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader><CardTitle>E. DGCA AUTHORIZATION</CardTitle></CardHeader>
        <CardContent className="space-y-6">
            <div>
              <FormLabel>Inspector Names & Signatures</FormLabel>
              <div className="space-y-3 mt-2">
                {inspectorFields.map((field, index) => {
                  const signature = form.watch(`inspectors.${index}.signature`);
                  return (
                    <div key={field.id} className="flex items-start gap-4 p-4 border rounded-md">
                        <div className='flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4'>
                          <FormField
                              control={form.control}
                              name={`inspectors.${index}.name`}
                              render={({ field }) => (
                                  <FormItem>
                                  <FormLabel className="text-xs">Inspector Name {index + 1}</FormLabel>
                                  <FormControl>
                                      <Input autoComplete="off" placeholder="Full Name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                  </FormItem>
                              )}
                          />
                          <FormItem>
                            <FormLabel className="text-xs">Digital Signature</FormLabel>
                             <FormControl>
                                <div>
                                {signature ? (
                                    <div className='relative group'>
                                        <div className="bg-white p-2 border rounded-md aspect-video max-w-[200px]">
                                            <Image src={signature} alt="Signature" width={200} height={100} className='w-full h-auto' />
                                        </div>
                                        <SignaturePadDialog
                                            onSave={(newSignature) => {
                                                const currentName = form.getValues(`inspectors.${index}.name`);
                                                updateInspector(index, { id: field.id, name: currentName, signature: newSignature });
                                            }}
                                            trigger={
                                                <Button size="icon" variant="outline" className='absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity'>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            }
                                        />
                                    </div>
                                ) : (
                                    <SignaturePadDialog
                                        onSave={(newSignature) => {
                                             const currentName = form.getValues(`inspectors.${index}.name`);
                                            updateInspector(index, { id: field.id, name: currentName, signature: newSignature });
                                        }}
                                        trigger={
                                            <Button type="button" variant="outline">Add Signature</Button>
                                        }
                                    />
                                )}
                                </div>
                             </FormControl>
                            <FormMessage />
                           </FormItem>
                        </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeInspector(index)} className='text-destructive hover:text-destructive'>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
                 <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendInspector({ id: `inspector-${Date.now()}`, name: '', signature: '' })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Inspector
                </Button>
              </div>
            </div>

            <div>
              <FormLabel>Verified by</FormLabel>
              <div className="space-y-3 mt-2">
                {verifierFields.map((field, index) => {
                  const signature = form.watch(`verifiers.${index}.signature`);
                  return (
                    <div key={field.id} className="flex items-start gap-4 p-4 border rounded-md">
                        <div className='flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4'>
                          <FormField
                              control={form.control}
                              name={`verifiers.${index}.name`}
                              render={({ field }) => (
                                  <FormItem>
                                  <FormLabel className="text-xs">Sub-directorate Name {index + 1}</FormLabel>
                                  <FormControl>
                                      <Input autoComplete="off" placeholder="Full Name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                  </FormItem>
                              )}
                          />
                           <FormField
                              control={form.control}
                              name={`verifiers.${index}.date`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Date</FormLabel>
                                   <FormControl><Input autoComplete="off" placeholder="DD-MM-YYYY" {...field} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          <FormItem>
                            <FormLabel className="text-xs">Digital Signature</FormLabel>
                             <FormControl>
                                <div>
                                {signature ? (
                                    <div className='relative group'>
                                        <div className="bg-white p-2 border rounded-md aspect-video max-w-[200px]">
                                            <Image src={signature} alt="Signature" width={200} height={100} className='w-full h-auto' />
                                        </div>
                                        <SignaturePadDialog
                                            onSave={(newSignature) => {
                                                const currentName = form.getValues(`verifiers.${index}.name`);
                                                const currentDate = form.getValues(`verifiers.${index}.date`);
                                                updateVerifier(index, { id: field.id, name: currentName, date: currentDate, signature: newSignature });
                                            }}
                                            trigger={
                                                <Button size="icon" variant="outline" className='absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity'>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            }
                                        />
                                    </div>
                                ) : (
                                    <SignaturePadDialog
                                        onSave={(newSignature) => {
                                            const currentName = form.getValues(`verifiers.${index}.name`);
                                            const currentDate = form.getValues(`verifiers.${index}.date`);
                                            updateVerifier(index, { id: field.id, name: currentName, date: currentDate, signature: newSignature });
                                        }}
                                        trigger={
                                            <Button type="button" variant="outline">Add Signature</Button>
                                        }
                                    />
                                )}
                                </div>
                             </FormControl>
                            <FormMessage />
                           </FormItem>
                        </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeVerifier(index)} className='text-destructive hover:text-destructive'>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
                 <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendVerifier({ id: `verifier-${Date.now()}`, name: '', signature: '', date: '' })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Verifier
                </Button>
              </div>
            </div>
        </CardContent>
      </Card>
    </>
  );
}
