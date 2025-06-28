import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard - Service Assistant',
  description: 'View key statistics for your business.',
};

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-4">Dashboard Overview</h1>
      <DashboardStats />
    </div>
  );
}
