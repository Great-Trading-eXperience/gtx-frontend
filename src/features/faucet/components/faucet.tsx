'use client';

import { DataTable } from '@/components/table/data-table';
import { requestTokenColumns } from '@/components/table/faucet/request-token/columns';
import { coreDevnet, sideDevnet } from '@/configs/wagmi';
import { useFaucetCooldown } from '../hooks/useFaucetCooldown';
import { useLastRequestTime } from '../hooks/useLastRequestTime';
import { usePrivyRequestToken } from '../hooks/usePrivyRequestToken';
import { useRequestToken } from '../hooks/useRequestToken';
import { useFaucetTokensData } from '../hooks/useFaucetTokensData';
import { useFaucetRequestData } from '../hooks/useFaucetRequestData';
import { useUserAndFaucetBalances } from '../hooks/useUserAndFaucetBalance';
import type { HexAddress } from '@/types/general/address';
import {
  ContractName,
  DEFAULT_CHAIN,
  getContractAddress,
} from '@/constants/contract/contract-address';
import {
  shouldFaucetUsePrivy,
  shouldFaucetUseStandardHook,
} from '@/constants/features/features-config';
import { formatNumber } from '@/lib/utils';
import { Button } from '@/components/_components/ui/button';
import { zodResolver } from '@hookform/resolvers/zod';
import { useWallets } from '@privy-io/react-auth';
import {
  Calendar,
  Clock,
  ExternalLink,
  History,
  RefreshCw,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { DateTime } from 'luxon';
import type { NextPage } from 'next';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { formatUnits } from 'viem';
import { useAccount, useChainId } from 'wagmi';
import * as z from 'zod';
import { FaucetSkeleton } from './skeleton-faucet';

const faucetSchema = z.object({
  token: z.string().min(1),
});

interface FaucetTokensData {
  decimals: number;
  symbol: string;
  token: string;
}

const GTXFaucet: NextPage = () => {
  // Transaction status
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const form = useForm<z.infer<typeof faucetSchema>>({
    resolver: zodResolver(faucetSchema),
    defaultValues: {
      token: '',
    },
  });
  const { watch } = form;
  const selectedTokenAddress = watch('token');

  const { address: wagmiAddress } = useAccount();
  const { wallets } = useWallets();

  // Check if faucet should use Privy
  const shouldUsePrivy = shouldFaucetUsePrivy();

  // Get user address based on configuration
  const privyWallet = wallets.find(w => w.walletClientType === 'privy') || wallets[0];
  const userAddress = shouldUsePrivy
    ? privyWallet?.address || wagmiAddress
    : wagmiAddress;

  const chainId = useChainId();
  const defaultChainId = Number(DEFAULT_CHAIN);
  // For faucet, use the actual selected chain, not the core chain override
  const actualChainId = chainId ?? defaultChainId;
  const faucetAddress = getContractAddress(
    actualChainId,
    ContractName.faucet
  ) as HexAddress;
  const hasFaucetContract =
    !!faucetAddress && faucetAddress !== '0x0000000000000000000000000000000000000000';

  // Get current chain info for explorer URL
  const currentChain = [coreDevnet, sideDevnet].find(
    chain => chain.id === actualChainId
  );
  const explorerUrl =
    currentChain?.blockExplorers?.default?.url ||
    'http://localhost:8545';

  const {
    faucetTokensData,
    loading: useFaucetTokensDataLoading,
    error: useFaucetTokensDataError,
  } = useFaucetTokensData(actualChainId);

  const getTokenOptions = (faucetTokensData: FaucetTokensData[]) => {
    if (!faucetTokensData || !Array.isArray(faucetTokensData)) {
      return [];
    }

    return faucetTokensData.map(item => ({
      token: item.token,
      symbol: item.symbol,
      decimals: item.decimals,
    }));
  };

  const tokenOptions = getTokenOptions(faucetTokensData.faucetTokenss.items);

  const selectedToken = tokenOptions.find(token => token.token === selectedTokenAddress);

  useEffect(() => {
    if (tokenOptions.length > 0 && !selectedTokenAddress) {
      form.setValue('token', tokenOptions[0].token);
    }
  }, [tokenOptions, selectedTokenAddress, form]);

  const {
    userBalance,
    faucetBalance,
    loading: useUserAndFaucetBalanceLoading,
    error,
    refetch,
  } = useUserAndFaucetBalances(
    userAddress as HexAddress,
    faucetAddress,
    selectedTokenAddress as HexAddress
  );

  const {
    lastRequestTime,
    loading: useLastRequestTimeLoading,
    error: lastRequestTimeError,
  } = useLastRequestTime(userAddress as HexAddress, faucetAddress);
  const {
    faucetCooldown,
    loading: useFaucetCooldownLoading,
    error: faucetCooldownError,
  } = useFaucetCooldown(faucetAddress);

  const {
    faucetRequestsData,
    loading: useFaucetRequestsDataLoading,
    error: useFaucetRequestsDataError,
  } = useFaucetRequestData(actualChainId);

  // Conditionally use the appropriate hook based on crosschain feature flag
  const useCrosschainStandardHook = shouldFaucetUseStandardHook();

  // Standard Wagmi hook (used when crosschain is enabled)
  const standardHookResult = useRequestToken();

  // Privy hook (used when crosschain is disabled)
  const privyHookResult = usePrivyRequestToken(userAddress as HexAddress);

  // Select the appropriate hook result
  const {
    isAlertOpen: isAlertRequestTokenOpen,
    handleRequestToken,
    isRequestTokenPending,
    isRequestTokenConfirming,
    isRequestTokenConfirmed,
    requestTokenHash,
    requestTokenError,
  } = useCrosschainStandardHook
    ? {
        isAlertOpen: standardHookResult.isAlertOpen,
        handleRequestToken: standardHookResult.handleRequestToken,
        isRequestTokenPending: standardHookResult.isRequestTokenPending,
        isRequestTokenConfirming: standardHookResult.isRequestTokenConfirming,
        isRequestTokenConfirmed: standardHookResult.isRequestTokenConfirmed,
        requestTokenHash: standardHookResult.requestTokenHash,
        requestTokenError: undefined, // Standard hook doesn't have error in same format
      }
    : {
        isAlertOpen: privyHookResult.isAlertOpen,
        handleRequestToken: privyHookResult.handleRequestToken,
        isRequestTokenPending: privyHookResult.isRequestTokenPending,
        isRequestTokenConfirming: privyHookResult.isRequestTokenConfirming,
        isRequestTokenConfirmed: privyHookResult.isRequestTokenConfirmed,
        requestTokenHash: privyHookResult.requestTokenHash,
        requestTokenError: privyHookResult.requestTokenError,
      };

  // Update processing state based on token request state
  useEffect(() => {
    if (isRequestTokenPending) {
      setIsProcessing(true);
      setTxStatus('Preparing token request...');
    } else if (isRequestTokenConfirming) {
      setTxStatus('Confirming transaction...');
    } else if (isRequestTokenConfirmed && requestTokenHash) {
      setTxHash(requestTokenHash);
      setTxStatus('Token request completed successfully!');
      setIsProcessing(false);
    } else if (requestTokenError) {
      setTxStatus(`Token request failed: ${requestTokenError.message}`);
      setIsProcessing(false);
    }
  }, [
    isRequestTokenPending,
    isRequestTokenConfirming,
    isRequestTokenConfirmed,
    requestTokenHash,
    requestTokenError,
  ]);

  const onSubmit = async (values: z.infer<typeof faucetSchema>) => {
    handleRequestToken(userAddress as HexAddress, selectedTokenAddress as HexAddress);
  };

  if (useFaucetTokensDataLoading) {
    return <FaucetSkeleton />;
  }

  if (!hasFaucetContract) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-black/90 border border-white/30 rounded-xl shadow-[0_0_25px_rgba(255,255,255,0.1)] backdrop-blur-sm max-w-md w-full mx-4">
          <div className="p-12 text-center">
            <h2 className="text-white text-3xl font-bold tracking-tight mb-4">
              Faucet Not Available
            </h2>
            <p className="text-white/70 mb-8">
              The faucet is not available on the currently selected network. Please switch
              to a supported network.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-12 mx-auto bg-black min-h-screen">
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="flex flex-col gap-8">
          {/* Header Section */}
          <div className="flex items-start justify-between">
            <h2 className="text-white text-4xl font-bold tracking-tight text-start">
              Token Faucet
              <br />
              <span className="text-white/70 text-base font-normal mt-2 block">
                Request test tokens
              </span>
            </h2>
          </div>

          {/* Main Faucet Card */}
          <div className="bg-black/60 border border-white/20 rounded-xl shadow-[0_0_25px_rgba(255,255,255,0.07)] backdrop-blur-sm">
            {/* Header with Icon */}
            <div className="flex items-center gap-3 p-6 border-b border-white/10">
              <TrendingUp className="w-5 h-5 text-white/70" />
              <span className="text-white font-medium text-lg">Request Tokens</span>
            </div>

            <div className="p-6">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Token Request Form */}
                <div className="space-y-6">
                  <div className="space-y-6">
                    <div>
                      <label
                        htmlFor="select-token"
                        className="text-white/70 text-sm font-medium uppercase tracking-wider block mb-3"
                      >
                        Select Token
                      </label>
                      <select
                        value={selectedTokenAddress}
                        onChange={e => form.setValue('token', e.target.value)}
                        id="select-token"
                        className="w-full h-12 bg-black/40 border border-white/20 text-white hover:border-white/40 focus:ring-1 focus:ring-white/40 focus:border-white/40 rounded-xl px-4 appearance-none cursor-pointer"
                      >
                        <option value="" disabled>
                          Choose a token to request
                        </option>
                        {tokenOptions.map(token => (
                          <option
                            key={token.token}
                            value={token.token}
                            className="bg-black text-white"
                          >
                            {token.symbol}
                          </option>
                        ))}
                      </select>
                    </div>

                    <Button
                      onClick={() => onSubmit({ token: selectedTokenAddress })}
                      disabled={
                        isProcessing ||
                        isRequestTokenPending ||
                        isRequestTokenConfirming ||
                        !selectedTokenAddress
                      }
                      className="w-full h-14 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium text-lg rounded-xl transition-colors"
                    >
                      {isRequestTokenPending
                        ? 'Confirming in Wallet...'
                        : isRequestTokenConfirming
                        ? 'Confirming...'
                        : isProcessing
                        ? 'Processing...'
                        : 'Request Tokens'}
                    </Button>
                  </div>

                  {/* Status Display */}
                  {txStatus && (
                    <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-white/90">{txStatus}</div>
                        {isProcessing && (
                          <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                        )}
                      </div>
                      {txHash && (
                        <a
                          href={`${explorerUrl}/tx/${txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 flex items-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          View on Explorer <ExternalLink className="ml-1 w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/40 border border-white/10 rounded-xl p-4 hover:bg-black/60 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white/70 text-sm font-medium uppercase tracking-wider">
                          Faucet Balance
                        </p>
                        <p className="text-white font-mono text-sm">
                          {faucetBalance && selectedToken
                            ? `${formatNumber(
                                Number(
                                  formatUnits(
                                    BigInt(faucetBalance),
                                    selectedToken.decimals
                                  )
                                ),
                                {
                                  decimals: 2,
                                  compact: true,
                                }
                              )} ${selectedToken.symbol}`
                            : '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/40 border border-white/10 rounded-xl p-4 hover:bg-black/60 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white/70 text-sm font-medium uppercase tracking-wider">
                          Cooldown
                        </p>
                        <p className="text-white font-mono text-sm">
                          {faucetCooldown ? `${faucetCooldown}s` : '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/40 border border-white/10 rounded-xl p-4 hover:bg-black/60 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white/70 text-sm font-medium uppercase tracking-wider">
                          Last Request
                        </p>
                        <p className="text-white font-mono text-sm">
                          {lastRequestTime
                            ? DateTime.fromMillis(
                                Number(lastRequestTime) * 1000
                              ).toFormat('dd/MM/yy')
                            : '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/40 border border-white/10 rounded-xl p-4 hover:bg-black/60 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white/70 text-sm font-medium uppercase tracking-wider">
                          Your Balance
                        </p>
                        <p className="text-white font-mono text-sm">
                          {userBalance && selectedToken
                            ? `${formatNumber(
                                Number(
                                  formatUnits(BigInt(userBalance), selectedToken.decimals)
                                ),
                                {
                                  decimals: 2,
                                  compact: true,
                                }
                              )} ${selectedToken.symbol}`
                            : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <History className="w-6 h-6 text-white/70" />
              <h3 className="text-white text-2xl font-bold tracking-tight">
                Transaction History
              </h3>
            </div>

            <div className="bg-black/60 border border-white/20 rounded-xl shadow-[0_0_25px_rgba(255,255,255,0.07)] backdrop-blur-sm">
              <div className="p-6">
                <DataTable
                  data={faucetRequestsData?.faucetRequestss.items ?? []}
                  columns={requestTokenColumns()}
                  handleRefresh={() => {}}
                  isLoading={useFaucetRequestsDataLoading}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GTXFaucet;
