
import { AppointmentDataTableClient } from "@/components/dashboard/appointment-data-table-client";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Manage Appointments - Service Assistant',
  description: 'Schedule, view, and manage your appointments.',
};

export default function AppointmentsPage() {
  return (
    <AppointmentDataTableClient />
  );
}
