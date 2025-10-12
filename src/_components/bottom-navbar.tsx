'use client';

import {
  ChartNoAxesCombined,
  ArrowLeftRight,
  CircleDollarSign,
  Wallet,
  ChartCandlestick,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import BottomSheet from './bottom-sheet';
import { useEffect, useState } from 'react';
import PlaceOrder from '@/features/trading/components/place-order/placeOrder';
import { useChainId } from 'wagmi';
import { useWallets } from '@privy-io/react-auth';
import { DEFAULT_CHAIN } from '@/constants/contract/contract-address';
import { usePools } from '@/features/trading/hooks/usePools';
import { useSelectedPool } from '@/features/trading/hooks/useSelectedPool';
import { useDepthData, useTicker24hr } from '@/features/trading/hooks/useMarketData';
import { useAccountData } from '@/features/trading/hooks/useAccountData';
import { useWebSocketData } from '@/features/trading/hooks/useWebsocketData';
import { useCombinedDepth } from '@/features/trading/hooks/useCombineData';

const useIsClient = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
};

export default function BottomNavbar() {
  const bottomNavigation = [
    { icon: ChartNoAxesCombined, label: 'Markets' },
    { icon: ArrowLeftRight, label: 'Swap' },
    { icon: CircleDollarSign, label: 'Faucet' },
    { icon: Wallet, label: 'Wallet' },
  ];

  const labels = bottomNavigation.map(item => `/${item.label.toLowerCase()}`);

  const pathname = usePathname();
  const isTradingPage = !labels.includes(pathname);

  const [isOpenBottomSheet, setIsOpenBottomSheet] = useState(false);

  const { wallets } = useWallets();
  const chainId = useChainId();
  const defaultChainId = Number(DEFAULT_CHAIN);
  const isClient = useIsClient();

  const embedded = wallets.find(wallet => wallet.walletClientType === 'privy');
  const effectiveAddress = embedded?.address as `0x${string}`;

  // Fetch pools data
  const {
    data: poolsData,
    isLoading: poolsLoading,
    error: poolsError,
  } = usePools(chainId, defaultChainId);

  // Get selected pool
  const { selectedPool, symbol } = useSelectedPool(poolsData);

  // Fetch market data using custom hooks
  const { data: depthData } = useDepthData(selectedPool);
  const { data: ticker24hr, isLoading: isLoadingTicker24hr } = useTicker24hr(symbol);

  // Fetch account data
  const {
    data: accountData,
    isLoading: accountLoading,
    error: accountError,
    refetch: refetchAccount,
  } = useAccountData(effectiveAddress);

  // WebSocket data
  const { wsDepthUpdates, wsTradeUpdates, wsTickerUpdates, wsOpenOrders, wsUserTrades } =
    useWebSocketData(chainId, symbol, selectedPool, effectiveAddress);

  // Combined data using custom hooks
  const combinedDepth = useCombinedDepth(depthData, wsDepthUpdates);

  const isLoading = poolsLoading || isLoadingTicker24hr;

  if (!isClient) {
    return null;
  }

  return (
    <>
      <div
        className={`flex md:hidden justify-around p-2 w-full fixed bottom-0 z-50 bg-black/80 backdrop-blur border-t border-white/10 ${
          isOpenBottomSheet ? 'pointer-events-none' : ''
        }`}
      >
        {bottomNavigation.slice(0, 2).map(item => {
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

        {isTradingPage && (
          <button
            onClick={() => setIsOpenBottomSheet(true)}
            className="relative -mt-8 pointer-events-auto"
          >
            <div className="flex flex-col items-center bg-gradient-to-br from-blue-400 to-blue-700 rounded-full p-3 shadow-lg shadow-blue-500/50 transition-all">
              <ChartCandlestick size={24} className="text-white" strokeWidth={2} />
              <span className="font-medium">Order</span>
            </div>
          </button>
        )}

        {bottomNavigation.slice(2, 4).map(item => {
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
      <BottomSheet
        isOpen={isOpenBottomSheet}
        onClose={() => setIsOpenBottomSheet(false)}
        title="Bottom sheet place order"
      >
        <PlaceOrder
          address={effectiveAddress}
          chainId={chainId}
          defaultChainId={defaultChainId}
          selectedPool={selectedPool}
          depthData={combinedDepth}
          ticker24hr={ticker24hr}
          refetchAccount={refetchAccount}
          isLoading={isLoading}
        />
      </BottomSheet>
    </>
  );
}
