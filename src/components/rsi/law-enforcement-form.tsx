
'use client';

import * as React from 'react';
import { useForm, useFieldArray, type UseFormReturn } from 'react-hook-form';
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
import { CalendarIcon, Plus, Trash2, Check, ChevronsUpDown } from 'lucide-react';
import type { z } from 'zod';
import { lawEnforcementFormSchema } from '@/lib/schemas';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '../ui/calendar';
import { Button } from '../ui/button';
import { aocOptions } from '@/lib/data';

type LawEnforcementFormValues = z.infer<typeof lawEnforcementFormSchema>;

type LawEnforcementFormProps = {
  form: UseFormReturn<LawEnforcementFormValues>;
  isSubmitting: boolean;
};

const AOCCombobox = ({ field }: { field: any }) => {
    const [open, setOpen] = React.useState(false);
  
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant="outline"
              role="combobox"
              className={cn(
                "w-full justify-between",
                !field.value && "text-muted-foreground"
              )}
            >
              {field.value
                ? aocOptions.find(
                    (option) => option.value === field.value
                  )?.label ?? field.value
                : "Select or type an AOC"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Search AOC..." 
              onValueChange={(search) => {
                // Allow manual input by updating form value directly
                if (!aocOptions.some(o => o.value.toLowerCase() === search.toLowerCase())) {
                    field.onChange(search);
                }
              }}
            />
            <CommandList>
              <CommandEmpty>No AOC found.</CommandEmpty>
              <CommandGroup>
                {aocOptions.map((option) => (
                  <CommandItem
                    value={option.label}
                    key={option.value}
                    onSelect={() => {
                      field.onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        option.value === field.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
};


export function LawEnforcementForm({ form, isSubmitting }: LawEnforcementFormProps) {
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

  return (
    <Form {...form}>
        <div className="space-y-6">
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
                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")} disabled={isSubmitting}>
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
            <FormField control={form.control} name="refLetter" render={({ field }) => (<FormItem><FormLabel>Ref. Letter</FormLabel><FormControl><Input {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="sanctionType" render={({ field }) => (<FormItem><FormLabel>Sanction Type</FormLabel><FormControl><Input {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
          </div>

          <FormField
            control={form.control}
            name="impositionType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Imposition of Sanction to</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
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
                             <AOCCombobox field={field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {aocFields.length > 1 && (
                      <Button type="button" variant="destructive" size="icon" onClick={() => removeAoc(index)} disabled={isSubmitting}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => appendAoc({ value: "" })} disabled={isSubmitting}>
                  <Plus className="mr-2 h-4 w-4" /> Add AOC
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
                            <Input {...field} placeholder={`Personnel ${index + 1} Name & ID`} disabled={isSubmitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {personnelFields.length > 1 && (
                      <Button type="button" variant="destructive" size="icon" onClick={() => removePersonnel(index)} disabled={isSubmitting}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => appendPersonnel({ value: "" })} disabled={isSubmitting}>
                  <Plus className="mr-2 h-4 w-4" /> Add Personnel
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
                            <Input {...field} placeholder={`Organization ${index + 1}`} disabled={isSubmitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {orgFields.length > 1 && (
                      <Button type="button" variant="destructive" size="icon" onClick={() => removeOrg(index)} disabled={isSubmitting}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => appendOrg({ value: "" })} disabled={isSubmitting}>
                  <Plus className="mr-2 h-4 w-4" /> Add Organization
                </Button>
              </div>
            </div>
          )}
        </div>
    </Form>
  );
}
