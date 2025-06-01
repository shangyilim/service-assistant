
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
}
