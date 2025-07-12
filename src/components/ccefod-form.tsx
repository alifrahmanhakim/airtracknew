
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

const formSchema = z.object({
  adaPerubahan: z.enum(['YA', 'TIDAK']),
  usulanPerubahan: z.string().optional(),
  isiUsulan: z.string().optional(),
  annex: z.string().min(1, 'Annex is required'),
  annexReference: z.string().min(1, 'Annex Reference is required'),
  standardPractice: z.string().min(1, 'Standard or Recommended Practice is required'),
  legislationReference: z.string().min(1, 'State Legislation Reference is required'),
  implementationLevel: z.enum([
    "No difference",
    "More exacting or exceeds",
    "Different in character or other means of compliance",
    "Less protective or patially implemented or not implemented",
    "Not applicable",
    "No  Information  Provided",
    "Insufficient  Information  Provided"
  ]),
  differenceText: z.string().optional(),
  differenceReason: z.string().optional(),
  remarks: z.string().optional(),
  status: z.enum(['Existing', 'Draft', 'Final']),
  id: z.string().optional(), // To hold a unique ID for each record
});

export type CcefodFormValues = z.infer<typeof formSchema>;

const annexOptions = [
    "1. PERSONNEL LICENSING","2. RULES OF THE AIR","3. METEOROLOGICAL SERVICE FOR INTERNATIONAL AIR NAVIGATION","4. AERONAUTICAL CHARTS","5. UNITS OF MEASUREMENT TO BE USED IN AIR AND GROUND OPERATIONS","6. OPERATION OF AIRCRAFT, PART I INTERNATIONAL COMMERICIAL AIR TRANSPORT - AEROPLANES","6.  OPERATION OF AIRCRAFT, PART II INTERNATIONAL GENERAL  AVIATION - AEROPLANES","6. OPERATION OF AIRCRAFT, PART III INTERNATIONAL OPERATIONS -HELICOPTERS","6. OPERATION OF AIRCRAFT, PART IV - REMOTELY PILOTED AIRCRAFT SYSTEMS","7. AIRCRAFT NATIONALITY AND REGISTRATION MARKS","8. AIRWORTHINESS OF AIRCRAFT","9. FACILITATION","10. AERONAUTICAL TELECOMMUNICATIONS, VOLUME I RADIO NAVIGATION AIDS","10. AERONAUTICAL TELECOMMUNICATIONS, VOLUME II COMMUNICATION PROCEDURES","10. AERONAUTICAL TELECOMMUNICATIONS, VOLUME III PART I - DIGITAL DATA COMMUNICATION SYSTEM","10. AERONAUTICAL TELECOMMUNICATIONS, VOLUME V AERONAUTICAL RADIO FREQUENCY SPECTRUM UTILIZATION","10. AERONAUTICAL TEL, VOLUME VI  — COMMUNICATION SYSTEMS AND PROCEDURES RELATING TO RPAS","11. AIR TRAFFIC SERVICES","12. SEARCH AND RESCUE","13. AIRCRAFT ACCIDENT AND INCIDENT INVESTIGATION","14. AERODROMES, VOLUME I AERODROME DESIGN AND OPERATIONS","15. AERONAUTICAL INFORMATION SERVICES","16. ENVIRONMENTAL PROTECTION, VOLUME  I","16. ENVIRONMENTAL PROTECTION, VOLUME II AIRCRAFT ENGINE EMISSIONS","16. ENVIRONMENTAL PROTECTION, VOLUME III - AIRCRAFT CO2 EMISSIONS","16. ENVIRONMENTAL PROTECTION, VOLUME IV (CORSIA)","18. THE SAFE TRANSPORT OF DANGEROUS GOODS BY AIR","19. SAFETY MANAGEMENT"
];

const usulanPerubahanOptions = [
    "Level of Implementation","Text of Difference to be Notified to ICAO","Comments Including the Reason for the Difference","Remarks","Status"
];

const implementationLevelOptions = [
    "No difference","More exacting or exceeds","Different in character or other means of compliance","Less protective or patially implemented or not implemented","Not applicable","No  Information  Provided","Insufficient  Information  Provided"
];

const statusOptions = ["Existing","Draft","Final"];

type CcefodFormProps = {
  onFormSubmit: (data: CcefodFormValues) => void;
};

export function CcefodForm({ onFormSubmit }: CcefodFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<CcefodFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      adaPerubahan: 'TIDAK',
    },
  });

  const adaPerubahan = form.watch('adaPerubahan');

  const onSubmit = (data: CcefodFormValues) => {
    setIsLoading(true);
    const dataWithId = { ...data, id: `record-${Date.now()}` };
    
    // In a real app, you would send this to a server/API
    setTimeout(() => {
        onFormSubmit(dataWithId);
        setIsLoading(false);
        toast({
            title: 'Data Added Successfully!',
            description: 'Your CCEFOD monitoring data has been saved.',
        });
        form.reset({ adaPerubahan: 'TIDAK' });
    }, 1000);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4 p-4 border rounded-lg">
            <FormField
              control={form.control}
              name="adaPerubahan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apakah ada perubahan ?</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="YA">YA</SelectItem>
                      <SelectItem value="TIDAK">TIDAK</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {adaPerubahan === 'YA' && (
              <>
                <FormField
                  control={form.control}
                  name="usulanPerubahan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usulan perubahan</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Pilih usulan..." /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {usulanPerubahanOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                    control={form.control}
                    name="isiUsulan"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Isi Usulan</FormLabel>
                        <FormControl>
                            <Textarea
                            placeholder="Jelaskan isi usulan perubahan di sini..."
                            rows={8}
                            {...field}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
              </>
            )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="annex"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Annex</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Pilih Annex..." /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {annexOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="annexReference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Annex Reference</FormLabel>
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
            name="standardPractice"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Standard or Recommended Practice</FormLabel>
                <FormControl>
                    <Textarea
                        rows={10}
                        {...field}
                    />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        
        <FormField
            control={form.control}
            name="legislationReference"
            render={({ field }) => (
            <FormItem>
                <FormLabel>State Legislation, Regulation or Document Reference</FormLabel>
                <FormControl>
                <Input {...field} />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />

        <FormField
            control={form.control}
            name="implementationLevel"
            render={({ field }) => (
                <FormItem className="space-y-3">
                <FormLabel>Level of Implementation of SARP's</FormLabel>
                <FormControl>
                    <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                    >
                    {implementationLevelOptions.map(option => (
                        <FormItem key={option} className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                                <RadioGroupItem value={option} />
                            </FormControl>
                            <FormLabel className="font-normal">{option}</FormLabel>
                        </FormItem>
                    ))}
                    </RadioGroup>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />

        <FormField
            control={form.control}
            name="differenceText"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Text of Difference to be Notified to ICAO</FormLabel>
                <FormControl>
                    <Textarea
                        rows={5}
                        {...field}
                    />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        
        <FormField
            control={form.control}
            name="differenceReason"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Comments Including the Reason for the Difference</FormLabel>
                <FormControl>
                    <Textarea
                        rows={5}
                        {...field}
                    />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />

        <FormField
            control={form.control}
            name="remarks"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Remarks</FormLabel>
                <FormControl>
                    <Textarea
                        rows={5}
                        {...field}
                    />
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
                      <SelectTrigger><SelectValue placeholder="Pilih status..." /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {statusOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

        <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => form.reset({ adaPerubahan: 'TIDAK' })}>
                Reset
            </Button>
            <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit
            </Button>
        </div>
      </form>
    </Form>
  );
}
