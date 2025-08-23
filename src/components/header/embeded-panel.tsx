import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Copy,
  QrCode,
  Edit3,
  Search,
  ChevronDown,
  Key,
  LogOut,
  CreditCard,
  RefreshCw,
  Wifi,
  Check,
} from 'lucide-react';
import { useWallets, usePrivy } from '@privy-io/react-auth';
import { useTokenBalance } from '@/hooks/web3/gtx/clob-dex/embedded-wallet/useBalanceOf';
import GTXTooltip from '../clob-dex/place-order/tooltip';
import { usePrivyDeposit } from '@/hooks/web3/gtx/clob-dex/embedded-wallet/usePrivyDeposit';
import { usePrivyWithdraw } from '@/hooks/web3/gtx/clob-dex/embedded-wallet/usePrivyWithdraw';
import { useCrosschainDeposit } from '@/hooks/web3/gtx/clob-dex/embedded-wallet/useCrosschainDeposit';
import { useMarketStore } from '@/store/market-store';
import { HexAddress, ProcessedPoolItem } from '@/types/gtx/clob';
import { useQuery } from '@tanstack/react-query';
import { GTX_GRAPHQL_URL } from '@/constants/subgraph-url';
import { getUseSubgraph } from '@/utils/env';
import request from 'graphql-request';
import { DEFAULT_CHAIN } from '@/constants/contract/contract-address';
import { useChainId, useReadContract } from 'wagmi';
import {
  poolsPonderQuery,
  PoolsPonderResponse,
  poolsQuery,
  PoolsResponse,
  PoolItem as GraphQLPoolItem,
} from '@/graphql/gtx/clob';
import { usePathname } from 'next/navigation';
import ERC20ABI from '@/abis/tokens/TokenABI';
import { wagmiConfig } from '@/configs/wagmi';
import { getContractAddress, ContractName } from '@/constants/contract/contract-address';
import { toast } from 'sonner';
import { formatNumber } from '@/lib/utils';
import { FEATURE_FLAGS } from '@/constants/features/features-config';

interface Asset {
  symbol: string;
  balance: string;
  icon: React.ReactNode;
}

interface RightPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  loading?: boolean;
  txHash?: string;
  onClose?: () => void;
}

function shortenAddress(
  address: string | undefined | null,
  startLength: number = 6,
  endLength: number = 4
): string {
  if (!address) return '';
  if (address.length <= startLength + endLength) return address;

  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

const EmbededPanel: React.FC<RightPanelProps> = ({ isOpen, onClose }) => {
  const panelRef = useRef<HTMLDivElement>(null);

  const { logout, exportWallet } = usePrivy();
  const { wallets } = useWallets();

  const embeddedWallet = wallets.find(wallet => wallet.walletClientType === 'privy');
  const externalWallet = wallets.find(wallet => wallet.walletClientType !== 'privy');

  const externalWalletAddress = externalWallet?.address || 'Not Connected';
  const embeddedWalletAddress = embeddedWallet?.address || 'Not Created';

  // Close panel when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const [activeTab, setActiveTab] = useState<'Asset' | 'Deposit' | 'Withdraw'>('Deposit');
  const [hideDust, setHideDust] = useState(false);

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawToDifferentWallet, setWithdrawToDifferentWallet] = useState(false);
  const [withdrawWallet, setwithdrawWallet] = useState(externalWalletAddress);
  const [depositAmount, setDepositAmount] = useState<string>('');

  useEffect(() => {
    if (externalWallet) {
      setwithdrawWallet(externalWallet.address);
    }
  }, [externalWallet]);

  // Chain management functionality
  const availableChains = wagmiConfig.chains.map(chain => ({
    id: chain.id,
    name: chain.name,
    shortName: chain.name.split(' ')[0], // "Rise Testnet" -> "Rise"
    testnet: chain.testnet || false
  }));

  const parseChainId = (chainId: string | undefined): number | undefined => {
    if (!chainId) return undefined;
    return parseInt(chainId.replace('eip155:', ''));
  };

  const embeddedWalletChainId = parseChainId(embeddedWallet?.chainId);
  const externalWalletChainId = parseChainId(externalWallet?.chainId);
  const currentChain = availableChains.find(chain => chain.id === embeddedWalletChainId);

  const [switchingChain, setSwitchingChain] = useState(false);

  const switchEmbeddedChain = async (targetChainId: number): Promise<boolean> => {
    if (!embeddedWallet) {
      toast.error('No embedded wallet found');
      return false;
    }
    
    if (embeddedWalletChainId === targetChainId) {
      toast.info('Already on the selected network');
      return true;
    }

    setSwitchingChain(true);
    try {
      await embeddedWallet.switchChain(targetChainId);
      
      const chainInfo = availableChains.find(chain => chain.id === targetChainId);
      toast.success(`Switched to ${chainInfo?.name || `Chain ${targetChainId}`}`);
      
      // Refresh balances after successful chain switch
      setTimeout(() => {
        refetchMUSDC();
        refetchMWETH();
      }, 1000);
      
      return true;
    } catch (error: any) {
      console.error('Failed to switch chain:', error);
      
      if (error.message?.includes('not configured')) {
        toast.error('Network not supported');
      } else if (error.message?.includes('rejected') || error.message?.includes('denied')) {
        toast.error('Network switch cancelled');
      } else {
        toast.error('Failed to switch network');
      }
      return false;
    } finally {
      setSwitchingChain(false);
    }
  };

  // Get token addresses for current chain (with fallback)
  const getTokenAddressForChain = (chainId: number | undefined, contractName: ContractName) => {
    try {
      return chainId ? getContractAddress(chainId, contractName) : null;
    } catch (error) {
      console.warn(`No ${contractName} address for chain ${chainId}`);
      return null;
    }
  };

  const { selectedPoolId, setSelectedPoolId, setBaseDecimals, setQuoteDecimals } = useMarketStore();
  const [mounted, setMounted] = useState(false);
  const [selectedPool, setSelectedPool] = useState<ProcessedPoolItem>();
  const [symbol, setSymbol] = useState<string>('');
  const chainId = useChainId();
  const defaultChainId = Number(DEFAULT_CHAIN);
  const pathname = usePathname();

  const {
    data: poolsData,
    isLoading: poolsLoading,
    error: poolsError,
  } = useQuery<PoolsResponse | PoolsPonderResponse>({
    queryKey: ['pools', String(chainId ?? defaultChainId)],
    queryFn: async () => {
      const currentChainId = Number(chainId ?? defaultChainId);
      const url = GTX_GRAPHQL_URL(currentChainId);
      if (!url) throw new Error('GraphQL URL not found');
      return await request(url, getUseSubgraph() ? poolsQuery : poolsPonderQuery);
    },
    refetchInterval: 60000,
    staleTime: 60000,
  });

  const processPool = (pool: GraphQLPoolItem): ProcessedPoolItem => {
    const { baseCurrency, quoteCurrency, ...other } = pool;
    return {
      ...other,
      baseTokenAddress: baseCurrency.address,
      quoteTokenAddress: quoteCurrency.address,
      baseSymbol: baseCurrency.symbol,
      quoteSymbol: quoteCurrency.symbol,
      baseDecimals: baseCurrency.decimals,
      quoteDecimals: quoteCurrency.decimals,
    };
  };

  useEffect(() => {
    if (!mounted || !poolsData) return;

    const processPools = async () => {
      const pools = 'pools' in poolsData ? poolsData.pools : poolsData.poolss.items;

      const processedPoolsArray = getUseSubgraph()
        ? pools.map(pool => processPool(pool))
        : pools.map(pool => {
            return processPool(pool);
          });

      const urlParts = pathname?.split('/') || [];
      const poolIdFromUrl = urlParts.length >= 3 ? urlParts[2] : null;

      let selectedPoolItem = processedPoolsArray.find(
        p => p.id === (poolIdFromUrl || selectedPoolId)
      );

      console.log('selected Pool Item', selectedPoolItem);

      if (!selectedPoolItem) {
        selectedPoolItem =
          processedPoolsArray.find(
            p =>
              p.coin?.toLowerCase() === 'weth/usdc' ||
              (p.baseSymbol?.toLowerCase() === 'weth' &&
                p.quoteSymbol?.toLowerCase() === 'usdc')
          ) || processedPoolsArray[0];
      }

      if (selectedPoolItem) {
        setSelectedPoolId(selectedPoolItem.id);
        setSelectedPool(selectedPoolItem);
        setSymbol(selectedPoolItem.coin);

        setBaseDecimals(selectedPoolItem.baseDecimals ?? 18);
        setQuoteDecimals(selectedPoolItem.quoteDecimals ?? 6);
      }
    };

    processPools();
  }, [mounted, poolsData, pathname, selectedPoolId]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const baseCurrency = selectedPool?.baseTokenAddress as HexAddress;
  const quoteCurrency = selectedPool?.quoteTokenAddress as HexAddress; //0x97668aec1d8deaf34d899c4f6683f9ba877485f6

  const addressMWETH = '0x05d889798a21c3838d7ff6f67cd46b576dab2174';
  // const addressMUSDC = '0xa652aede05d70c1aff00249ac05a9d021f9d30c2';
  const addressMUSDC = '0x97668aec1d8deaf34d899c4f6683f9ba877485f6';

  const {
    formattedBalance: BalanceOfMUSDC,
    tokenSymbol: SymbolMUSDC,
    refetchBalance: refetchMUSDC,
  } = useTokenBalance(quoteCurrency, embeddedWalletAddress as `0x${string}`);
  const {
    formattedBalance: BalanceOfMWETH,
    tokenSymbol: SymbolMWETH,
    refetchBalance: refetchMWETH,
  } = useTokenBalance(baseCurrency, embeddedWalletAddress as `0x${string}`);
  /*
  const {
    formattedBalance: BalanceOfETH,
    tokenSymbol: SymbolETH,
    refetchBalance: refetchETH,
  } = useTokenBalance(
    '0xc4CebF58836707611439e23996f4FA4165Ea6A28',
    embeddedWalletAddress as `0x${string}`
  );
  console.log(BalanceOfETH);

  const ethAddress = '0x4200000000000000000000000000000000000006';
  const wethaddres = '0x567a076beef17758952b05b1bc639e6cdd1a31ec';
  */

  let assets: Asset[] = [];

  if (
    BalanceOfMUSDC !== null &&
    SymbolMUSDC !== null &&
    BalanceOfMWETH !== null &&
    SymbolMWETH !== null
  ) {
    assets = [
      {
        symbol: SymbolMUSDC,
        balance: `${formatNumber(Number(BalanceOfMUSDC), {decimals: 2, compact: true})} ${SymbolMUSDC}`,
        icon: (
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            M
          </div>
        ),
      },
      {
        symbol: SymbolMWETH,
        balance: `${formatNumber(Number(BalanceOfMWETH), {decimals: 2, compact: true})} ${SymbolMWETH}`,
        icon: (
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            M
          </div>
        ),
      }
    ];
  }

  const [selectedDepositToken, setSelectedDepositToken] = useState('MUSDC');
  const [isDepositDropdownOpen, setIsDepositDropdownOpen] = useState(false);
  const [selectedWithdrawToken, setSelectedWithdrawToken] = useState('MUSDC');
  const [isWithdrawDropdownOpen, setIsWithdrawDropdownOpen] = useState(false);

  const tokens = [
    { symbol: 'MUSDC', name: 'MUSDC', color: 'bg-blue-500', initial: 'M' },
    { symbol: 'ETH', name: 'ETH', color: 'bg-gray-600', initial: 'E' },
  ];

  const currentDepositToken = tokens.find(token => token.symbol === selectedDepositToken);
  const currentWithdrawToken = tokens.find(
    token => token.symbol === selectedWithdrawToken
  );

  const handleDepositTokenSelect = (tokenSymbol: string) => {
    setSelectedDepositToken(tokenSymbol);
    setIsDepositDropdownOpen(false);
  };

  const handleWithdrawTokenSelect = (tokenSymbol: string) => {
    setSelectedWithdrawToken(tokenSymbol);
    setIsWithdrawDropdownOpen(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  const {
    deposit: privyDeposit,
    loading: depositloading,
    currentStep: depositCurrentStep,
    error: depositError,
    resetState: depositResetState,
  } = usePrivyDeposit();
  const {
    deposit: crosschainDeposit,
    loading: crosschainDepositLoading,
    currentStep: crosschainDepositCurrentStep,
    error: crosschainDepositError,
    resetState: crosschainDepositResetState,
  } = useCrosschainDeposit();
  const {
    withdraw: privyWithdraw,
    loading: withdrawLoading,
    currentStep: withdrawCurrentStep,
    error: withdrawError,
    resetState: withdrawResetState,
  } = usePrivyWithdraw();

  const [toast, setToast] = useState<ToastProps | null>(null);

  const handlePrivyDeposit = () => {
    setToast({
      message: `Depositing ${depositAmount} ${SymbolMUSDC}...`,
      type: 'info',
      loading: true,
      duration: 0,
    });

    if (FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED) {
      crosschainDeposit(depositAmount, quoteCurrency, embeddedWalletAddress as `0x${string}`);
    } else {
      privyDeposit(depositAmount, quoteCurrency);
    }
    
    setTimeout(() => {
      refetchMUSDC();
      refetchMWETH();
    }, 1000);
  };

  const handlePrivyWithdraw = () => {
    setToast({
      message: `Withdrawing ${withdrawAmount} ${SymbolMUSDC}...`,
      type: 'info',
      loading: true,
      duration: 0,
    });

    privyWithdraw(withdrawWallet, withdrawAmount, quoteCurrency);
    setTimeout(() => {
      refetchMUSDC();
      refetchMWETH();
    }, 1000);
  };

  useEffect(() => {
    if (depositCurrentStep === 'Transaction submitted successfully!' || crosschainDepositCurrentStep === 'Crosschain deposit submitted successfully!') {
      depositResetState();
      crosschainDepositResetState();
      setDepositAmount('');
      refetchMUSDC();
    }
  }, [depositCurrentStep, crosschainDepositCurrentStep]);

  // Toast management for withdraw flow
  useEffect(() => {
    if (withdrawCurrentStep === 'Transaction submitted successfully!') {
      withdrawResetState();
      setWithdrawAmount('');
      refetchMUSDC();
    }
  }, [withdrawCurrentStep]);

  useEffect(() => {
    const interval = setInterval(() => {
      refetchMUSDC();
      refetchMWETH();
    }, 10000);

    return () => clearInterval(interval);
  }, [refetchMUSDC, refetchMWETH]);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={onClose} // Close panel when overlay is clicked
        aria-hidden={!isOpen} // Hide from accessibility tree when invisible
      ></div>

      <aside
        ref={panelRef}
        className={`fixed top-0 right-0 h-full w-[] bg-[#18191B] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          flex flex-col rounded-l-lg
        `}
        role="dialog"
        aria-modal="true"
        aria-label="Side navigation panel"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold">GTX Wallet</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-fit border-b border-dashed border-gray-400">
                <GTXTooltip
                  text="Wallet used to create your account"
                  width={236}
                  position="center"
                >
                  <span className="text-sm text-gray-300">Login wallet</span>
                </GTXTooltip>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div>
                <img
                  src={externalWallet?.meta.icon}
                  alt="Wallet Icon"
                  height={20}
                  width={20}
                />
              </div>
              <span className="text-sm text-gray-300">
                {shortenAddress(externalWalletAddress)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-gray-300 font-medium">GTX wallet</span>
              <QrCode size={16} className="text-gray-400" />
              <Edit3 size={16} className="text-gray-400" />
            </div>
            
            {/* Network Switcher */}
            <div className="relative">
              <select
                value={embeddedWalletChainId || 11155931}
                onChange={(e) => switchEmbeddedChain(parseInt(e.target.value))}
                disabled={switchingChain}
                className="bg-gray-700 text-white text-xs border border-gray-600 rounded px-2 py-1 pr-6 appearance-none focus:outline-none focus:border-blue-500 disabled:opacity-50"
              >
                {availableChains.map(chain => (
                  <option key={chain.id} value={chain.id}>
                    {chain.shortName}
                  </option>
                ))}
              </select>
              <div className="absolute right-1 top-1/2 transform -translate-y-1/2 pointer-events-none">
                {switchingChain ? (
                  <RefreshCw size={10} className="animate-spin text-gray-400" />
                ) : (
                  <ChevronDown size={10} className="text-gray-400" />
                )}
              </div>
            </div>
          </div>

          {/* Current Network Info */}
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
            <Wifi size={12} />
            <span>{currentChain?.name || 'Unknown Network'}</span>
            {currentChain?.testnet && (
              <span className="bg-yellow-600 text-yellow-100 px-1 py-0.5 rounded text-xs">Testnet</span>
            )}
          </div>

          <div className="mt-3 border border-gray-600 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm text-gray-300 font-mono break-all">
              {embeddedWalletAddress}
            </span>
            <button
              onClick={() => copyToClipboard(embeddedWalletAddress)}
              className="ml-2 p-1 hover:bg-gray-700 rounded"
            >
              <Copy size={16} className="text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex border-b border-gray-700">
          {(['Asset', 'Deposit', 'Withdraw'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === tab
                  ? 'text-[#00B4C8] border-b-2 border-[#00B4C8]'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto h-96">
          {activeTab === 'Asset' && (
            <div className="p-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Portfolio</h3>
                <div className="text-2xl font-bold">$0</div>
              </div>

              <div className="mb-4 flex flex-row items-center justify-between">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search tokens"
                    className="w-full bg-transparent border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-sm placeholder-gray-400 focus:outline-none focus:border-green-400"
                  />
                </div>

                <div className="flex items-center justify-end">
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <span>Hide dust</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={hideDust}
                        onChange={e => setHideDust(e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className={`w-6 h-6 border-2 rounded cursor-pointer ${
                          hideDust ? 'bg-green-400 border-green-400' : 'border-gray-400'
                        }`}
                      >
                        {hideDust && (
                          <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                            ✓
                          </div>
                        )}
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                {assets.map((asset, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      {asset.icon}
                      <span className="font-medium">{asset.symbol}</span>
                    </div>
                    <span className="text-gray-300">{asset.balance}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Deposit' && (
            <div className="p-4">
              <div className="mb-6">
                <div className="text-sm text-gray-400 mb-3">
                  From connected wallet: {shortenAddress(externalWalletAddress)}
                </div>

                <div className="mb-4 p-4 border border-gray-600 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="relative">
                      <div
                        className="flex items-center gap-3 cursor-pointer hover:bg-gray-800 rounded-lg p-2 -m-2 transition-colors"
                        onClick={() => setIsDepositDropdownOpen(!isDepositDropdownOpen)}
                      >
                        <div
                          className={`w-8 h-8 ${currentDepositToken?.color} rounded-full flex items-center justify-center text-white font-medium`}
                        >
                          {currentDepositToken?.initial}
                        </div>
                        <span className="text-white font-medium">
                          {currentDepositToken?.name}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-gray-400 transition-transform ${
                            isDepositDropdownOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </div>

                      {isDepositDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 bg-gray-800 rounded-lg shadow-lg border border-gray-700 min-w-[140px] z-10">
                          {tokens.map(token => (
                            <div
                              key={token.symbol}
                              className="flex items-center gap-3 p-3 hover:bg-gray-700 cursor-pointer first:rounded-t-lg last:rounded-b-lg transition-colors"
                              onClick={() => handleDepositTokenSelect(token.symbol)}
                            >
                              <div
                                className={`w-6 h-6 ${token.color} rounded-full flex items-center justify-center text-white text-sm font-medium`}
                              >
                                {token.initial}
                              </div>
                              <span className="text-white font-medium">{token.name}</span>
                              {selectedDepositToken === token.symbol && (
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
                      onChange={e => {
                        setDepositAmount(e.target.value);
                      }}
                      className="outline-none bg-transparent text-right font-medium w-full ml-4"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <CreditCard size={14} />
                    <span>{formatNumber(Number(BalanceOfMUSDC), {decimals: 2, compact: true})}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center mb-6">
                <div className="p-2">
                  <ChevronDown size={36} className="text-[#00B4C8]" />
                </div>
              </div>

              <div className="mb-6">
                <div className="text-sm text-gray-400 mb-3">To your GTX wallet</div>
                <div className="border border-gray-600 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-sm text-gray-300 font-mono break-all">
                    {embeddedWalletAddress}
                  </span>
                  <button
                    onClick={() => copyToClipboard(embeddedWalletAddress)}
                    className="ml-2 p-1 hover:bg-gray-700 rounded"
                  >
                    <Copy size={16} className="text-gray-400" />
                  </button>
                </div>
              </div>

              <button
                onClick={handlePrivyDeposit}
                className="w-full bg-[#0078D4] hover:bg-[#0064C8] text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200"
              >
                {(depositloading && depositCurrentStep !== 'Transaction submitted successfully!') || 
                (crosschainDepositLoading && crosschainDepositCurrentStep !== 'Crosschain deposit submitted successfully!') ? (
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED ? 'Processing Crosschain Deposit...' : 'Depositing...'}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>{FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED ? 'Crosschain Deposit' : 'Deposit'}</span>
                  </div>
                )}
              </button>
            </div>
          )}

          {activeTab === 'Withdraw' && (
            <div className="p-4">
              <div className="mb-6">
                <div className="text-sm text-gray-400 mb-3">From your GTX wallet</div>
                <div className="border border-gray-600 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-sm text-gray-300 font-mono break-all">
                    {embeddedWalletAddress}
                  </span>
                  <button
                    onClick={() => copyToClipboard(embeddedWalletAddress)}
                    className="ml-2 p-1 hover:bg-gray-700 rounded"
                  >
                    <Copy size={16} className="text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="flex justify-center mb-6">
                <div className="p-2">
                  <ChevronDown size={36} className="text-[#00B4C8]" />
                </div>
              </div>

              <div className="mb-6">
                <div className="text-sm text-gray-400 mb-3">
                  Send to login wallet: {shortenAddress(externalWalletAddress)}
                </div>

                <div className="mb-4 p-4 border border-gray-600 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="relative">
                      <div
                        className="flex items-center gap-3 cursor-pointer hover:bg-gray-800 rounded-lg p-2 -m-2 transition-colors"
                        onClick={() => setIsWithdrawDropdownOpen(!isWithdrawDropdownOpen)}
                      >
                        <div
                          className={`w-8 h-8 ${currentWithdrawToken?.color} rounded-full flex items-center justify-center text-white font-medium`}
                        >
                          {currentWithdrawToken?.initial}
                        </div>
                        <span className="text-white font-medium">
                          {currentWithdrawToken?.name}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-gray-400 transition-transform ${
                            isWithdrawDropdownOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </div>

                      {isWithdrawDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 bg-gray-800 rounded-lg shadow-lg border border-gray-700 min-w-[140px] z-10">
                          {tokens.map(token => (
                            <div
                              key={token.symbol}
                              className="flex items-center gap-3 p-3 hover:bg-gray-700 cursor-pointer first:rounded-t-lg last:rounded-b-lg transition-colors"
                              onClick={() => handleWithdrawTokenSelect(token.symbol)}
                            >
                              <div
                                className={`w-6 h-6 ${token.color} rounded-full flex items-center justify-center text-white text-sm font-medium`}
                              >
                                {token.initial}
                              </div>
                              <span className="text-white font-medium">{token.name}</span>
                              {selectedWithdrawToken === token.symbol && (
                                <div className="w-2 h-2 bg-blue-400 rounded-full ml-auto"></div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={withdrawAmount}
                      onChange={e => setWithdrawAmount(e.target.value)}
                      className="bg-transparent text-white text-right font-medium outline-none w-full ml-4"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <CreditCard size={14} />
                    <span>{formatNumber(Number(BalanceOfMUSDC), {decimals: 2, compact: true})}</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={withdrawToDifferentWallet}
                    onChange={e => setWithdrawToDifferentWallet(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 border-2 rounded transition-colors duration-200 ${
                      withdrawToDifferentWallet
                        ? 'bg-green-400 border-green-400'
                        : 'border-gray-400'
                    }`}
                  >
                    {withdrawToDifferentWallet && (
                      <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                        ✓
                      </div>
                    )}
                  </div>
                  <span>Withdraw to a different wallet</span>
                </label>

                {withdrawToDifferentWallet && (
                  <div className="mt-3">
                    <input
                      type="text"
                      placeholder="0x0000...0000"
                      value={withdrawWallet}
                      onChange={e => setwithdrawWallet(e.target.value)}
                      className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-2 text-sm placeholder-gray-400 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <button
                onClick={handlePrivyWithdraw}
                disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 ${
                  !withdrawAmount || parseFloat(withdrawAmount) <= 0
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-[#0078D4] hover:bg-[#0064C8] text-white'
                }`}
              >
                {withdrawLoading &&
                withdrawCurrentStep !== 'Transaction submitted successfully!' ? (
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>Send</span>
                  </div>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-700 flex gap-3">
          <button
            onClick={exportWallet}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <Key size={16} />
            Export Key
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            Disconnect
          </button>
        </div>
      </aside>
    </>
  );
};

export default EmbededPanel;
