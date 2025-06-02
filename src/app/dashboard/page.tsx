import { DataTableClient } from "@/components/dashboard/data-table-client";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard - Service Assistant',
  description: 'Manage your data items.',
};

export default function DashboardPage() {
  return (
    <DataTableClient />
  );
}
