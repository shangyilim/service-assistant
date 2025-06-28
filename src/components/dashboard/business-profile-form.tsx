
"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { app } from '@/lib/firebase';
import { getDatabase, ref, onValue, update } from 'firebase/database';
import { BusinessProfileSchema, type BusinessProfileFormValues } from '@/lib/schemas';
import type { BusinessInfo } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Building2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import moment from 'moment-timezone';

export function BusinessProfileForm() {
  const [loading, setLoading] = useState(true);
  const [timezones, setTimezones] = useState<string[]>([]);
  const { toast } = useToast();
  
  const form = useForm<BusinessProfileFormValues>({
    resolver: zodResolver(BusinessProfileSchema),
    defaultValues: {
      name: '',
      timezone: '',
    },
  });
  
  useEffect(() => {
    setTimezones(moment.tz.names());

    const rtdb = getDatabase(app);
    const businessInfoRef = ref(rtdb, 'businessInfo');
    
    const unsubscribe = onValue(businessInfoRef, (snapshot) => {
      const data = snapshot.val() as BusinessInfo | null;
      if (data) {
        form.reset({ name: data.name || '', timezone: data.timezone || '' });
      }
      setLoading(false);
    }, (error) => {
      console.error("Firebase RTDB read failed:", error);
      toast({
        title: "Error",
        description: "Failed to load business profile.",
        variant: "destructive",
      });
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [form, toast]);
  
  const onSubmit = async (values: BusinessProfileFormValues) => {
    try {
      const rtdb = getDatabase(app);
      const businessInfoRef = ref(rtdb, 'businessInfo');
      await update(businessInfoRef, { name: values.name, timezone: values.timezone });
      toast({
        title: "Success",
        description: "Business profile updated successfully.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      console.error("Error updating business profile:", error);
      toast({
        title: "Error",
        description: `Could not update business profile: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <div className="flex items-center space-x-2 mb-1">
          <Building2 className="h-7 w-7 text-primary" />
          <CardTitle className="text-2xl font-headline">Business Profile</CardTitle>
        </div>
        <CardDescription>
          This information is used by the AI assistant to identify your business and handle time-sensitive requests correctly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Company Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone</FormLabel>
                   <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a timezone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
