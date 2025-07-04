
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch"; // Import Switch
import { ServiceItemSchema, ServiceItemFormValues } from "@/lib/schemas";
import type { ServiceItem } from "@/types";
import React, { useEffect } from "react";
import { PlusCircle, Edit3 } from "lucide-react";

interface ServiceFormDialogProps {
  item?: ServiceItem | null; // For editing
  onSave: (data: ServiceItemFormValues) => void;
  children?: React.ReactNode; // To use as DialogTrigger
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ServiceFormDialog({ item, onSave, children, open, onOpenChange }: ServiceFormDialogProps) {
  const form = useForm<ServiceItemFormValues>({
    resolver: zodResolver(ServiceItemSchema),
    defaultValues: item ? 
      { ...item, availability: typeof item.availability === 'boolean' ? item.availability : true } : 
      { name: "", description: "", availability: true }, // Default to true for new items
  });

  useEffect(() => {
    if (open) { // Reset form only when dialog opens or item changes
      if (item) {
        form.reset({ ...item, availability: typeof item.availability === 'boolean' ? item.availability : true });
      } else {
        form.reset({ name: "", description: "", availability: true });
      }
    }
  }, [item, form, open]);

  const onSubmit = (values: ServiceItemFormValues) => {
    onSave(values);
    if(onOpenChange) onOpenChange(false); 
  };

  const triggerContent = children || (
    <Button>
      {item ? <Edit3 className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
      {item ? "Edit Service" : "Add New Service"}
    </Button>
  );
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{triggerContent}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Service" : "Add New Service"}</DialogTitle>
          <DialogDescription>
            {item ? "Make changes to the service." : "Fill in the details for the new service."} Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Web Development Consultation" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the service offered..." {...field} rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="availability"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Available</FormLabel>
                    <FormMessage />
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : "Save Service"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
