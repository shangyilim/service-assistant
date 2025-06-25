
"use client";

import React, { useState, useMemo, useEffect } from "react";
import type { AppointmentItem } from "@/types";
import { AppointmentItemFormValues } from "@/lib/schemas";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AppointmentFormDialog } from "./appointment-form-dialog";
import { useToast } from "@/hooks/use-toast";
import { MoreHorizontal, PlusCircle, Trash2, Edit3, Search, Loader2, CalendarDays, CalendarPlus, User, Phone, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  onSnapshot,
  orderBy,
  type Timestamp,
} from "firebase/firestore";
import { format } from "date-fns";

export function AppointmentDataTableClient() {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [editingAppointmentItem, setEditingAppointmentItem] = useState<AppointmentItem | null>(null);
  const [isAppointmentFormOpen, setIsAppointmentFormOpen] = useState(false);
  const [appointmentSearchTerm, setAppointmentSearchTerm] = useState("");
  const [appointmentItemToDelete, setAppointmentItemToDelete] = useState<AppointmentItem | null>(null);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const appointmentsCollectionRef = useMemo(() => {
    return collection(db, "appointments");
  }, []);

  useEffect(() => {
    if (authLoading || !user) {
      setAppointments([]);
      setIsLoadingData(false);
      return;
    }

    setIsLoadingData(true);
    const q = query(appointmentsCollectionRef, orderBy("date"));
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const items = querySnapshot.docs.map(doc => {
          const data = doc.data();
          
          const formatTime = (timeValue: any): string => {
            if (!timeValue) return "";
            // Check if it's a Firestore Timestamp
            if (typeof timeValue.toDate === 'function') {
              return format(timeValue.toDate(), "HH:mm");
            }
            // Assume it's already a string if not a Timestamp
            return String(timeValue);
          };

          return {
            id: doc.id,
            ...data,
            date: (data.date as Timestamp).toDate(),
            startTime: formatTime(data.startTime),
            endTime: formatTime(data.endTime),
          } as AppointmentItem;
        });
        setAppointments(items);
        setIsLoadingData(false);
      }, 
      (error) => {
        console.error("Error fetching appointments: ", error);
        toast({ title: "Error", description: "Could not fetch appointments.", variant: "destructive" });
        setIsLoadingData(false);
      }
    );

    return () => unsubscribe();
  }, [appointmentsCollectionRef, toast, user, authLoading]);

  const handleSaveAppointmentItem = async (formValues: AppointmentItemFormValues) => {
    if (!user) {
      toast({ title: "Error", description: "User not authenticated or collection not available.", variant: "destructive" });
      return;
    }

    // Combine date and time strings into full Date objects for Firestore
    const { date, startTime, endTime, ...restOfValues } = formValues;

    const startDate = new Date(date);
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    startDate.setHours(startHours, startMinutes, 0, 0);

    const endDate = new Date(date);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    endDate.setHours(endHours, endMinutes, 0, 0);
    
    const dataToSave = {
      ...restOfValues,
      date, // Keep the original date for date-only queries
      userId: user.id,
      startTime: startDate, // This will be converted to a Timestamp
      endTime: endDate,     // This will be converted to a Timestamp
    };

    try {
      if (editingAppointmentItem && editingAppointmentItem.id) {
        const itemDocRef = doc(appointmentsCollectionRef, editingAppointmentItem.id);
        await updateDoc(itemDocRef, dataToSave);
        toast({ title: "Success", description: "Appointment updated successfully." });
      } else {
        await addDoc(appointmentsCollectionRef, dataToSave);
        toast({ title: "Success", description: "Appointment added successfully." });
      }
      setEditingAppointmentItem(null);
      setIsAppointmentFormOpen(false);
    } catch (error) {
      console.error("Error saving appointment: ", error);
      toast({ title: "Error", description: "Could not save appointment.", variant: "destructive" });
    }
  };

  const openEditAppointmentDialog = (item: AppointmentItem) => {
    setEditingAppointmentItem(item);
    setIsAppointmentFormOpen(true);
  };

  const openAddAppointmentDialog = () => {
    setEditingAppointmentItem(null);
    setIsAppointmentFormOpen(true);
  };
  
  const confirmDeleteAppointmentItem = (item: AppointmentItem) => {
    setAppointmentItemToDelete(item);
  };

  const handleDeleteAppointmentItem = async () => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to delete appointments.", variant: "destructive" });
      setAppointmentItemToDelete(null);
      return;
    }
    if (!appointmentItemToDelete || !appointmentItemToDelete.id) return;

    try {
      const itemDocRef = doc(appointmentsCollectionRef, appointmentItemToDelete.id);
      await deleteDoc(itemDocRef);
      toast({ title: "Success", description: `Appointment "${appointmentItemToDelete.title}" deleted.` });
      setAppointmentItemToDelete(null);
    } catch (error) {
      console.error("Error deleting appointment: ", error);
      toast({ title: "Error", description: "Could not delete appointment.", variant: "destructive" });
      setAppointmentItemToDelete(null);
    }
  };

  const filteredAppointments = useMemo(() => {
    if (!appointmentSearchTerm) return appointments;
    const lowerSearchTerm = appointmentSearchTerm.toLowerCase();
    return appointments.filter(item =>
      item.title.toLowerCase().includes(lowerSearchTerm) ||
      (item.name && item.name.toLowerCase().includes(lowerSearchTerm)) ||
      item.phoneNumber.toLowerCase().includes(lowerSearchTerm) ||
      (item.notes && item.notes.toLowerCase().includes(lowerSearchTerm)) ||
      `${format(item.date, "PPP")} ${item.startTime} - ${item.endTime}`.toLowerCase().includes(lowerSearchTerm)
    );
  }, [appointments, appointmentSearchTerm]);

  if (authLoading) {
    return (
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <CalendarDays className="h-7 w-7 text-primary" />
              <CardTitle className="text-2xl font-headline">Manage Appointments</CardTitle>
            </div>
            <CardDescription>Schedule, view, edit, or delete your appointments.</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 items-center">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search appointments..."
                value={appointmentSearchTerm}
                onChange={(e) => setAppointmentSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-[250px]"
              />
            </div>
            <Button onClick={openAddAppointmentDialog} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Appointment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isAppointmentFormOpen && (
            <AppointmentFormDialog
              item={editingAppointmentItem}
              onSave={handleSaveAppointmentItem}
              open={isAppointmentFormOpen}
              onOpenChange={setIsAppointmentFormOpen}
            />
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[25%]">Title</TableHead>
                  <TableHead className="w-[20%]"><User className="inline-block h-4 w-4 mr-1" />Client</TableHead>
                  <TableHead className="w-[15%]"><Phone className="inline-block h-4 w-4 mr-1" />Phone</TableHead>
                  <TableHead className="w-[25%]"><Clock className="inline-block h-4 w-4 mr-1" />Date & Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingData ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                        Loading appointments...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredAppointments.length > 0 ? (
                  filteredAppointments.map(item => (
                    <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium align-top">{item.title}</TableCell>
                      <TableCell className="align-top">{item.name}</TableCell>
                      <TableCell className="align-top">{item.phoneNumber}</TableCell>
                      <TableCell className="align-top">{`${format(item.date, "PPP")} | ${item.startTime} - ${item.endTime}`}</TableCell>
                      <TableCell className="text-right align-top">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditAppointmentDialog(item)}>
                              <Edit3 className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => confirmDeleteAppointmentItem(item)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      {appointmentSearchTerm ? "No results found for your search." : "No appointments scheduled. Add new appointments to get started."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {!isLoadingData && filteredAppointments.length === 0 && appointmentSearchTerm === "" && (
             <div className="text-center py-10">
                <CalendarPlus className="mx-auto h-12 w-12 text-muted-foreground" data-ai-hint="calendar add" />
                <h3 className="mt-2 text-sm font-medium text-foreground">No appointments yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Get started by scheduling a new appointment.</p>
                <div className="mt-6">
                    <Button onClick={openAddAppointmentDialog}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add New Appointment
                    </Button>
                </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <AlertDialog open={!!appointmentItemToDelete} onOpenChange={() => setAppointmentItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the appointment for "{appointmentItemToDelete?.name}" titled "{appointmentItemToDelete?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAppointmentItemToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAppointmentItem} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
