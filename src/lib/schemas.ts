
import { z } from 'zod';

export const DataItemSchema = z.object({
  id: z.string().optional(), // Optional for new items, present for existing
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).max(50, { message: "Name must be 50 characters or less." }),
  value: z.coerce.number().min(0, { message: "Value must be a non-negative number." }),
  category: z.string().min(1, { message: "Category is required." }).max(30, { message: "Category must be 30 characters or less." }),
});

export type DataItemFormValues = z.infer<typeof DataItemSchema>;

export const FaqItemSchema = z.object({
  id: z.string().optional(),
  question: z.string().min(5, { message: "Question must be at least 5 characters." }).max(200, { message: "Question must be 200 characters or less." }),
  answer: z.string().min(10, { message: "Answer must be at least 10 characters." }).max(1000, { message: "Answer must be 1000 characters or less." }),
});

export type FaqItemFormValues = z.infer<typeof FaqItemSchema>;

export const AppointmentItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, { message: "Title must be at least 3 characters." }).max(100, { message: "Title must be 100 characters or less." }),
  dateTime: z.string().min(5, { message: "Date & Time is required." }).max(50, {message: "Date & Time must be 50 characters or less."}), // Example: "2023-10-26 14:30"
  location: z.string().max(100, { message: "Location must be 100 characters or less." }).optional().or(z.literal('')),
  notes: z.string().max(1000, { message: "Notes must be 1000 characters or less." }).optional().or(z.literal('')),
});

export type AppointmentItemFormValues = z.infer<typeof AppointmentItemSchema>;
