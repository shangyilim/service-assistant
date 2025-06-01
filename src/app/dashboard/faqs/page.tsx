
import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'FAQs - Data Weaver',
  description: 'Frequently Asked Questions about Data Weaver.',
};

export default function FAQsPage() {
  const faqs = [
    {
      id: "what-is-dw",
      question: "What is Data Weaver?",
      answer: "Data Weaver is an innovative platform designed to help you manage and analyze your data with precision and ease. It offers a suite of tools for data input, real-time updates, and secure storage using Firebase.",
    },
    {
      id: "how-to-add",
      question: "How do I add new data?",
      answer: "You can add new data items through the 'Add New Item' button on your dashboard. This will open a form where you can input the name, value, and category of your data. The data is then saved to Firestore.",
    },
    {
      id: "edit-data",
      question: "Can I edit or delete existing data items?",
      answer: "Yes, each data item in the table on your dashboard has an action menu (three dots). From there, you can choose to 'Edit' or 'Delete' the item. Changes are reflected in real-time.",
    },
    {
      id: "data-security",
      question: "Is my data secure?",
      answer: "Data Weaver utilizes Firebase Authentication for secure sign-in and Firestore for data storage. Firestore has robust security rules, and your data is stored under your unique user ID, ensuring only you can access it.",
    },
    {
      id: "theme-toggle",
      question: "How does the theme (dark/light mode) toggle work?",
      answer: "You can switch between light and dark themes using the sun/moon icon located in the page header. Your theme preference is saved in your browser's local storage for a consistent experience on your next visit.",
    },
    {
      id: "sidebar-navigation",
      question: "How do I navigate using the sidebar?",
      answer: "The sidebar on the left provides quick links to different sections of the dashboard, such as the main data view and this FAQs page. Click on an item to navigate. On smaller screens, the sidebar can be toggled using the menu icon in the header.",
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-8">
        <HelpCircle className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h1>
          <p className="text-muted-foreground">Find answers to common questions about Data Weaver.</p>
        </div>
      </div>
      <Card className="shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle>Common Questions</CardTitle>
          <CardDescription>Explore the topics below to learn more about using Data Weaver effectively.</CardDescription>
        </CardHeader>
        <CardContent>
          {faqs.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq) => (
                <AccordionItem value={faq.id} key={faq.id}>
                  <AccordionTrigger className="text-left hover:no-underline py-4 text-base font-medium">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4 text-sm leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="text-center text-muted-foreground py-8">No FAQs available at the moment. Please check back later.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
