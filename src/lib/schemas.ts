
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

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const AppointmentItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, { message: "Title must be at least 3 characters." }).max(100, { message: "Title must be 100 characters or less." }),
  name: z.string().min(2, { message: "Client name must be at least 2 characters." }).max(100, { message: "Client name must be 100 characters or less." }),
  phoneNumber: z.string().min(7, { message: "Phone number must be at least 7 characters." }).max(20, { message: "Phone number must be 20 characters or less." }),
  date: z.date({
    required_error: "A date is required.",
  }),
  startTime: z.string().regex(timeRegex, { message: "Invalid start time format. Use HH:MM." }),
  endTime: z.string().regex(timeRegex, { message: "Invalid end time format. Use HH:MM." }),
  notes: z.string().max(1000, { message: "Notes must be 1000 characters or less." }).optional().or(z.literal('')),
}).refine(data => data.endTime > data.startTime, {
  message: "End time must be after start time.",
  path: ["endTime"],
});


export type AppointmentItemFormValues = z.infer<typeof AppointmentItemSchema>;

export const ServiceItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, { message: "Service name must be at least 3 characters." }).max(100, { message: "Service name must be 100 characters or less." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }).max(1000, { message: "Description must be 1000 characters or less." }),
  availability: z.boolean().default(true), // Changed to boolean, default true
});

export type ServiceItemFormValues = z.infer<typeof ServiceItemSchema>;

export const BusinessProfileSchema = z.object({
  name: z.string().min(2, "Business name must be at least 2 characters.").max(100, "Business name must be 100 characters or less."),
  phoneNumber: z.string().min(10, "Please enter a valid phone number.").max(20, "Phone number is too long.").optional().or(z.literal('')),
  timezone: z.string().min(1, { message: "Timezone is required." }),
});

export type BusinessProfileFormValues = z.infer<typeof BusinessProfileSchema>;
