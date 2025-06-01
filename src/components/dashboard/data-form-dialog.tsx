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
import { DataItemSchema, DataItemFormValues } from "@/lib/schemas";
import type { DataItem } from "@/types";
import React, { useEffect } from "react";
import { PlusCircle, Edit3 } from "lucide-react";

interface DataFormDialogProps {
  item?: DataItem | null; // For editing
  onSave: (data: DataItemFormValues) => void;
  children?: React.ReactNode; // To use as DialogTrigger
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DataFormDialog({ item, onSave, children, open, onOpenChange }: DataFormDialogProps) {
  const form = useForm<DataItemFormValues>({
    resolver: zodResolver(DataItemSchema),
    defaultValues: item || {
      name: "",
      value: 0,
      category: "",
    },
  });

  useEffect(() => {
    if (item) {
      form.reset(item);
    } else {
      form.reset({ name: "", value: 0, category: "" });
    }
  }, [item, form, open]);


  const onSubmit = (values: DataItemFormValues) => {
    onSave(values);
    if(onOpenChange) onOpenChange(false); // Close dialog on successful save
  };

  const triggerContent = children || (
    <Button>
      {item ? <Edit3 className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
      {item ? "Edit Item" : "Add New Item"}
    </Button>
  );
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{triggerContent}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Data Item" : "Add New Data Item"}</DialogTitle>
          <DialogDescription>
            {item ? "Make changes to the item." : "Fill in the details for the new item."} Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Item Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input placeholder="Item Category" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
