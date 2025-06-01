import { DataTableClient } from "@/components/dashboard/data-table-client";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard - Data Weaver',
  description: 'Manage your data items.',
};

export default function DashboardPage() {
  return (
    <DataTableClient />
  );
}
