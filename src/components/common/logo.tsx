import { DatabaseZap } from 'lucide-react';
import Link from 'next/link';

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-2 text-primary ${className}`}>
      <DatabaseZap className="h-7 w-7" />
      <span className="text-xl font-headline font-semibold">Service Assistant</span>
    </Link>
  );
}
