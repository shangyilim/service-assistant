
"use client";

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { PageHeader } from '@/components/common/page-header';
import { Logo } from '@/components/common/logo';
import { Loader2, Home, HelpCircle, CalendarDays, Briefcase } from 'lucide-react'; // Added Briefcase
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from '@/components/ui/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  if (loading || (!loading && !user)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4 border-b">
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/dashboard'}
                tooltip="Dashboard"
              >
                <Link href="/dashboard">
                  <Home />
                  Dashboard
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/dashboard/faqs'}
                tooltip="FAQs"
              >
                <Link href="/dashboard/faqs">
                  <HelpCircle />
                  FAQs
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/dashboard/appointments'}
                tooltip="Appointments"
              >
                <Link href="/dashboard/appointments">
                  <CalendarDays />
                  Appointments
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/dashboard/services'}
                tooltip="Services"
              >
                <Link href="/dashboard/services">
                  <Briefcase />
                  Services
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <PageHeader />
        <main className="flex-1 p-4 md:p-6 bg-muted/30">
          {children}
        </main>
        <footer className="py-6 text-center text-sm text-muted-foreground border-t bg-background">
          {year ? `© ${year} Data Weaver. Your data, woven with precision.` : 'Data Weaver. Your data, woven with precision.'}
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
