
"use client";

import React, { useState, useMemo, useEffect } from "react";
import type { DataItem } from "@/types";
import { DataItemFormValues } from "@/lib/schemas";
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
import { DataFormDialog } from "./data-form-dialog";
import { useToast } from "@/hooks/use-toast";
import { MoreHorizontal, PlusCircle, Trash2, Edit3, UploadCloud, Search, Loader2 } from "lucide-react";
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

// Firebase imports
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

export function DataTableClient() {
  const [data, setData] = useState<DataItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [editingItem, setEditingItem] = useState<DataItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemToDelete, setItemToDelete] = useState<DataItem | null>(null);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const dataItemsCollectionRef = useMemo(() => {
    if (!user) return null;
    return collection(db, "users", user.id, "dataItems");
  }, [user]);

  useEffect(() => {
    if (!dataItemsCollectionRef) {
      setData([]);
      setIsLoadingData(false); // Stop loading if no collection ref (e.g., user logged out)
      return;
    }

    setIsLoadingData(true);
    const q = query(dataItemsCollectionRef, orderBy("name"));
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const items = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as DataItem));
        setData(items);
        setIsLoadingData(false);
      }, 
      (error) => {
        console.error("Error fetching data items: ", error);
        toast({ title: "Error", description: "Could not fetch data items.", variant: "destructive" });
        setIsLoadingData(false);
      }
    );

    return () => unsubscribe();
  }, [dataItemsCollectionRef, toast]);

  const handleSaveItem = async (formValues: DataItemFormValues) => {
    if (!dataItemsCollectionRef) {
      toast({ title: "Error", description: "User not authenticated or collection not available.", variant: "destructive" });
      return;
    }

    const dataToSave = {
      name: formValues.name,
      value: formValues.value,
      category: formValues.category,
    };

    try {
      if (editingItem && editingItem.id) {
        const itemDocRef = doc(dataItemsCollectionRef, editingItem.id);
        await updateDoc(itemDocRef, dataToSave);
        toast({ title: "Success", description: "Item updated successfully." });
      } else {
        await addDoc(dataItemsCollectionRef, dataToSave);
        toast({ title: "Success", description: "Item added successfully." });
      }
      setEditingItem(null);
      setIsFormOpen(false);
    } catch (error) {
      console.error("Error saving item: ", error);
      toast({ title: "Error", description: "Could not save item.", variant: "destructive" });
    }
  };

  const openEditDialog = (item: DataItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const openAddDialog = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };
  
  const confirmDeleteItem = (item: DataItem) => {
    setItemToDelete(item);
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete || !itemToDelete.id || !dataItemsCollectionRef) return;

    try {
      const itemDocRef = doc(dataItemsCollectionRef, itemToDelete.id);
      await deleteDoc(itemDocRef);
      toast({ title: "Success", description: `Item "${itemToDelete.name}" deleted.` });
      setItemToDelete(null);
    } catch (error) {
      console.error("Error deleting item: ", error);
      toast({ title: "Error", description: "Could not delete item.", variant: "destructive" });
      setItemToDelete(null);
    }
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  if (authLoading) { // Auth is primary loading state
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
            <CardTitle className="text-2xl font-headline">Data Management</CardTitle>
            <CardDescription>View, add, edit, or delete your data items.</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 items-center">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search data..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-[250px]"
              />
            </div>
            <Button onClick={openAddDialog} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isFormOpen && (
            <DataFormDialog
              item={editingItem}
              onSave={handleSaveItem}
              open={isFormOpen}
              onOpenChange={setIsFormOpen}
            />
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingData ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                        Loading data...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredData.length > 0 ? (
                  filteredData.map(item => (
                    <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.value}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(item)}>
                              <Edit3 className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => confirmDeleteItem(item)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
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
                      {searchTerm ? "No results found for your search." : "No data available. Add new items to get started."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {!isLoadingData && filteredData.length === 0 && searchTerm === "" && (
             <div className="text-center py-10">
                <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" data-ai-hint="data placeholder" />
                <h3 className="mt-2 text-sm font-medium text-foreground">No data items yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Get started by adding a new data item.</p>
                <div className="mt-6">
                    <Button onClick={openAddDialog}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add New Item
                    </Button>
                </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the item "{itemToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
