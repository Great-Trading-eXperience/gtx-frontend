import { wagmiConfig } from '@/configs/wagmi';
import { ContractName, DEFAULT_CHAIN, getContractAddress } from '@/constants/contract/contract-address';
import { FEATURE_FLAGS, getCoreChain, getSupportedCrosschainDepositChainNames, isCrosschainSupportedChain, shouldUseCoreChainBalance } from '@/constants/features/features-config';
import { GTX_GRAPHQL_URL } from '@/constants/subgraph-url';
import {
  PoolItem as GraphQLPoolItem,
  poolsPonderQuery,
  PoolsPonderResponse,
  poolsQuery,
  PoolsResponse,
} from '@/graphql/gtx/clob';
import { useTokenBalance } from '@/hooks/web3/gtx/clob-dex/embedded-wallet/useBalanceOf';
import { useBalanceManagerBalance } from '@/hooks/web3/gtx/clob-dex/embedded-wallet/useBalanceManagerBalance';
import { useCrosschainDeposit } from '@/hooks/web3/gtx/clob-dex/embedded-wallet/useCrosschainDeposit';
import { usePrivyDeposit } from '@/hooks/web3/gtx/clob-dex/embedded-wallet/usePrivyDeposit';
import { usePrivyWithdraw } from '@/hooks/web3/gtx/clob-dex/embedded-wallet/usePrivyWithdraw';
import { formatNumber } from '@/lib/utils';
import { useMarketStore } from '@/store/market-store';
import { HexAddress, ProcessedPoolItem } from '@/types/gtx/clob';
import { getUseSubgraph } from '@/utils/env';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import request from 'graphql-request';
import {
  ChevronDown,
  Copy,
  CreditCard,
  Edit3,
  Key,
  LogOut,
  QrCode,
  RefreshCw,
  Search,
  Wifi,
  X
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { toast as toastSonner } from 'sonner';
import { useChainId, useReadContract } from 'wagmi';
import ERC20ABI from '@/abis/tokens/TokenABI';
import GTXTooltip from '../clob-dex/place-order/tooltip';

interface Asset {
  symbol: string;
  balance: string;
  icon: React.ReactNode;
  address?: string;
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
  const allChains = wagmiConfig.chains.map(chain => ({
    id: chain.id,
    name: chain.name,
    shortName: chain.name.split(' ')[0], // "Rise Testnet" -> "Rise"
    testnet: chain.testnet || false
  }));

  // Filter chains based on crosschain deposit feature
  const availableChains = FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED 
    ? allChains.filter(chain => isCrosschainSupportedChain(chain.id))
    : allChains;

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
      setToast({
        message: 'No embedded wallet found',
        type: 'error',
        loading: false,
        duration: 5000,
      });
      return false;
    }
    
    if (embeddedWalletChainId === targetChainId) {
      setToast({
        message: 'Already on the selected network',
        type: 'info',
        loading: false,
        duration: 3000,
      });
      return true;
    }

    setSwitchingChain(true);
    try {
      await embeddedWallet.switchChain(targetChainId);
      
      const chainInfo = availableChains.find(chain => chain.id === targetChainId);
      setToast({
        message: `Switched to ${chainInfo?.name || `Chain ${targetChainId}`}`,
        type: 'success',
        loading: false,
        duration: 3000,
      });
      
      // Refresh balances after successful chain switch
      setTimeout(() => {
        refetchAllBalances();
      }, 1000);
      
      return true;
    } catch (error: any) {
      console.error('Failed to switch chain:', error);
      
      if (error.message?.includes('not configured')) {
        toastSonner.error('Network not supported');
      } else if (error.message?.includes('rejected') || error.message?.includes('denied')) {
        toastSonner.error('Network switch cancelled');
      } else {
        toastSonner.error('Failed to switch network');
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
  const quoteCurrency = selectedPool?.quoteTokenAddress as HexAddress;

  const balanceDisplayChainId = getCoreChain();
  
  // Get token addresses for the balance display chain
  const getTokenAddressForBalanceChain = (contractName: ContractName) => {
    try {
      return balanceDisplayChainId ? getContractAddress(balanceDisplayChainId, contractName) : quoteCurrency;
    } catch (error) {
      console.warn(`No ${contractName} address for chain ${balanceDisplayChainId}, using fallback`);
      return contractName === ContractName.usdc ? quoteCurrency : baseCurrency;
    }
  };

  // Extract unique tokens from pools data
  const [uniqueTokens, setUniqueTokens] = useState<Array<{
    address: HexAddress;
    symbol: string;
    decimals: number;
    isQuote: boolean;
  }>>([]);

  useEffect(() => {
    if (!poolsData || !selectedPool) return;

    const pools = 'pools' in poolsData ? poolsData.pools : poolsData.poolss.items;
    const processedPools = pools.map(pool => processPool(pool));
    
    // Extract unique tokens (base and quote) from all pools
    const tokenMap = new Map<string, {address: HexAddress, symbol: string, decimals: number, isQuote: boolean}>();
    
    processedPools.forEach(pool => {
      // Add base token
      if (pool.baseTokenAddress && pool.baseSymbol) {
        tokenMap.set(pool.baseTokenAddress.toLowerCase(), {
          address: pool.baseTokenAddress as HexAddress,
          symbol: pool.baseSymbol,
          decimals: pool.baseDecimals ?? 18,
          isQuote: false
        });
      }
      
      // Add quote token
      if (pool.quoteTokenAddress && pool.quoteSymbol) {
        tokenMap.set(pool.quoteTokenAddress.toLowerCase(), {
          address: pool.quoteTokenAddress as HexAddress,
          symbol: pool.quoteSymbol,
          decimals: pool.quoteDecimals ?? 6,
          isQuote: true
        });
      }
    });

    setUniqueTokens(Array.from(tokenMap.values()));
  }, [poolsData, selectedPool]);

  // Hardcoded token mapping for crosschain deposits
  // Source wallet uses appchain addresses, destination wallet (GTX) uses rari addresses
  const HARDCODED_TOKENS = [
    // USDT
    {
      address: '0xf2dc96d3e25f06e7458fF670Cf1c9218bBb71D9d' as HexAddress, // rari address for destination
      symbol: 'USDT',
      decimals: 6,
      isQuote: true,
      chainId: embeddedWalletChainId || balanceDisplayChainId,
      sourceAddress: '0x1362Dd75d8F1579a0Ebd62DF92d8F3852C3a7516' as HexAddress // appchain for source
    },
    // WETH  
    {
      address: '0x3ffE82D34548b9561530AFB0593d52b9E9446fC8' as HexAddress, // rari address for destination
      symbol: 'WETH',
      decimals: 18,
      isQuote: false,
      chainId: embeddedWalletChainId || balanceDisplayChainId,
      sourceAddress: '0x02950119C4CCD1993f7938A55B8Ab8384C3CcE4F' as HexAddress // appchain for source
    },
    // WBTC
    {
      address: '0xd99813A6152dBB2026b2Cd4298CF88fAC1bCf748' as HexAddress, // rari address for destination
      symbol: 'WBTC', 
      decimals: 8,
      isQuote: false,
      chainId: embeddedWalletChainId || balanceDisplayChainId,
      sourceAddress: '0xb2e9Eabb827b78e2aC66bE17327603778D117d18' as HexAddress // appchain for source
    }
  ];

  // For crosschain: use ONLY hardcoded tokens, ignore pool tokens completely
  // For non-crosschain: use only pool tokens
  const allUniqueTokens = FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED 
    ? HARDCODED_TOKENS
    : uniqueTokens;


  // Get up to 5 tokens for balance hooks (to respect React hooks rules)
  // Use allUniqueTokens which includes hardcoded tokens
  const token0 = allUniqueTokens[0];
  const token1 = allUniqueTokens[1];
  const token2 = allUniqueTokens[2];
  const token3 = allUniqueTokens[3];
  const token4 = allUniqueTokens[4];

  // Create hooks for token 0 (GTX wallet balances)
  const token0Balance = useTokenBalance(
    token0?.address,
    embeddedWalletAddress as `0x${string}`,
    balanceDisplayChainId
  );
  const token0BalanceManager = useBalanceManagerBalance(
    embeddedWalletAddress as `0x${string}`,
    token0?.address,
    balanceDisplayChainId,
    token0?.decimals || 18
  );
  
  // Create hooks for token 0 (External wallet balances)
  // Use sourceAddress for crosschain tokens (source wallet), otherwise use regular address
  const token0ExternalBalance = useTokenBalance(
    (token0 as any)?.sourceAddress || token0?.address,
    externalWalletAddress as `0x${string}`,
    embeddedWalletChainId || balanceDisplayChainId
  );
  
  // Create hooks for token 0 (BalanceManager on connected chain - for crosschain deposits)
  const token0ExternalBalanceManager = useBalanceManagerBalance(
    externalWalletAddress as `0x${string}`,
    (token0 as any)?.sourceAddress || token0?.address,
    embeddedWalletChainId || balanceDisplayChainId,
    token0?.decimals || 18
  );

  // Create hooks for token 1 (GTX wallet balances)
  const token1Balance = useTokenBalance(
    token1?.address,
    embeddedWalletAddress as `0x${string}`,
    balanceDisplayChainId
  );
  const token1BalanceManager = useBalanceManagerBalance(
    embeddedWalletAddress as `0x${string}`,
    token1?.address,
    balanceDisplayChainId,
    token1?.decimals || 18
  );
  
  // Create hooks for token 1 (External wallet balances)
  const token1ExternalBalance = useTokenBalance(
    (token1 as any)?.sourceAddress || token1?.address,
    externalWalletAddress as `0x${string}`,
    embeddedWalletChainId || balanceDisplayChainId
  );
  
  // Create hooks for token 1 (BalanceManager on connected chain - for crosschain deposits)
  const token1ExternalBalanceManager = useBalanceManagerBalance(
    externalWalletAddress as `0x${string}`,
    (token1 as any)?.sourceAddress || token1?.address,
    embeddedWalletChainId || balanceDisplayChainId,
    token1?.decimals || 18
  );

  // Create hooks for token 2 (GTX wallet balances)
  const token2Balance = useTokenBalance(
    token2?.address,
    embeddedWalletAddress as `0x${string}`,
    balanceDisplayChainId
  );
  const token2BalanceManager = useBalanceManagerBalance(
    embeddedWalletAddress as `0x${string}`,
    token2?.address,
    balanceDisplayChainId,
    token2?.decimals || 18
  );
  
  // Create hooks for token 2 (External wallet balances)
  const token2ExternalBalance = useTokenBalance(
    (token2 as any)?.sourceAddress || token2?.address,
    externalWalletAddress as `0x${string}`,
    embeddedWalletChainId || balanceDisplayChainId
  );
  
  // Create hooks for token 2 (BalanceManager on connected chain - for crosschain deposits)
  const token2ExternalBalanceManager = useBalanceManagerBalance(
    externalWalletAddress as `0x${string}`,
    (token2 as any)?.sourceAddress || token2?.address,
    embeddedWalletChainId || balanceDisplayChainId,
    token2?.decimals || 18
  );

  // Create hooks for token 3 (GTX wallet balances)
  const token3Balance = useTokenBalance(
    token3?.address,
    embeddedWalletAddress as `0x${string}`,
    balanceDisplayChainId
  );
  const token3BalanceManager = useBalanceManagerBalance(
    embeddedWalletAddress as `0x${string}`,
    token3?.address,
    balanceDisplayChainId,
    token3?.decimals || 18
  );
  
  // Create hooks for token 3 (External wallet balances)
  const token3ExternalBalance = useTokenBalance(
    (token3 as any)?.sourceAddress || token3?.address,
    externalWalletAddress as `0x${string}`,
    embeddedWalletChainId || balanceDisplayChainId
  );
  
  // Create hooks for token 3 (BalanceManager on connected chain - for crosschain deposits)
  const token3ExternalBalanceManager = useBalanceManagerBalance(
    externalWalletAddress as `0x${string}`,
    (token3 as any)?.sourceAddress || token3?.address,
    embeddedWalletChainId || balanceDisplayChainId,
    token3?.decimals || 18
  );

  // Create hooks for token 4 (GTX wallet balances)
  const token4Balance = useTokenBalance(
    token4?.address,
    embeddedWalletAddress as `0x${string}`,
    balanceDisplayChainId
  );
  const token4BalanceManager = useBalanceManagerBalance(
    embeddedWalletAddress as `0x${string}`,
    token4?.address,
    balanceDisplayChainId,
    token4?.decimals || 18
  );
  
  // Create hooks for token 4 (External wallet balances)
  const token4ExternalBalance = useTokenBalance(
    (token4 as any)?.sourceAddress || token4?.address,
    externalWalletAddress as `0x${string}`,
    embeddedWalletChainId || balanceDisplayChainId
  );
  
  // Create hooks for token 4 (BalanceManager on connected chain - for crosschain deposits)
  const token4ExternalBalanceManager = useBalanceManagerBalance(
    externalWalletAddress as `0x${string}`,
    (token4 as any)?.sourceAddress || token4?.address,
    embeddedWalletChainId || balanceDisplayChainId,
    token4?.decimals || 18
  );

  // Aggregate token balances
  const tokenBalances = [
    token0 && {
      token: token0,
      tokenBalance: token0Balance.formattedBalance,
      balanceManagerBalance: token0BalanceManager.formattedBalance,
      externalBalance: token0ExternalBalance.formattedBalance,
      externalBalanceManagerBalance: token0ExternalBalanceManager.formattedBalance,
      displayBalance: FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED 
        ? token0BalanceManager.formattedBalance 
        : token0Balance.formattedBalance,
      symbol: token0Balance.tokenSymbol || token0.symbol,
      refetch: () => {
        token0Balance.refetchBalance();
        token0ExternalBalance.refetchBalance();
        token0ExternalBalanceManager.refetch();
        if (FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED) {
          token0BalanceManager.refetch();
        }
      }
    },
    token1 && {
      token: token1,
      tokenBalance: token1Balance.formattedBalance,
      balanceManagerBalance: token1BalanceManager.formattedBalance,
      externalBalance: token1ExternalBalance.formattedBalance,
      externalBalanceManagerBalance: token1ExternalBalanceManager.formattedBalance,
      displayBalance: FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED 
        ? token1BalanceManager.formattedBalance 
        : token1Balance.formattedBalance,
      symbol: token1Balance.tokenSymbol || token1.symbol,
      refetch: () => {
        token1Balance.refetchBalance();
        token1ExternalBalance.refetchBalance();
        token1ExternalBalanceManager.refetch();
        if (FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED) {
          token1BalanceManager.refetch();
        }
      }
    },
    token2 && {
      token: token2,
      tokenBalance: token2Balance.formattedBalance,
      balanceManagerBalance: token2BalanceManager.formattedBalance,
      externalBalance: token2ExternalBalance.formattedBalance,
      externalBalanceManagerBalance: token2ExternalBalanceManager.formattedBalance,
      displayBalance: FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED 
        ? token2BalanceManager.formattedBalance 
        : token2Balance.formattedBalance,
      symbol: token2Balance.tokenSymbol || token2.symbol,
      refetch: () => {
        token2Balance.refetchBalance();
        token2ExternalBalance.refetchBalance();
        token2ExternalBalanceManager.refetch();
        if (FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED) {
          token2BalanceManager.refetch();
        }
      }
    },
    token3 && {
      token: token3,
      tokenBalance: token3Balance.formattedBalance,
      balanceManagerBalance: token3BalanceManager.formattedBalance,
      externalBalance: token3ExternalBalance.formattedBalance,
      externalBalanceManagerBalance: token3ExternalBalanceManager.formattedBalance,
      displayBalance: FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED 
        ? token3BalanceManager.formattedBalance 
        : token3Balance.formattedBalance,
      symbol: token3Balance.tokenSymbol || token3.symbol,
      refetch: () => {
        token3Balance.refetchBalance();
        token3ExternalBalance.refetchBalance();
        token3ExternalBalanceManager.refetch();
        if (FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED) {
          token3BalanceManager.refetch();
        }
      }
    },
    token4 && {
      token: token4,
      tokenBalance: token4Balance.formattedBalance,
      balanceManagerBalance: token4BalanceManager.formattedBalance,
      externalBalance: token4ExternalBalance.formattedBalance,
      externalBalanceManagerBalance: token4ExternalBalanceManager.formattedBalance,
      displayBalance: FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED 
        ? token4BalanceManager.formattedBalance 
        : token4Balance.formattedBalance,
      symbol: token4Balance.tokenSymbol || token4.symbol,
      refetch: () => {
        token4Balance.refetchBalance();
        token4ExternalBalance.refetchBalance();
        token4ExternalBalanceManager.refetch();
        if (FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED) {
          token4BalanceManager.refetch();
        }
      }
    }
  ].filter(Boolean); // Remove null entries

  // Unified refetch function for all balances
  const refetchAllBalances = () => {
    tokenBalances.forEach(tb => tb.refetch());
  };

  let assets: Asset[] = [];

  console.log('💰 Dynamic Balance Display Info (Always Core Chain):', {
    balanceDisplayChainId,
    embeddedWalletChainId,
    coreChain: getCoreChain(),
    userAddress: embeddedWalletAddress,
    crosschainEnabled: FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED,
    uniqueTokensCount: uniqueTokens.length,
    uniqueTokens: uniqueTokens.map(t => ({ symbol: t.symbol, address: t.address })),
    tokenBalances: tokenBalances.map(tb => ({
      symbol: tb.symbol,
      tokenBalance: tb.tokenBalance,
      balanceManagerBalance: tb.balanceManagerBalance,
      displayBalance: tb.displayBalance,
    })),
  });

  // Create assets dynamically from all unique tokens found in pools
  if (tokenBalances.length > 0) {
    assets = tokenBalances
      .filter(tb => tb.displayBalance !== null && tb.symbol !== null)
      .map((tb, index) => {
        const colorMap = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 'bg-yellow-500', 'bg-indigo-500'];
        const color = colorMap[index % colorMap.length];
        
        return {
          symbol: tb.symbol,
          balance: `${formatNumber(Number(tb.displayBalance), {decimals: 2, compact: true})} ${tb.symbol}`,
          address: tb.token.address,
          icon: (
            <div className={`w-6 h-6 ${color} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
              {tb.symbol?.charAt(0)?.toUpperCase() || 'T'}
            </div>
          ),
        };
      });
  }

  const [selectedDepositTokenAddress, setSelectedDepositTokenAddress] = useState('');
  const [isDepositDropdownOpen, setIsDepositDropdownOpen] = useState(false);
  const [selectedWithdrawTokenAddress, setSelectedWithdrawTokenAddress] = useState('');
  const [isWithdrawDropdownOpen, setIsWithdrawDropdownOpen] = useState(false);

  // Generate tokens dynamically from merged unique tokens
  const tokens = allUniqueTokens.map((token, index) => {
    const colorMap = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 'bg-yellow-500', 'bg-indigo-500'];
    return {
      symbol: token.symbol,
      name: token.symbol,
      color: colorMap[index % colorMap.length],
      initial: token.symbol.charAt(0).toUpperCase(),
      address: token.address,
      decimals: token.decimals,
    };
  });


  // Set default selected tokens when tokens are loaded
  useEffect(() => {
    if (tokens.length > 0 && !selectedDepositTokenAddress) {
      // For crosschain: prefer hardcoded USDT, then quote tokens
      // For non-crosschain: prefer quote tokens from pools
      let defaultToken;
      if (FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED) {
        // For crosschain, prefer USDT (check by symbol since addresses vary by chain)
        const hardcodedUSDT = tokens.find(t => t.symbol === 'USDT');
        const quoteToken = tokens.find(t => allUniqueTokens.find(ut => ut.address === t.address)?.isQuote);
        defaultToken = hardcodedUSDT || quoteToken || tokens[0];
      } else {
        const quoteToken = tokens.find(t => allUniqueTokens.find(ut => ut.address === t.address)?.isQuote);
        defaultToken = quoteToken || tokens[0];
      }
      console.log('🚀 Setting default token:', { 
        crosschainEnabled: FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED,
        defaultToken: defaultToken.address, 
        symbol: defaultToken.symbol,
        tokensLength: tokens.length 
      });
      setSelectedDepositTokenAddress(defaultToken.address);
      setSelectedWithdrawTokenAddress(defaultToken.address);
    }
  }, [tokens.length, selectedDepositTokenAddress, allUniqueTokens.length]);

  const currentDepositToken = tokens.find(token => token.address === selectedDepositTokenAddress);
  const currentWithdrawToken = tokens.find(
    token => token.address === selectedWithdrawTokenAddress
  );

  // Debug logging
  console.log('🎯 Current token state:', {
    selectedDepositTokenAddress,
    selectedDepositTokenSymbol: currentDepositToken?.symbol,
    currentDepositTokenAddress: currentDepositToken?.address,
    tokensAvailable: tokens.map(t => ({ symbol: t.symbol, address: t.address.slice(0, 8) + '...' })),
    uniqueTokensCount: uniqueTokens.length
  });

  const handleDepositTokenSelect = (tokenAddress: string) => {
    const selectedToken = tokens.find(t => t.address === tokenAddress);
    console.log('🔄 Token selection:', { 
      selectedAddress: tokenAddress, 
      selectedSymbol: selectedToken?.symbol,
      currentSelectedAddress: selectedDepositTokenAddress,
      tokensLength: tokens.length,
      tokens: tokens.map(t => ({ symbol: t.symbol, address: t.address.slice(0, 8) + '...' }))
    });
    setSelectedDepositTokenAddress(tokenAddress);
    setIsDepositDropdownOpen(false);
  };

  const handleWithdrawTokenSelect = (tokenAddress: string) => {
    setSelectedWithdrawTokenAddress(tokenAddress);
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

  const handlePrivyDeposit = async () => {
    console.log('⚡ handlePrivyDeposit: Deposit handler called');
    console.log('⚡ handlePrivyDeposit: CROSSCHAIN_DEPOSIT_ENABLED:', FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED);
    
    setToast({
      message: `Depositing ${depositAmount} ${currentDepositToken?.symbol || 'token'}...`,
      type: 'info',
      loading: true,
      duration: 0,
    });

    if (FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED) {
      console.log('⚡ handlePrivyDeposit: Using CROSSCHAIN DEPOSIT FLOW');
      
      // For crosschain deposits, use the selected chain from the chain selector
      // This is the chain the user wants to deposit from (where ChainBalanceManager should be)
      const selectedChainId = embeddedWalletChainId || defaultChainId; // Chain selected in the UI
      const userExternalChainId = externalWalletChainId;
      
      console.log('⚡ handlePrivyDeposit: selectedChainId (from UI):', selectedChainId);
      console.log('⚡ handlePrivyDeposit: userExternalChainId (current wallet):', userExternalChainId);
      console.log('⚡ handlePrivyDeposit: embeddedWalletChainId:', embeddedWalletChainId);
      console.log('⚡ handlePrivyDeposit: defaultChainId:', defaultChainId);
      
      // Validate that the selected chain supports crosschain deposits
      if (!isCrosschainSupportedChain(selectedChainId)) {
        console.log('⚡ handlePrivyDeposit: Selected chain not supported for crosschain deposits:', selectedChainId);
        const supportedChains = getSupportedCrosschainDepositChainNames().join(', ');
        setToast({
          message: `Selected chain doesn't support crosschain deposits. Please select a supported chain: ${supportedChains}`,
          type: 'error',
          loading: false,
          duration: 8000,
        });
        return;
      }
      
      // Check if external wallet needs to switch chains
      if (userExternalChainId && userExternalChainId !== selectedChainId) {
        console.log('⚡ handlePrivyDeposit: External wallet chain mismatch, attempting to switch');
        console.log('⚡ handlePrivyDeposit: From chain:', userExternalChainId, 'To chain:', selectedChainId);
        
        if (!externalWallet) {
          setToast({
            message: 'External wallet not found. Please connect your wallet.',
            type: 'error',
            loading: false,
            duration: 5000,
          });
          return;
        }
        
        try {
          setToast({
            message: 'Switching external wallet to the selected chain...',
            type: 'info',
            loading: true,
            duration: 0,
          });
          
          console.log('⚡ handlePrivyDeposit: Requesting chain switch to:', selectedChainId);
          
          // First try to switch to the chain
          try {
            await externalWallet.switchChain(selectedChainId);
            console.log('⚡ handlePrivyDeposit: Chain switch successful');
          } catch (switchError: any) {
            console.log('⚡ handlePrivyDeposit: Chain switch failed, trying to add chain first:', switchError);
            
            // If switch fails, try to add the chain first
            if (switchError.message?.includes('Unrecognized chain ID') || switchError.code === 4902) {
              console.log('⚡ handlePrivyDeposit: Adding chain to wallet first');
              
              // Get chain configuration
              const wagmiChain = wagmiConfig.chains.find(chain => chain.id === selectedChainId);
              
              if (!wagmiChain) {
                throw new Error(`Chain configuration not found for chain ID ${selectedChainId}`);
              }
              
              // Get the actual RPC URL based on the mapping from route.ts
              const getRpcUrl = (chainId: number): string => {
                const rpcMapping: Record<number, string> = {
                  4661: 'https://appchain.caff.testnet.espresso.network', // appchain-testnet
                  1918988905: 'https://rari.caff.testnet.espresso.network', // rari-testnet
                  11155931: 'https://testnet.riselabs.xyz', // rise-sepolia
                  911867: 'https://odyssey.ithaca.xyz', // conduit
                };
                return rpcMapping[chainId] || wagmiChain.rpcUrls.default.http[0];
              };
              
              const actualRpcUrl = getRpcUrl(selectedChainId);
              console.log('⚡ handlePrivyDeposit: Using RPC URL for chain', selectedChainId, ':', actualRpcUrl);
              
              // Add the chain to MetaMask
              const provider = await externalWallet.getEthereumProvider();
              await provider.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: `0x${selectedChainId.toString(16)}`,
                  chainName: wagmiChain.name,
                  nativeCurrency: {
                    name: wagmiChain.nativeCurrency.name,
                    symbol: wagmiChain.nativeCurrency.symbol,
                    decimals: wagmiChain.nativeCurrency.decimals,
                  },
                  rpcUrls: [actualRpcUrl],
                  blockExplorerUrls: wagmiChain.blockExplorers ? [wagmiChain.blockExplorers.default.url] : [],
                }],
              });
              
              console.log('⚡ handlePrivyDeposit: Chain added successfully, now switching');
              
              // Now try to switch again
              await externalWallet.switchChain(selectedChainId);
              console.log('⚡ handlePrivyDeposit: Chain switch successful after adding');
            } else {
              throw switchError;
            }
          }
          
          setToast({
            message: 'Chain switched successfully. Proceeding with crosschain deposit...',
            type: 'success',
            loading: false,
            duration: 3000,
          });
          
          // Wait a moment for the chain switch to be reflected
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error('⚡ handlePrivyDeposit: Chain switch failed:', error);
          setToast({
            message: 'Failed to switch chain. Please manually add and switch your wallet to Appchain Testnet and try again.',
            type: 'error',
            loading: false,
            duration: 8000,
          });
          return;
        }
      }
      
      // Find the selected token address for deposit
      const selectedToken = tokens.find(t => t.address === selectedDepositTokenAddress);
      const tokenAddress = selectedToken?.address || (uniqueTokens.find(t => t.isQuote)?.address || uniqueTokens[0]?.address);
      
      console.log('⚡ handlePrivyDeposit: Chain validation passed, calling crosschainDeposit hook');
      console.log('⚡ handlePrivyDeposit: Parameters - amount:', depositAmount, 'token:', tokenAddress, 'recipient:', embeddedWalletAddress, 'chain:', selectedChainId);
      
      try {
        crosschainDeposit(depositAmount, tokenAddress, embeddedWalletAddress as `0x${string}`, selectedChainId);
        console.log('⚡ handlePrivyDeposit: crosschainDeposit function called successfully');
      } catch (error) {
        console.error('⚡ handlePrivyDeposit: Error calling crosschainDeposit:', error);
      }
    } else {
      console.log('⚡ handlePrivyDeposit: Using REGULAR DEPOSIT FLOW');
      // Find the selected token address for deposit
      const selectedToken = tokens.find(t => t.address === selectedDepositTokenAddress);
      const tokenAddress = selectedToken?.address || (uniqueTokens.find(t => t.isQuote)?.address || uniqueTokens[0]?.address);
      privyDeposit(depositAmount, tokenAddress);
    }
    
    setTimeout(() => {
      refetchAllBalances();
    }, 1000);
  };

  const handlePrivyWithdraw = () => {
    setToast({
      message: `Withdrawing ${withdrawAmount} ${currentWithdrawToken?.symbol || 'token'}...`,
      type: 'info',
      loading: true,
      duration: 0,
    });

    // Find the selected token address for withdraw
    const selectedToken = tokens.find(t => t.address === selectedWithdrawTokenAddress);
    const tokenAddress = selectedToken?.address || (uniqueTokens.find(t => t.isQuote)?.address || uniqueTokens[0]?.address);
    
    privyWithdraw(withdrawWallet, withdrawAmount, tokenAddress);
    setTimeout(() => {
      refetchAllBalances();
    }, 1000);
  };

  useEffect(() => {
    if (depositCurrentStep === 'Transaction submitted successfully!' || crosschainDepositCurrentStep === 'Crosschain deposit submitted successfully!') {
      depositResetState();
      crosschainDepositResetState();
      setDepositAmount('');
      refetchAllBalances();
    }
  }, [depositCurrentStep, crosschainDepositCurrentStep]);

  // Toast management for withdraw flow
  useEffect(() => {
    if (withdrawCurrentStep === 'Transaction submitted successfully!') {
      withdrawResetState();
      setWithdrawAmount('');
      refetchAllBalances();
    }
  }, [withdrawCurrentStep]);

  useEffect(() => {
    const interval = setInterval(() => {
      refetchAllBalances();
      refetchAllBalances();
    }, 10000);

    return () => clearInterval(interval);
  }, [refetchAllBalances]);

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
                {assets.map((asset) => (
                  <div key={asset.address || asset.symbol} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      {asset.icon}
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{asset.symbol}</span>
                          {asset.address && (
                            <button
                              onClick={() => copyToClipboard(asset.address!)}
                              className="p-1 hover:bg-gray-700 rounded opacity-70 hover:opacity-100 transition-opacity"
                              title={`Copy ${asset.symbol} address`}
                            >
                              <Copy size={12} className="text-gray-400" />
                            </button>
                          )}
                        </div>
                        {asset.address && (
                          <span className="text-gray-400 text-xs font-mono">
                            {`${asset.address.slice(0, 6)}...${asset.address.slice(-4)}`}
                          </span>
                        )}
                      </div>
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
                        <div className="flex flex-col">
                          <span className="text-white font-medium">
                            {currentDepositToken?.name}
                          </span>
                          {currentDepositToken?.address && (
                            <span className="text-gray-400 text-xs font-mono">
                              {`${currentDepositToken.address.slice(0, 6)}...${currentDepositToken.address.slice(-4)}`}
                            </span>
                          )}
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-gray-400 transition-transform ${
                            isDepositDropdownOpen ? 'rotate-180' : ''
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
                                  <span className="text-white font-medium">{token.name}</span>
                                  {token.address && (
                                    <button
                                      onClick={(e) => {
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
                                  {token.address ? `${token.address.slice(0, 6)}...${token.address.slice(-4)}` : ''}
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
                      onChange={e => {
                        setDepositAmount(e.target.value);
                      }}
                      className="outline-none bg-transparent text-right font-medium w-full ml-4"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <CreditCard size={14} />
                    <span>{(() => {
                      const selectedToken = tokens.find(t => t.address === selectedDepositTokenAddress);
                      const tokenBalance = tokenBalances.find(tb => tb.token.address === selectedToken?.address);
                      // Source wallet should ALWAYS show ERC20 balance (what user actually has in their external wallet)
                      // This is what they can deposit from, regardless of crosschain or regular deposits
                      const sourceBalance = tokenBalance?.externalBalance; // External wallet ERC20 balance
                      return formatNumber(Number(sourceBalance || '0'), {decimals: 2, compact: true});
                    })()}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center mb-6">
                <div className="p-2">
                  <ChevronDown size={36} className="text-[#00B4C8]" />
                </div>
              </div>

              <div className="mb-6">
                <div className="text-sm text-gray-400 mb-3 flex items-center justify-between">
                  <span>To your GTX wallet: {shortenAddress(embeddedWalletAddress)}</span>
                  <button
                    onClick={() => copyToClipboard(embeddedWalletAddress)}
                    className="ml-2 p-1 hover:bg-gray-700 rounded"
                    title="Copy GTX wallet address"
                  >
                    <Copy size={14} className="text-gray-400" />
                  </button>
                </div>
                
                <div className="mb-4 p-4 border border-gray-600 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="relative">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 ${currentDepositToken?.color} rounded-full flex items-center justify-center text-white font-medium`}
                        >
                          {currentDepositToken?.initial}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-white font-medium">
                            {currentDepositToken?.name}
                          </span>
                          {currentDepositToken?.address && (
                            <span className="text-gray-400 text-xs font-mono">
                              {`${currentDepositToken.address.slice(0, 6)}...${currentDepositToken.address.slice(-4)}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-right font-medium w-full ml-4 text-gray-300">
                      {(() => {
                        const selectedToken = tokens.find(t => t.address === selectedDepositTokenAddress);
                        const tokenBalance = tokenBalances.find(tb => tb.token.address === selectedToken?.address);
                        return formatNumber(Number(tokenBalance?.displayBalance || '0'), {decimals: 2, compact: true});
                      })()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <CreditCard size={14} />
                    <span>{(() => {
                      const selectedToken = tokens.find(t => t.address === selectedDepositTokenAddress);
                      const tokenBalance = tokenBalances.find(tb => tb.token.address === selectedToken?.address);
                      return formatNumber(Number(tokenBalance?.displayBalance || '0'), {decimals: 2, compact: true});
                    })()}</span>
                  </div>
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
                        <div className="absolute top-full left-0 mt-2 bg-gray-800 rounded-lg shadow-lg border border-gray-700 min-w-[230px] z-10">
                          {tokens.map(token => (
                            <div
                              key={token.address}
                              className="flex items-center gap-3 p-3 hover:bg-gray-700 cursor-pointer first:rounded-t-lg last:rounded-b-lg transition-colors"
                              onClick={() => handleWithdrawTokenSelect(token.address)}
                            >
                              <div
                                className={`w-6 h-6 ${token.color} rounded-full flex items-center justify-center text-white text-sm font-medium`}
                              >
                                {token.initial}
                              </div>
                              <div className="flex flex-col flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-medium">{token.name}</span>
                                  {token.address && (
                                    <button
                                      onClick={(e) => {
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
                                  {token.address ? `${token.address.slice(0, 6)}...${token.address.slice(-4)}` : ''}
                                </span>
                              </div>
                              {selectedWithdrawTokenAddress === token.address && (
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
                    <span>{(() => {
                      const selectedToken = tokens.find(t => t.address === selectedWithdrawTokenAddress);
                      const tokenBalance = tokenBalances.find(tb => tb.token.address === selectedToken?.address);
                      return formatNumber(Number(tokenBalance?.displayBalance || '0'), {decimals: 2, compact: true});
                    })()}</span>
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
