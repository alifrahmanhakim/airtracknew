
'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
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
import { CalendarIcon, Plus, Trash2, Loader2 } from 'lucide-react';
import type { z } from 'zod';
import { lawEnforcementFormSchema } from '@/lib/schemas';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '../ui/calendar';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { useToast } from '@/hooks/use-toast';
import { addLawEnforcementRecord } from '@/lib/actions/law-enforcement';

type LawEnforcementFormValues = z.infer<typeof lawEnforcementFormSchema>;

export function LawEnforcementForm() {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const form = useForm<LawEnforcementFormValues>({
        resolver: zodResolver(lawEnforcementFormSchema),
        defaultValues: {
            impositionType: 'aoc',
            sanctionedAoc: [{ value: "" }],
            sanctionedPersonnel: [{ value: "" }],
            sanctionedOrganization: [{ value: "" }],
            sanctionType: '',
            refLetter: '',
        },
    });
    
    const impositionType = form.watch('impositionType');
    
    const { fields: aocFields, append: appendAoc, remove: removeAoc } = useFieldArray({
      control: form.control,
      name: "sanctionedAoc",
    });

    const { fields: personnelFields, append: appendPersonnel, remove: removePersonnel } = useFieldArray({
      control: form.control,
      name: "sanctionedPersonnel",
    });

    const { fields: orgFields, append: appendOrg, remove: removeOrg } = useFieldArray({
      control: form.control,
      name: "sanctionedOrganization",
    });

    async function onSubmit(data: LawEnforcementFormValues) {
        setIsSubmitting(true);
        const result = await addLawEnforcementRecord(data);
        setIsSubmitting(false);

        if (result.success) {
            toast({ title: 'Record Added', description: 'The new sanction record has been added.' });
            form.reset();
        } else {
            toast({
                variant: 'destructive',
                title: 'Error Adding Record',
                description: result.error || 'An unknown error occurred.',
            });
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                 <Card>
                    <CardHeader>
                        <CardTitle>Add New Sanction</CardTitle>
                        <CardDescription>Fill out the form to add a new sanction record.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                            <FormField
                                control={form.control}
                                name="dateLetter"
                                render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Date Letter</FormLabel>
                                    <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                    </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField control={form.control} name="refLetter" render={({ field }) => (<FormItem><FormLabel>Ref. Letter</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="sanctionType" render={({ field }) => (<FormItem><FormLabel>Sanction Type</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        
                        <FormField
                            control={form.control}
                            name="impositionType"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Imposition of Sanction to</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select who the sanction is for..." />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    <SelectItem value="aoc">AOC</SelectItem>
                                    <SelectItem value="personnel">Personnel</SelectItem>
                                    <SelectItem value="organization">Organization</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />

                        {impositionType === 'aoc' && (
                            <div>
                                <FormLabel>AOC</FormLabel>
                                <div className="space-y-4 mt-2">
                                {aocFields.map((field, index) => (
                                    <div key={field.id} className="flex items-center gap-2">
                                    <FormField
                                        control={form.control}
                                        name={`sanctionedAoc.${index}.value`}
                                        render={({ field }) => (
                                        <FormItem className="flex-grow">
                                            <FormControl>
                                            <Input {...field} placeholder={`AOC ${index + 1}`} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    {aocFields.length > 1 && (
                                        <Button type="button" variant="destructive" size="icon" onClick={() => removeAoc(index)}>
                                        <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={() => appendAoc({ value: "" })}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add AOC
                                </Button>
                                </div>
                            </div>
                        )}

                        {impositionType === 'personnel' && (
                        <div>
                            <FormLabel>Personnel</FormLabel>
                            <div className="space-y-4 mt-2">
                            {personnelFields.map((field, index) => (
                                <div key={field.id} className="flex items-center gap-2">
                                <FormField
                                    control={form.control}
                                    name={`sanctionedPersonnel.${index}.value`}
                                    render={({ field }) => (
                                    <FormItem className="flex-grow">
                                        <FormControl>
                                        <Input {...field} placeholder={`Personnel ${index + 1} Name & ID`} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                {personnelFields.length > 1 && (
                                    <Button type="button" variant="destructive" size="icon" onClick={() => removePersonnel(index)}>
                                    <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={() => appendPersonnel({ value: "" })}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Personnel
                            </Button>
                            </div>
                        </div>
                        )}
                        
                        {impositionType === 'organization' && (
                            <div>
                                <FormLabel>Organization</FormLabel>
                                <div className="space-y-4 mt-2">
                                {orgFields.map((field, index) => (
                                    <div key={field.id} className="flex items-center gap-2">
                                    <FormField
                                        control={form.control}
                                        name={`sanctionedOrganization.${index}.value`}
                                        render={({ field }) => (
                                        <FormItem className="flex-grow">
                                            <FormControl>
                                            <Input {...field} placeholder={`Organization ${index + 1}`} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    {orgFields.length > 1 && (
                                        <Button type="button" variant="destructive" size="icon" onClick={() => removeOrg(index)}>
                                        <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={() => appendOrg({ value: "" })}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Organization
                                </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-end">
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Record
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </Form>
    );
}
