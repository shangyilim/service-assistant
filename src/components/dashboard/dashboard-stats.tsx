"use client";

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { startOfToday, endOfToday } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarCheck } from 'lucide-react';

export function DashboardStats() {
  const [todaysAppointmentsCount, setTodaysAppointmentsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const todayStart = startOfToday();
    const todayEnd = endOfToday();
    
    const appointmentsCollectionRef = collection(db, 'appointments');
    
    const q = query(
      appointmentsCollectionRef,
      where('date', '>=', todayStart),
      where('date', '<=', todayEnd)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setTodaysAppointmentsCount(snapshot.size);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching today's appointments count: ", error);
        // Optionally show an error state in the UI
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Appointments Today</CardTitle>
          <CalendarCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-4 w-48" />
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold">{todaysAppointmentsCount}</div>
              <p className="text-xs text-muted-foreground">
                Total appointments scheduled for today.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
