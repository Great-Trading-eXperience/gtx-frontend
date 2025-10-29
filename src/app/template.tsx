'use client'

import { PageLayout } from '@/components/page-layout'
import { usePathname } from 'next/navigation'

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Skip PageLayout for not-found page to prevent Privy SSG issues
  if (pathname === '/_not-found') {
    return <>{children}</>;
  }
  
  return <PageLayout>{children}</PageLayout>
}
