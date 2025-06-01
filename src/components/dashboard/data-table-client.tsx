"use client";

import React, { useState, useMemo } from "react";
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
import { MoreHorizontal, PlusCircle, Trash2, Edit3, UploadCloud, Search } from "lucide-react";
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

const initialData: DataItem[] = [
  { id: "1", name: "Alpha Widget", value: 150, category: "Widgets" },
  { id: "2", name: "Beta Gadget", value: 275, category: "Gadgets" },
  { id: "3", name: "Gamma Gizmo", value: 99, category: "Gizmos" },
  { id: "4", name: "Delta Device", value: 420, category: "Devices" },
];

export function DataTableClient() {
  const [data, setData] = useState<DataItem[]>(initialData);
  const [editingItem, setEditingItem] = useState<DataItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemToDelete, setItemToDelete] = useState<DataItem | null>(null);
  const { toast } = useToast();

  const handleSaveItem = (formValues: DataItemFormValues) => {
    if (editingItem) {
      // Edit existing item
      setData(prevData =>
        prevData.map(item =>
          item.id === editingItem.id ? { ...item, ...formValues, id: item.id } : item
        )
      );
      toast({ title: "Success", description: "Item updated successfully." });
    } else {
      // Add new item
      const newItem: DataItem = {
        ...formValues,
        id: Date.now().toString(), // Simple ID generation
      };
      setData(prevData => [newItem, ...prevData]);
      toast({ title: "Success", description: "Item added successfully." });
    }
    setEditingItem(null);
    setIsFormOpen(false);
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

  const handleDeleteItem = () => {
    if (!itemToDelete) return;
    setData(prevData => prevData.filter(item => item.id !== itemToDelete.id));
    toast({ title: "Success", description: `Item "${itemToDelete.name}" deleted.` });
    setItemToDelete(null);
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

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
          {isFormOpen && ( // Conditionally render dialog instead of using DialogTrigger to control open state
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
                {filteredData.length > 0 ? (
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
          {filteredData.length === 0 && searchTerm === "" && (
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
