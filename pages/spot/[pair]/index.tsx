// app/spot/[poolId]/page.tsx
'use client';

import ClobDex from "@/components/clob-dex/clob-dex";
import { Suspense } from "react";

export default function SpotWithPool({ params }: { params: { poolId: string } }) {
  // The poolId parameter will be available but we don't need to handle it directly
  // because the ClobDex component will read it from the URL path
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950/40 to-slate-950 relative overflow-hidden">
      <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
        <ClobDex />
      </Suspense>
    </div>
  );
}