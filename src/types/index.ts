
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
  embedding?: number[] | null | undefined; // Allow null for initial state
}

export interface AppointmentItem {
  id: string;
  title: string;
  name?: string;
  phoneNumber: string;
  date: Date;
  startTime: string; // e.g., "14:00"
  endTime: string; // e.g., "15:00"
  notes?: string;
  userId?: string;
  temporary?: boolean;
}

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  availability: boolean; // Changed from string to boolean
  userId?: string; // ID of the user who created the service
  embedding?: number[] | null | undefined; // For storing generated embeddings
}

export interface FirestoreCustomer{
    sessionId?: string;
    name?: string;
    phoneNumber?: string;
}
export interface BusinessInfo {
    name?: string;
    phoneNumber?: string;
    timezone?: string;
}
