
import { ServiceDataTableClient } from "@/components/dashboard/service-data-table-client";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Manage Services - Data Weaver',
  description: 'Define, view, and manage your services.',
};

export default function ServicesPage() {
  return (
    <ServiceDataTableClient />
  );
}
