
import { FaqDataTableClient } from "@/components/dashboard/faq-data-table-client";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Manage FAQs - Service Assistant',
  description: 'Add, edit, and manage your frequently asked questions.',
};

export default function FAQsPage() {
  return (
    <FaqDataTableClient />
  );
}
