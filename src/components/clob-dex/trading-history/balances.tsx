'use client';

import { ClobDexComponentProps } from '../clob-dex';
import { BalanceItem, PoolItem } from '@/graphql/gtx/clob';
import { formatAmount } from '@/lib/utils';
import { ChevronDown, Loader2, BookOpen, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { formatUnits, parseUnits } from 'viem';
import { useWithdraw } from '@/hooks/web3/gtx/clob-dex/gtx-router/useWithdraw';
import { HexAddress } from '@/types/general/address';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NotificationDialog } from '@/components/notification-dialog/notification-dialog';
import { getExplorerUrl } from '@/constants/urls/urls-config';
import { ProcessedPoolItem } from '@/types/gtx/clob';
import GTXSlider from '../place-order/slider';

export interface BalancesHistoryTableProps extends ClobDexComponentProps {
  balancesResponse: BalanceItem[];
  balancesLoading: boolean;
  balancesError: Error | null;
  selectedPool?: ProcessedPoolItem;
}

export default function BalancesHistoryTable({
  address,
  chainId,
  defaultChainId,
  balancesResponse,
  balancesLoading,
  balancesError,
  selectedPool,
}: BalancesHistoryTableProps) {
  type SortDirection = 'asc' | 'desc';
  type SortableKey = 'amount' | 'symbol';

  const [sortConfig, setSortConfig] = useState<{
    key: SortableKey;
    direction: SortDirection;
  }>({
    key: 'amount',
    direction: 'desc',
  });

  // Withdrawal state
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState<BalanceItem | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [isProcessingWithdrawal, setIsProcessingWithdrawal] = useState(false);

  // Notification state
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationSuccess, setNotificationSuccess] = useState(true);
  const [notificationTxHash, setNotificationTxHash] = useState<string | undefined>(
    undefined
  );

  // Get the explorer base URL for the current chain
  const getExplorerBaseUrl = () => {
    try {
      return getExplorerUrl(chainId);
    } catch (error) {
      console.error('Failed to get explorer URL:', error);
      return '';
    }
  };

  // Initialize withdraw hook
  const {
    handleWithdraw,
    isWithdrawPending,
    isWithdrawalConfirming,
    isWithdrawalConfirmed,
    withdrawalHash,
    withdrawError,
    resetWithdrawState,
  } = useWithdraw();

  // Reset notification state when dialog closes
  useEffect(() => {
    if (!withdrawDialogOpen) {
      // Small delay to ensure dialog is fully closed before resetting
      const timer = setTimeout(() => {
        if (!isProcessingWithdrawal) {
          resetWithdrawState?.();
          setWithdrawAmount('');
          setSelectedBalance(null);
        }
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [withdrawDialogOpen, isProcessingWithdrawal, resetWithdrawState]);

  // Watch for transaction status changes to trigger notifications
  useEffect(() => {
    if (withdrawalHash && isWithdrawalConfirmed && isProcessingWithdrawal) {
      // Show success notification when withdrawal is confirmed
      setNotificationSuccess(true);
      setNotificationMessage(
        `Successfully withdraw ${withdrawAmount} ${
          selectedBalance?.currency.symbol || 'Token'
        }!`
      );
      setNotificationTxHash(withdrawalHash);
      setNotificationOpen(true);
      setIsProcessingWithdrawal(false);

      // Close the withdraw dialog
      setWithdrawDialogOpen(false);
    }
  }, [
    isWithdrawalConfirmed,
    withdrawalHash,
    withdrawAmount,
    selectedBalance,
    isProcessingWithdrawal,
  ]);

  // Watch for errors to show in notification
  useEffect(() => {
    if (withdrawError && isProcessingWithdrawal) {
      // Show error notification
      setNotificationSuccess(false);
      setNotificationMessage(
        withdrawError instanceof Error ? withdrawError.message : 'Failed to withdraw'
      );
      setNotificationTxHash(undefined);
      setNotificationOpen(true);
      setIsProcessingWithdrawal(false);
    }
  }, [withdrawError, isProcessingWithdrawal]);

  const handleSort = (key: SortableKey) => {
    setSortConfig(currentConfig => ({
      key,
      direction:
        currentConfig.key === key && currentConfig.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleWithdrawClick = (balance: BalanceItem) => {
    // Reset any previous notification state
    setNotificationOpen(false);
    setSelectedBalance(balance);
    setWithdrawAmount('');
    setWithdrawDialogOpen(true);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and a single decimal point
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setWithdrawAmount(value);
    }
  };

  const handleMaxAmount = () => {
    if (selectedBalance) {
      // Assuming balance is in 18 decimals - adjust if needed
      setWithdrawAmount(formatUnits(BigInt(selectedBalance.amount), 18));
    }
  };

  const handleWithdrawSubmit = async () => {
    if (!address || !selectedBalance || !withdrawAmount) return;

    try {
      setIsProcessingWithdrawal(true);
      const amount = parseUnits(withdrawAmount, 18);

      await handleWithdraw(
        selectedBalance.currency.address as HexAddress,
        amount,
        selectedBalance.currency.symbol || 'Token',
        18
      );

      // Success notification will be triggered by useEffect when confirmed
    } catch (error) {
      console.error('Withdrawal error:', error);
      setIsProcessingWithdrawal(false);

      // Show error notification
      setNotificationSuccess(false);
      setNotificationMessage(
        error instanceof Error ? error.message : 'Failed to withdraw'
      );
      setNotificationOpen(true);
    }
  };

  // Handler for notification close
  const handleNotificationClose = () => {
    setNotificationOpen(false);
    // Reset withdrawal state when notification is closed
    if (!isProcessingWithdrawal) {
      resetWithdrawState?.();
    }
  };

  const sortedBalances = [...(balancesResponse || [])].sort((a, b) => {
    const key = sortConfig.key;

    if (key === 'amount') {
      const aValue = BigInt(a.amount || '0');
      const bValue = BigInt(b.amount || '0');
      return sortConfig.direction === 'asc'
        ? aValue < bValue
          ? -1
          : aValue > bValue
          ? 1
          : 0
        : bValue < aValue
        ? -1
        : bValue > aValue
        ? 1
        : 0;
    }
    if (key === 'symbol') {
      const aValue = a.currency.symbol || '';
      const bValue = b.currency.symbol || '';
      return sortConfig.direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    return 0;
  });

  if (balancesLoading)
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );

  if (balancesError)
    return (
      <div className="p-4 bg-gradient-to-br from-red-900/40 to-red-950/40 rounded-xl border border-red-800/50 text-red-300">
        <p>Error loading balances: {balancesError.message}</p>
      </div>
    );

  if (!balancesResponse || balancesResponse.length === 0)
    return (
      <div className="flex flex-col items-center justify-center h-40 space-y-2">
        <BookOpen className="h-8 w-8 text-gray-400" />
        <p className="text-gray-400">No balances found</p>
      </div>
    );

    

  return (
    <>
      <div className="relative overflow-x-auto">
        <div className="grid grid-cols-3 gap-4 border-b border-gray-800/30 bg-gray-900/40 px-4 py-3 backdrop-blur-sm">
          <button
            onClick={() => handleSort('symbol')}
            className="flex items-center gap-1 text-sm font-medium text-gray-200 transition-colors hover:text-gray-100"
          >
            <span>Token</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                sortConfig.key === 'symbol' && sortConfig.direction === 'asc'
                  ? 'rotate-180'
                  : ''
              }`}
            />
          </button>
          <button
            onClick={() => handleSort('amount')}
            className="flex items-center gap-1 text-sm font-medium text-gray-200 transition-colors hover:text-gray-100"
          >
            <span>Amount</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                sortConfig.key === 'amount' && sortConfig.direction === 'asc'
                  ? 'rotate-180'
                  : ''
              }`}
            />
          </button>
          <div className="text-sm font-medium text-gray-200">Actions</div>
        </div>
        <div className="space-y-2 p-4">
          {sortedBalances.map((balance, index) => (
            <div
              key={`${balance.currency.address || balance.currency.symbol}-${index}`}
              className="grid grid-cols-3 gap-4 rounded-lg bg-gray-900/20 p-4 transition-colors hover:bg-gray-900/40"
            >
              <div className="text-gray-200">{balance.currency.symbol}</div>
              <div className="font-medium text-white">
                {formatAmount(formatUnits(BigInt(balance.amount), 18))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleWithdrawClick(balance)}
                  className="rounded bg-gray-800 px-3 py-1 text-sm text-gray-200 transition-colors hover:bg-gray-700"
                  disabled={BigInt(balance.amount) <= 0n}
                >
                  Withdraw
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Withdraw Dialog */}
      <Dialog
        open={withdrawDialogOpen}
        onOpenChange={open => {
          if (!isProcessingWithdrawal) {
            setWithdrawDialogOpen(open);
          }
        }}
      >
        <DialogContent className="sm:max-w-md bg-gray-900 border border-gray-800/30 text-gray-200">
          <DialogHeader>
            <DialogTitle>Withdraw {selectedBalance?.currency.symbol}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Withdraw funds from GTX to your wallet
            </DialogDescription>
          </DialogHeader>

          {selectedBalance && (
            <div className="space-y-4 py-3">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="withdraw-amount" className="text-gray-300">
                    Amount
                  </Label>
                  <span className="text-xs text-gray-400">
                    Available:{' '}
                    {formatAmount(formatUnits(BigInt(selectedBalance.amount), 18))}{' '}
                    {selectedBalance.currency.symbol}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Input
                    id="withdraw-amount"
                    placeholder="0.0"
                    value={withdrawAmount}
                    onChange={handleAmountChange}
                    className="bg-gray-800 border-gray-700 text-gray-200"
                  />
                </div>
                <GTXSlider quantity={formatAmount(formatUnits(BigInt(selectedBalance.amount), 18))} setQuantity={setWithdrawAmount} />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                if (!isProcessingWithdrawal) {
                  setWithdrawDialogOpen(false);
                }
              }}
              className="border-gray-700 bg-transparent text-gray-200 hover:bg-gray-800 hover:text-gray-100"
              disabled={isWithdrawPending || isWithdrawalConfirming}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleWithdrawSubmit}
              disabled={
                !withdrawAmount ||
                isWithdrawPending ||
                isWithdrawalConfirming ||
                parseFloat(withdrawAmount) <= 0
              }
            >
              {isWithdrawPending || isWithdrawalConfirming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isWithdrawPending ? 'Confirming...' : 'Processing...'}
                </>
              ) : (
                'Withdraw'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notification Dialog */}
      <NotificationDialog
        isOpen={notificationOpen}
        onClose={handleNotificationClose}
        message={notificationMessage}
        isSuccess={notificationSuccess}
        txHash={notificationTxHash}
        explorerBaseUrl={getExplorerBaseUrl()}
      />
    </>
  );
}
