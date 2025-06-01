import { z } from 'zod';

export const DataItemSchema = z.object({
  id: z.string().optional(), // Optional for new items, present for existing
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).max(50, { message: "Name must be 50 characters or less." }),
  value: z.coerce.number().min(0, { message: "Value must be a non-negative number." }),
  category: z.string().min(1, { message: "Category is required." }).max(30, { message: "Category must be 30 characters or less." }),
});

export type DataItemFormValues = z.infer<typeof DataItemSchema>;
