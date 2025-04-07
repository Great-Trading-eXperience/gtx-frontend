'use client';

import Perpetual from "@/components/perpetual/perpetual";
import { Hexagon, Droplets, LineChart, ChartBarBig } from "lucide-react";

const PerpetualPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950/40 to-slate-950 relative overflow-hidden">
        <Perpetual />
    </div>
  );
};

export default PerpetualPage;