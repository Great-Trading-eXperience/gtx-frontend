'use client'

import { PageLayout } from '@/_components/page-layout'

export default function Template({ children }: { children: React.ReactNode }) {
  return <PageLayout>{children}</PageLayout>
}