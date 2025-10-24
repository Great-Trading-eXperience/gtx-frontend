'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Copy, CreditCard, RefreshCw, ChevronDown } from 'lucide-react';
import { useTokenMappings } from '@/hooks/web3/gtx/clob-dex/embedded-wallet/useTokenMappings';
import { useBalancesFromIndexer } from '@/hooks/web3/gtx/clob-dex/embedded-wallet/useBalancesFromIndexer';
import { FEATURE_FLAGS } from '@/constants/features/features-config';
import { usePrivyDeposit } from '@/hooks/web3/gtx/clob-dex/embedded-wallet/usePrivyDeposit';
import { useCrosschainDeposit } from '@/hooks/web3/gtx/clob-dex/embedded-wallet/useCrosschainDeposit';
import { formatNumber } from '@/lib/utils';
import { useWallets } from '@privy-io/react-auth';
import { useChainId } from 'wagmi';
import { useBalance } from '@/hooks/web3/token/useBalance';

interface ExternalBalanceDisplayProps {
  externalWalletAddress: string;
  selectedDepositToken: any;
  chainId: number;
}

const ExternalBalanceDisplay: React.FC<ExternalBalanceDisplayProps> = ({
  externalWalletAddress,
  selectedDepositToken,
  chainId
}) => {
  const currentChainId = chainId || 31337;
  const sourceAddress = selectedDepositToken?.sourceAddresses?.[currentChainId] || selectedDepositToken?.address;
  
  const { balance: externalBalance, loading: externalLoading } = useBalance(
    externalWalletAddress as `0x${string}`,
    sourceAddress as `0x${string}`,
    { enabled: !!sourceAddress && !!selectedDepositToken }
  );

  console.log('[DEPOSIT-TAB] External balance debug:', {
    currentChainId,
    selectedToken: selectedDepositToken?.symbol,
    sourceAddress,
    syntheticAddress: selectedDepositToken?.address,
    externalBalance: externalBalance?.toString(),
    externalLoading,
  });

  return (
    <span>
      {externalLoading ?
        'Loading...' :
        externalBalance ?
          formatNumber(Number(externalBalance) / Math.pow(10, selectedDepositToken.decimals || 18), {
            decimals: 2,
            compact: true,
          }) + ` ${selectedDepositToken?.symbol}` :
          `No ${selectedDepositToken?.symbol} balance`
      }
    </span>
  );
};

interface DepositTabProps {
  allUniqueTokens: any[];
  embeddedWalletAddress: string;
  externalWalletAddress: string;
  isOpen: boolean;
  activeTab: string;
}

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
};

export const DepositTab: React.FC<DepositTabProps> = ({
  allUniqueTokens,
  embeddedWalletAddress,
  externalWalletAddress,
  isOpen,
  activeTab,
}) => {
  const [depositAmount, setDepositAmount] = useState('');
  const [selectedDepositTokenAddress, setSelectedDepositTokenAddress] = useState('');
  const [isDepositDropdownOpen, setIsDepositDropdownOpen] = useState(false);

  const { wallets } = useWallets();
  const chainId = useChainId();

  const externalWallet = wallets.find(wallet => wallet.walletClientType !== 'privy');

  // Get token mappings and indexed balances for crosschain deposits
  const {
    data: tokenMappings,
    isLoading: tokenMappingsLoading,
    refetch: refetchTokenMappings,
  } = useTokenMappings(externalWalletAddress, isOpen && FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED);

  const {
    data: indexedBalances,
    isLoading: indexedBalancesLoading,
    error: indexedBalancesError,
    refetch: refetchIndexedBalances,
  } = useBalancesFromIndexer(embeddedWalletAddress, isOpen, activeTab);

  const {
    deposit: privyDeposit,
    loading: privyDepositLoading,
    resetState: privyDepositResetState,
  } = usePrivyDeposit();

  const {
    deposit: crosschainDeposit,
    loading: crosschainDepositLoading,
    resetState: crosschainDepositResetState,
  } = useCrosschainDeposit();

  
  // Generate tokens from API mappings
  const tokens = useMemo(() => {
    console.log('[DEPOSIT-TAB] Debug - allUniqueTokens:', {
      length: allUniqueTokens.length,
      data: allUniqueTokens,
      isEmpty: !allUniqueTokens.length,
    });

    if (!allUniqueTokens.length) return [];

    console.log('[DEPOSIT-TAB] Processing tokens:', allUniqueTokens);
    return allUniqueTokens.map((token, index) => {
      const colorMap = [
        'bg-blue-500',
        'bg-green-500',
        'bg-purple-500',
        'bg-red-500',
        'bg-yellow-500',
        'bg-indigo-500',
      ];
      const color = colorMap[index % colorMap.length];

      return {
        symbol: token.symbol,
        name: token.symbol,
        color,
        initial: token.symbol.charAt(0).toUpperCase(),
        address: token.address,
        decimals: token.decimals,
        sourceAddresses: token.sourceAddresses,
      };
    });
  }, [allUniqueTokens]);

  // Set default selected token
  useEffect(() => {
    if (tokens.length > 0 && !selectedDepositTokenAddress) {
      const defaultToken = tokens[0];
      console.log('[DEPOSIT-TAB] Setting default token:', defaultToken);
      setSelectedDepositTokenAddress(defaultToken.address);
    }
  }, [tokens, selectedDepositTokenAddress]);

  const selectedDepositToken = tokens.find(t => t.address === selectedDepositTokenAddress);

  console.log('tokensss', tokens)

  const handleDepositTokenSelect = (tokenAddress: string) => {
    const selectedToken = tokens.find(t => t.address === tokenAddress);
    console.log('🔄 Token selection:', {
      selectedAddress: tokenAddress,
      selectedSymbol: selectedToken?.symbol,
      currentSelectedAddress: selectedDepositTokenAddress,
      tokensLength: tokens.length,
    });
    setSelectedDepositTokenAddress(tokenAddress);
    setIsDepositDropdownOpen(false);
  };

  const handleDeposit = async () => {
    if (!depositAmount || !selectedDepositToken || !externalWallet) return;

    console.log('[DEPOSIT-TAB] Making deposit:', {
      amount: depositAmount,
      token: selectedDepositToken.symbol,
      address: selectedDepositToken.address,
      decimals: selectedDepositToken.decimals,
    });

    try {
      if (FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED) {
        // Crosschain deposit logic - use source token address for current chain
        const currentChainId = chainId || 31337;

        console.log('[DEPOSIT-TAB] Chain and token mapping debug:', {
          currentChainId,
          rawChainId: chainId,
          userSelectedToken: selectedDepositToken.symbol,
          allSourceAddresses: selectedDepositToken.sourceAddresses,
          sourceForCurrentChain: selectedDepositToken.sourceAddresses?.[currentChainId],
        });

        // Get the source token address for the current chain
        const sourceTokenAddress = selectedDepositToken.sourceAddresses?.[currentChainId] || selectedDepositToken.address;

        console.log('[DEPOSIT-TAB] Crosschain deposit details:', {
          currentChainId,
          syntheticToken: selectedDepositToken.address,
          sourceTokenAddress,
          symbol: selectedDepositToken.symbol,
          allSourceAddresses: selectedDepositToken.sourceAddresses,
          isUsingSource: sourceTokenAddress !== selectedDepositToken.address,
        });

        // Log detailed deposit parameters for debugging
        console.log('[DEPOSIT-TAB] Executing deposit with params:', {
          amount: depositAmount,
          currencyAddress: sourceTokenAddress,
          currencyAddressType: typeof sourceTokenAddress,
          embeddedAddress: embeddedWalletAddress,
          externalWallet: externalWallet ? 'connected' : 'null',
          externalChainId: currentChainId,
          decimals: selectedDepositToken.decimals || 18,
          selectedTokenData: selectedDepositToken,
        });

        try {
          await privyDeposit({
            amount: depositAmount,
            currencyAddress: sourceTokenAddress as `0x${string}`,
            embeddedAddress: embeddedWalletAddress,
            externalWallet,
            externalChainId: currentChainId,
            decimals: selectedDepositToken.decimals || 18,
          });

          console.log('[DEPOSIT-TAB] Deposit executed successfully');
        } catch (depositError) {
          console.error('[DEPOSIT-TAB] Deposit failed with error:', depositError);
          throw depositError;
        }
      } else {
        // Regular deposit logic - use synthetic token address directly
        await privyDeposit({
          amount: depositAmount,
          currencyAddress: selectedDepositToken.address as `0x${string}`,
          embeddedAddress: embeddedWalletAddress,
          externalWallet,
          externalChainId: chainId || 31337, // Default to 31337 if no chainId
          decimals: selectedDepositToken.decimals || 18,
        });
      }

      // Reset form and refresh balances
      setDepositAmount('');
      setTimeout(() => {
        refetchIndexedBalances();
        refetchTokenMappings();
      }, 1000);
    } catch (error) {
      console.error('[DEPOSIT-TAB] Deposit failed:', error);
    }
  };

  if (!isOpen || activeTab !== 'Deposit') return null;

  return (
    <div className="p-4">
      {/* Loading state */}
      {tokenMappingsLoading ? (
        <div className="mb-6 p-4 border border-blue-600 rounded-lg bg-blue-900/20">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
            <span className="text-blue-400 font-medium">Loading Token Mappings...</span>
          </div>
        </div>
      ) : indexedBalancesError ? (
        <div className="mb-6 p-4 border border-red-600 rounded-lg bg-red-900/20">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-red-400 font-medium">Error loading balances</span>
          </div>
        </div>
      ) : allUniqueTokens.length === 0 ? (
        <div className="mb-6 p-4 border border-yellow-600 rounded-lg bg-yellow-900/20">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-yellow-400 font-medium">No tokens available</span>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <div className="text-sm text-gray-400 mb-3">
              From connected wallet: {externalWalletAddress.slice(0, 6)}...{externalWalletAddress.slice(-4)}
            </div>

            <div className="mb-4 p-4 border border-gray-600 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="relative flex-1">
                  <div
                    className="flex items-center gap-3 cursor-pointer hover:bg-gray-800 rounded-lg p-2 -m-2 transition-colors"
                    onClick={() => setIsDepositDropdownOpen(!isDepositDropdownOpen)}
                  >
                    <div
                      className={`w-8 h-8 ${selectedDepositToken?.color} rounded-full flex items-center justify-center text-white font-medium`}
                    >
                      {selectedDepositToken?.initial}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white font-medium">
                        {selectedDepositToken?.name}
                      </span>
                      <span className="text-gray-400 text-xs font-mono">
                        {selectedDepositToken?.sourceAddresses?.[chainId] &&
                          `${selectedDepositToken.sourceAddresses?.[chainId].slice(0, 6)}...${selectedDepositToken.sourceAddresses?.[chainId].slice(-4)}`
                        }
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform ${isDepositDropdownOpen ? 'rotate-180' : ''
                        }`}
                    />
                  </div>

                  {isDepositDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 bg-gray-800 rounded-lg shadow-lg border border-gray-700 min-w-[230px] z-10">
                      {tokens.map(token => (
                        <div
                          key={token.address}
                          className="flex items-center gap-3 p-3 hover:bg-gray-700 cursor-pointer first:rounded-t-lg last:rounded-b-lg transition-colors"
                          onClick={() => handleDepositTokenSelect(token.address)}
                        >
                          <div
                            className={`w-6 h-6 ${token.color} rounded-full flex items-center justify-center text-white text-sm font-medium`}
                          >
                            {token.initial}
                          </div>
                          <div className="flex flex-col flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">
                                {token.name}
                              </span>
                              {token.address && (
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    copyToClipboard(token.address);
                                  }}
                                  className="p-1 hover:bg-gray-600 rounded opacity-70 hover:opacity-100 transition-opacity"
                                  title={`Copy ${token.name} address`}
                                >
                                  <Copy size={10} className="text-gray-400" />
                                </button>
                              )}
                            </div>
                            <span className="text-gray-400 text-xs font-mono">
                              {token.address
                                ? `${token.address.slice(0, 6)}...${token.address.slice(-4)}`
                                : ''}
                            </span>
                          </div>
                          {selectedDepositTokenAddress === token.address && (
                            <div className="w-2 h-2 bg-blue-400 rounded-full ml-auto"></div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <input
                  type="number"
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  className="outline-none bg-transparent text-right font-medium flex-1 ml-4"
                  placeholder="0.00"
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-400">
                <CreditCard size={14} />
                <ExternalBalanceDisplay
                externalWalletAddress={externalWalletAddress}
                selectedDepositToken={selectedDepositToken}
                chainId={chainId || 31337}
              />
              </div>
            </div>
          </div>

          <div className="flex justify-center mb-6">
            <div className="p-2">
              <ChevronDown size={36} className="text-[#00B4C8]" />
            </div>
          </div>

          <div className="mb-6">
            <div className="text-sm text-gray-400 mb-3">
              To your GTX wallet: {embeddedWalletAddress.slice(0, 6)}...{embeddedWalletAddress.slice(-4)}
            </div>

            <div className="mb-4 p-4 border border-gray-600 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 ${selectedDepositToken?.color} rounded-full flex items-center justify-center text-white font-medium`}
                  >
                    {selectedDepositToken?.initial}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white font-medium">
                      gs{selectedDepositToken?.name}
                    </span>
                    <span className="text-gray-400 text-xs font-mono">
                      {selectedDepositToken?.address &&
                        `${selectedDepositToken.address.slice(0, 6)}...${selectedDepositToken.address.slice(-4)}`
                      }
                    </span>
                  </div>
                </div>
                <div className="text-right font-medium flex-1 ml-4 text-gray-300">
                  {depositAmount ? formatNumber(Number(depositAmount), {
                    decimals: 2,
                    compact: true,
                  }) : formatNumber(0, {
                    decimals: 2,
                    compact: true,
                  })} {selectedDepositToken?.symbol}
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-400">
                <CreditCard size={14} />
                <span>
                  Current: {(() => {
                    const tokenBalance = indexedBalances?.find(
                      balance => balance.tokenAddress === selectedDepositToken?.address?.toLowerCase()
                    );
                    return formatNumber(Number(tokenBalance?.balance || '0'), {
                      decimals: 2,
                      compact: true,
                    });
                  })()} {selectedDepositToken?.symbol}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleDeposit}
            disabled={!depositAmount || (privyDepositLoading || crosschainDepositLoading)}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 ${!depositAmount || (privyDepositLoading || crosschainDepositLoading)
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-[#0078D4] hover:bg-[#0064C8] text-white'
              }`}
          >
            {(privyDepositLoading || crosschainDepositLoading) ? (
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>
                  {FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED ? 'Processing Crosschain Deposit...' : 'Depositing...'}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span>
                  {FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED ? 'Crosschain Deposit' : 'Deposit'}
                </span>
              </div>
            )}
          </button>
        </>
      )}

    </div>
  );
};
