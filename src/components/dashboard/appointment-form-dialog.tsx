
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
import { AppointmentItemSchema, AppointmentItemFormValues } from "@/lib/schemas";
import type { AppointmentItem } from "@/types";
import React, { useEffect } from "react";
import { PlusCircle, Edit3 } from "lucide-react";

interface AppointmentFormDialogProps {
  item?: AppointmentItem | null; // For editing
  onSave: (data: AppointmentItemFormValues) => void;
  children?: React.ReactNode; // To use as DialogTrigger
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AppointmentFormDialog({ item, onSave, children, open, onOpenChange }: AppointmentFormDialogProps) {
  const form = useForm<AppointmentItemFormValues>({
    resolver: zodResolver(AppointmentItemSchema),
    defaultValues: item || {
      title: "",
      dateTime: "",
      location: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        ...item,
        location: item.location || "", // Ensure optional fields are handled
        notes: item.notes || "",
      });
    } else {
      form.reset({ title: "", dateTime: "", location: "", notes: "" });
    }
  }, [item, form, open]);

  const onSubmit = (values: AppointmentItemFormValues) => {
    onSave(values);
    if(onOpenChange) onOpenChange(false); 
  };

  const triggerContent = children || (
    <Button>
      {item ? <Edit3 className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
      {item ? "Edit Appointment" : "Add New Appointment"}
    </Button>
  );
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{triggerContent}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Appointment" : "Add New Appointment"}</DialogTitle>
          <DialogDescription>
            {item ? "Make changes to the appointment." : "Fill in the details for the new appointment."} Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Appointment Title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dateTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date & Time</FormLabel>
                  <FormControl>
                    <Input placeholder="YYYY-MM-DD HH:MM" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Conference Room A, Zoom Link" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any notes for the appointment..." {...field} rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : "Save Appointment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
