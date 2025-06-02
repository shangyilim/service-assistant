
"use client";

import React, { useState, useMemo, useEffect } from "react";
import type { ServiceItem } from "@/types";
import { ServiceItemFormValues } from "@/lib/schemas";
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
import { ServiceFormDialog } from "./service-form-dialog";
import { useToast } from "@/hooks/use-toast";
import { MoreHorizontal, PlusCircle, Trash2, Edit3, Search, Loader2, Briefcase, Settings2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge"; // Import Badge for availability display
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
} from "firebase/firestore";

export function ServiceDataTableClient() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [editingServiceItem, setEditingServiceItem] = useState<ServiceItem | null>(null);
  const [isServiceFormOpen, setIsServiceFormOpen] = useState(false);
  const [serviceSearchTerm, setServiceSearchTerm] = useState("");
  const [serviceItemToDelete, setServiceItemToDelete] = useState<ServiceItem | null>(null);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const servicesCollectionRef = useMemo(() => {
    if (!user) return null;
    return collection(db, "users", user.id, "services");
  }, [user]);

  useEffect(() => {
    if (!servicesCollectionRef) {
      setServices([]);
      setIsLoadingData(false);
      return;
    }

    setIsLoadingData(true);
    const q = query(servicesCollectionRef, orderBy("name")); 
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const items = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            description: data.description,
            availability: typeof data.availability === 'boolean' ? data.availability : true, // Ensure boolean
          } as ServiceItem;
        });
        setServices(items);
        setIsLoadingData(false);
      }, 
      (error) => {
        console.error("Error fetching services: ", error);
        toast({ title: "Error", description: "Could not fetch services.", variant: "destructive" });
        setIsLoadingData(false);
      }
    );

    return () => unsubscribe();
  }, [servicesCollectionRef, toast]);

  const handleSaveServiceItem = async (formValues: ServiceItemFormValues) => {
    if (!servicesCollectionRef) {
      toast({ title: "Error", description: "User not authenticated or collection not available.", variant: "destructive" });
      return;
    }

    const dataToSave = {
      name: formValues.name,
      description: formValues.description,
      availability: formValues.availability, // This is now a boolean
    };

    try {
      if (editingServiceItem && editingServiceItem.id) {
        const itemDocRef = doc(servicesCollectionRef, editingServiceItem.id);
        await updateDoc(itemDocRef, dataToSave);
        toast({ title: "Success", description: "Service updated successfully." });
      } else {
        await addDoc(servicesCollectionRef, dataToSave);
        toast({ title: "Success", description: "Service added successfully." });
      }
      setEditingServiceItem(null);
      setIsServiceFormOpen(false);
    } catch (error) {
      console.error("Error saving service: ", error);
      toast({ title: "Error", description: "Could not save service.", variant: "destructive" });
    }
  };

  const openEditServiceDialog = (item: ServiceItem) => {
    setEditingServiceItem(item);
    setIsServiceFormOpen(true);
  };

  const openAddServiceDialog = () => {
    setEditingServiceItem(null);
    setIsServiceFormOpen(true);
  };
  
  const confirmDeleteServiceItem = (item: ServiceItem) => {
    setServiceItemToDelete(item);
  };

  const handleDeleteServiceItem = async () => {
    if (!serviceItemToDelete || !serviceItemToDelete.id || !servicesCollectionRef) return;

    try {
      const itemDocRef = doc(servicesCollectionRef, serviceItemToDelete.id);
      await deleteDoc(itemDocRef);
      toast({ title: "Success", description: `Service "${serviceItemToDelete.name}" deleted.` });
      setServiceItemToDelete(null);
    } catch (error) {
      console.error("Error deleting service: ", error);
      toast({ title: "Error", description: "Could not delete service.", variant: "destructive" });
      setServiceItemToDelete(null);
    }
  };

  const filteredServices = useMemo(() => {
    if (!serviceSearchTerm) return services;
    const lowercasedFilter = serviceSearchTerm.toLowerCase();
    return services.filter(item => {
      const isAvailableString = item.availability ? "available" : "unavailable";
      const isYesNoString = item.availability ? "yes" : "no";
      return (
        item.name.toLowerCase().includes(lowercasedFilter) ||
        item.description.toLowerCase().includes(lowercasedFilter) ||
        isAvailableString.includes(lowercasedFilter) ||
        isYesNoString.includes(lowercasedFilter)
      );
    });
  }, [services, serviceSearchTerm]);

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
              <Briefcase className="h-7 w-7 text-primary" />
              <CardTitle className="text-2xl font-headline">Manage Services</CardTitle>
            </div>
            <CardDescription>Define, view, edit, or delete your services.</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 items-center">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={serviceSearchTerm}
                onChange={(e) => setServiceSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-[250px]"
              />
            </div>
            <Button onClick={openAddServiceDialog} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Service
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isServiceFormOpen && (
            <ServiceFormDialog
              item={editingServiceItem}
              onSave={handleSaveServiceItem}
              open={isServiceFormOpen}
              onOpenChange={setIsServiceFormOpen}
            />
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">Name</TableHead>
                  <TableHead className="w-[45%]">Description</TableHead>
                  <TableHead className="w-[15%] text-center">Available</TableHead>
                  <TableHead className="text-right w-[10%]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingData ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                        Loading services...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredServices.length > 0 ? (
                  filteredServices.map(item => (
                    <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium align-top">{item.name}</TableCell>
                      <TableCell className="align-top whitespace-pre-wrap">{item.description}</TableCell>
                      <TableCell className="align-top text-center">
                        <Badge variant={item.availability ? "default" : "secondary"}>
                          {item.availability ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right align-top">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditServiceDialog(item)}>
                              <Edit3 className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => confirmDeleteServiceItem(item)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      {serviceSearchTerm ? "No results found for your search." : "No services defined. Add new services to get started."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {!isLoadingData && filteredServices.length === 0 && serviceSearchTerm === "" && (
             <div className="text-center py-10">
                <Settings2 className="mx-auto h-12 w-12 text-muted-foreground" data-ai-hint="services settings" />
                <h3 className="mt-2 text-sm font-medium text-foreground">No services yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Get started by adding a new service.</p>
                <div className="mt-6">
                    <Button onClick={openAddServiceDialog}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add New Service
                    </Button>
                </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <AlertDialog open={!!serviceItemToDelete} onOpenChange={() => setServiceItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the service: "{serviceItemToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setServiceItemToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteServiceItem} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

