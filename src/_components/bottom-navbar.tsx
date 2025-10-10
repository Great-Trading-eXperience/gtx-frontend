'use client';

import {
  ChartNoAxesCombined,
  ArrowLeftRight,
  CircleDollarSign,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNavbar() {
  const bottomNavigation = [
    { icon: ChartNoAxesCombined, label: 'Markets' },
    { icon: ArrowLeftRight, label: 'Swap' },
    { icon: CircleDollarSign, label: 'Faucet' },
    { icon: Wallet, label: 'Wallet' },
  ];

  const pathname = usePathname();

  return (
    <div className="flex md:hidden justify-around p-2 w-full fixed bottom-0 z-50 bg-black/80 backdrop-blur border-t border-white/10">
      {bottomNavigation.map(item => {
        const Icon = item.icon;
        const href = `/${item.label.toLowerCase()}`;
        const isActive = pathname === href;

        return (
          <Link
            href={href}
            key={item.label}
            className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
              isActive ? 'text-blue-400' : 'text-slate-400'
            }`}
          >
            <Icon size={24} />
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
