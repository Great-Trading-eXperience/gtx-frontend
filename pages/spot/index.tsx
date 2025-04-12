// app/spot/page.tsx
'use client';

import ClobDex from "@/components/clob-dex/clob-dex";
import { Suspense } from "react";

export default function Spot() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950/40 to-slate-950 relative overflow-hidden">
      <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
        <ClobDex />
      </Suspense>
    </div>
  );
}