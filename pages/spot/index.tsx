'use client';


import ClobDex from "@/components/clob-dex/clob-dex";
import { QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient();

const Spot = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950/40 to-slate-950 relative overflow-hidden">
      <ClobDex />
    </div>
  );
};

export default Spot;