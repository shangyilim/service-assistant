import type { Metadata } from 'next';
import { BusinessProfileForm } from '@/components/dashboard/business-profile-form';

export const metadata: Metadata = {
  title: 'Business Profile - Service Assistant',
  description: 'Manage your business profile information.',
};

export default function ProfilePage() {
  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <BusinessProfileForm />
    </div>
  );
}
