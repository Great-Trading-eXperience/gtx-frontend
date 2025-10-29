'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Force dynamic rendering to prevent SSG issues
export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="max-w-md text-center space-y-6">
        <h1 className="text-6xl font-bold text-blue-400">404</h1>
        <h2 className="text-2xl font-semibold">Page Not Found</h2>
        <p className="text-gray-300">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}