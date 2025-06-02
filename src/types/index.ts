
export interface DataItem {
  id: string;
  name: string;
  value: number;
  category: string;
}

// Represents the user object in the authentication context
export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  userId?: string; // Added to store the ID of the user who created the FAQ
}

export interface AppointmentItem {
  id: string;
  title: string;
  dateTime: string; // e.g., "2024-07-30 14:00"
  location?: string;
  notes?: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  availability: string; // e.g., "Mon-Fri, 9am-5pm", "Weekends only", "By appointment"
}

