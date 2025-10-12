import { AlertCircle, BookOpen, Loader2, Wallet2 } from 'lucide-react';

export const NoWalletState = () => (
  <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-gray-800/30 bg-gray-900/20 p-8">
    <div className="flex flex-col items-center gap-3 text-center">
      <Wallet2 className="h-12 w-12 text-gray-400" />
      <p className="text-lg text-gray-200">Connect your wallet to view order history</p>
    </div>
  </div>
);

export const LoadingState = () => (
  <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-gray-800/30 bg-gray-900/20 p-8">
    <div className="flex flex-col items-center gap-3 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      <p className="text-lg text-gray-200">Loading your order history...</p>
    </div>
  </div>
);

export const ErrorState = ({ error }: { error: Error | null }) => (
  <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-rose-800/30 bg-rose-900/20 p-8">
    <div className="flex flex-col items-center gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-rose-400" />
      <p className="text-lg text-rose-200">
        {error instanceof Error ? error.message : 'Unknown error'}
      </p>
    </div>
  </div>
);

export const NoOrdersState = () => (
  <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-gray-800/30 bg-gray-900/20 p-8">
    <div className="flex flex-col items-center gap-3 text-center">
      <BookOpen className="h-8 w-8 text-gray-400" />
      <p className="text-gray-200">No orders found</p>
    </div>
  </div>
);
