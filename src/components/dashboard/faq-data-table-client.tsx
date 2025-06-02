
"use client";

import React, { useState, useMemo, useEffect } from "react";
import type { FaqItem } from "@/types";
import { FaqItemFormValues } from "@/lib/schemas";
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
import { FaqFormDialog } from "./faq-form-dialog";
import { useToast } from "@/hooks/use-toast";
import { MoreHorizontal, PlusCircle, Trash2, Edit3, Search, Loader2, HelpCircle } from "lucide-react";
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
} from "firebase/firestore";

export function FaqDataTableClient() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [editingFaqItem, setEditingFaqItem] = useState<FaqItem | null>(null);
  const [isFaqFormOpen, setIsFaqFormOpen] = useState(false);
  const [faqSearchTerm, setFaqSearchTerm] = useState("");
  const [faqItemToDelete, setFaqItemToDelete] = useState<FaqItem | null>(null);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  // FAQs are now in a global collection "faqs"
  const faqsCollectionRef = useMemo(() => collection(db, "faqs"), []);

  useEffect(() => {
    setIsLoadingData(true);
    const q = query(faqsCollectionRef, orderBy("question"));
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const items = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as FaqItem));
        setFaqs(items);
        setIsLoadingData(false);
      }, 
      (error) => {
        console.error("Error fetching FAQs: ", error);
        toast({ title: "Error", description: "Could not fetch FAQs.", variant: "destructive" });
        setIsLoadingData(false);
      }
    );

    return () => unsubscribe();
  }, [faqsCollectionRef, toast]);

  const handleSaveFaqItem = async (formValues: FaqItemFormValues) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You need to be logged in to save FAQs.", variant: "destructive" });
      return;
    }

    const dataToSave: Partial<FaqItem> = { // Use Partial<FaqItem> for flexibility
      question: formValues.question,
      answer: formValues.answer,
    };

    try {
      if (editingFaqItem && editingFaqItem.id) {
        const itemDocRef = doc(faqsCollectionRef, editingFaqItem.id);
        // Only update question and answer, userId (if present) remains unchanged
        await updateDoc(itemDocRef, {
            question: formValues.question,
            answer: formValues.answer,
        });
        toast({ title: "Success", description: "FAQ updated successfully." });
      } else {
        // Add new FAQ, include userId
        dataToSave.userId = user.id;
        await addDoc(faqsCollectionRef, dataToSave as FaqItem); // Cast to FaqItem as userId is now added
        toast({ title: "Success", description: "FAQ added successfully." });
      }
      setEditingFaqItem(null);
      setIsFaqFormOpen(false);
    } catch (error) {
      console.error("Error saving FAQ: ", error);
      toast({ title: "Error", description: "Could not save FAQ.", variant: "destructive" });
    }
  };

  const openEditFaqDialog = (item: FaqItem) => {
    setEditingFaqItem(item);
    setIsFaqFormOpen(true);
  };

  const openAddFaqDialog = () => {
    setEditingFaqItem(null);
    setIsFaqFormOpen(true);
  };
  
  const confirmDeleteFaqItem = (item: FaqItem) => {
    setFaqItemToDelete(item);
  };

  const handleDeleteFaqItem = async () => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You need to be logged in to delete FAQs.", variant: "destructive" });
      setFaqItemToDelete(null);
      return;
    }
    if (!faqItemToDelete || !faqItemToDelete.id) return;

    try {
      const itemDocRef = doc(faqsCollectionRef, faqItemToDelete.id);
      await deleteDoc(itemDocRef);
      toast({ title: "Success", description: `FAQ "${faqItemToDelete.question.substring(0,20)}..." deleted.` });
      setFaqItemToDelete(null);
    } catch (error) {
      console.error("Error deleting FAQ: ", error);
      toast({ title: "Error", description: "Could not delete FAQ.", variant: "destructive" });
      setFaqItemToDelete(null);
    }
  };

  const filteredFaqs = useMemo(() => {
    if (!faqSearchTerm) return faqs;
    return faqs.filter(item =>
      item.question.toLowerCase().includes(faqSearchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(faqSearchTerm.toLowerCase())
    );
  }, [faqs, faqSearchTerm]);

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
              <HelpCircle className="h-7 w-7 text-primary" />
              <CardTitle className="text-2xl font-headline">Manage FAQs</CardTitle>
            </div>
            <CardDescription>Add, edit, or delete frequently asked questions. These are visible to all users.</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 items-center">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search FAQs..."
                value={faqSearchTerm}
                onChange={(e) => setFaqSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-[250px]"
              />
            </div>
            <Button onClick={openAddFaqDialog} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New FAQ
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isFaqFormOpen && (
            <FaqFormDialog
              item={editingFaqItem}
              onSave={handleSaveFaqItem}
              open={isFaqFormOpen}
              onOpenChange={setIsFaqFormOpen}
            />
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">Question</TableHead>
                  <TableHead className="w-2/3">Answer</TableHead>
                  {/* Consider adding a "Created By" column if needed in the future */}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingData ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                        Loading FAQs...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredFaqs.length > 0 ? (
                  filteredFaqs.map(item => (
                    <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium align-top">{item.question}</TableCell>
                      <TableCell className="align-top whitespace-pre-wrap">{item.answer}</TableCell>
                      <TableCell className="text-right align-top">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditFaqDialog(item)}>
                              <Edit3 className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => confirmDeleteFaqItem(item)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                      {faqSearchTerm ? "No results found for your search." : "No FAQs available. Add new FAQs to get started."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {!isLoadingData && filteredFaqs.length === 0 && faqSearchTerm === "" && (
             <div className="text-center py-10">
                <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground" data-ai-hint="question mark" />
                <h3 className="mt-2 text-sm font-medium text-foreground">No FAQs yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Get started by adding a new FAQ.</p>
                <div className="mt-6">
                    <Button onClick={openAddFaqDialog}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add New FAQ
                    </Button>
                </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <AlertDialog open={!!faqItemToDelete} onOpenChange={() => setFaqItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the FAQ: "{faqItemToDelete?.question.substring(0,50)}...".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFaqItemToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFaqItem} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

