"use client";

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ArrowUpDown, ChevronRight, ExternalLink, Wallet } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCrossChainOrder, OrderAction } from '@/hooks/web3/espresso/useCrossChainOrder';
import { formatUnits } from 'viem';

import TokenNetworkSelector, { Network, Token, TokensByNetwork } from './token-network-selector';
import type { HexAddress } from '@/types/web3/general/address';
import { useCrossChain } from '@/hooks/web3/espresso/useCrossChain';

const CrossChainOrderForm: React.FC = () => {
    const { address, isConnected } = useAccount();
    const {
        currentNetwork,
        currentDomain,
        remoteDomain,
        currentRouter,
        remoteRouter,
        getTokens,
        getRemoteTokens
    } = useCrossChain();

    const { createOrder, getOrderStatus, isProcessing, txHash, error } =
        useCrossChainOrder(currentRouter);

    // State for token amounts
    const [amount, setAmount] = useState<string>('');
    const [txStatus, setTxStatus] = useState<string | null>(null);

    // Token selector dialog state
    const [selectorOpen, setSelectorOpen] = useState<boolean>(false);
    const [isSellSelector, setIsSellSelector] = useState<boolean>(true);

    // Client-side rendering state
    const [isClient, setIsClient] = useState(false);

    // Set isClient to true after component mounts to avoid hydration issues
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Get network names for UI
    const sourceNetworkId = currentNetwork;
    const destNetworkId = currentNetwork === 'arbitrum-sepolia' ? 'gtxpresso' : 'arbitrum-sepolia';
    const displaySourceNetwork = currentNetwork === 'arbitrum-sepolia' ? 'Arbitrum Sepolia' : 'GTXpresso';
    const displayDestNetwork = destNetworkId === 'arbitrum-sepolia' ? 'Arbitrum Sepolia' : 'GTXpresso';

    // Get tokens from the context
    const sourceTokensList = getTokens();
    const destTokensList = getRemoteTokens();

    // Networks for the selector
    const networks: Network[] = [
        {
            id: 'arbitrum-sepolia',
            name: 'Arbitrum Sepolia',
            icon: '/network/arbitrum-spolia.png'
        },
        {
            id: 'gtxpresso',
            name: 'GTXpresso',
            icon: '/network/gtx-update-dark.png'
        }
    ];

    // Convert token addresses to Token objects for selector
    const convertTokensForSelector = (tokenAddresses: Record<string, HexAddress>, networkId: string): Token[] => {
        return Object.entries(tokenAddresses)
            .filter(([symbol]) => symbol !== 'NATIVE') // Exclude NATIVE token
            .map(([symbol, address]) => {
                // Map token symbols to the actual filenames that exist in the directory
                const iconMap: Record<string, string> = {
                    'WETH': 'eth.png',
                    'ETH': 'eth.png',
                    'BTC': 'bitcoin.png',
                    'WBTC': 'bitcoin.png',
                    'DOGE': 'doge.png',
                    'LINK': 'link.png',
                    'PEPE': 'pepe.png',
                    'TRUMP': 'trump.png',
                    'USDC': 'usdc.png',
                    'SHIB': 'shiba.png',
                    'FLOKI': 'floki.png'
                };
                
                const iconFilename = iconMap[symbol] || `${symbol.toLowerCase()}.png`;
                
                return {
                    id: symbol.toLowerCase(),
                    name: getTokenFullName(symbol),
                    symbol: symbol,
                    icon: `/tokens/${iconFilename}`,
                    address: address,
                    description: address.slice(0, 6) + '...' + address.slice(-4)
                };
            });
    };

    // Helper to get full token names
    const getTokenFullName = (symbol: string): string => {
        const nameMap: Record<string, string> = {
            'WETH': 'Wrapped Ethereum',
            'USDC': 'USD Coin',
            'WBTC': 'Wrapped Bitcoin',
            'TRUMP': 'Trump Token',
            'PEPE': 'Pepe Token',
            'LINK': 'Chainlink',
            'DOGE': 'Dogecoin'
        };
        return nameMap[symbol] || symbol;
    };

    // Prepare tokens for selector
    const tokensByNetwork: TokensByNetwork = {
        'arbitrum-sepolia': convertTokensForSelector(sourceTokensList, 'arbitrum-sepolia'),
        'gtxpresso': convertTokensForSelector(destTokensList, 'gtxpresso')
    };

    // Default selections
    const [sourceNetwork, setSourceNetwork] = useState<Network>(networks.find(n => n.id === sourceNetworkId) || networks[0]);
    const [destNetwork, setDestNetwork] = useState<Network>(networks.find(n => n.id === destNetworkId) || networks[1]);
    const [sourceToken, setSourceToken] = useState<Token | null>(null);
    const [destToken, setDestToken] = useState<Token | null>(null);

    // Initialize default tokens
    useEffect(() => {
        if (tokensByNetwork[sourceNetworkId]?.length > 0 && !sourceToken) {
            const defaultToken = tokensByNetwork[sourceNetworkId].find(t => t.symbol === 'WETH') ||
                tokensByNetwork[sourceNetworkId][0];
            setSourceToken(defaultToken);
        }

        if (tokensByNetwork[destNetworkId]?.length > 0 && !destToken) {
            const defaultToken = tokensByNetwork[destNetworkId].find(t => t.symbol === 'USDC') ||
                tokensByNetwork[destNetworkId][0];
            setDestToken(defaultToken);
        }
    }, [tokensByNetwork, sourceNetworkId, destNetworkId, sourceToken, destToken]);

    // Mock wallet balances for each token
    const getMockTokenBalance = (address: HexAddress | undefined, symbol: string): string => {
        // If no wallet is connected, return "0"
        if (!address) return "0";
        
        // Mock balance data per token
        const balanceMap: Record<string, string> = {
            'WETH': '2.45',
            'ETH': '3.21',
            'BTC': '0.12',
            'WBTC': '0.09',
            'DOGE': '4200',
            'LINK': '156.78',
            'PEPE': '1250000',
            'TRUMP': '350.6',
            'USDC': '1240.50',
            'SHIB': '25000000',
            'FLOKI': '890000'
        };
        
        return balanceMap[symbol] || '0';
    };

    // Calculate USD values (in a real app, this would use actual price data)
    const getTokenUsdPrice = (symbol: string): number => {
        const priceMap: Record<string, number> = {
            'WETH': 1800,
            'ETH': 1800,
            'USDC': 1,
            'WBTC': 50000,
            'BTC': 50000,
            'TRUMP': 20,
            'PEPE': 0.000001,
            'LINK': 15,
            'DOGE': 0.1,
            'SHIB': 0.00001,
            'FLOKI': 0.0001
        };
        return priceMap[symbol] || 1;
    };
    
    // Calculate the exchange ratio between two tokens
    const calculateExchangeRatio = (sourceSymbol: string, destSymbol: string): string => {
        const sourcePrice = getTokenUsdPrice(sourceSymbol);
        const destPrice = getTokenUsdPrice(destSymbol);
        
        if (!sourcePrice || !destPrice) return '1';
        return (destPrice / sourcePrice).toFixed(6);
    };

    const sourceUsdPrice = sourceToken ? getTokenUsdPrice(sourceToken.symbol) : 0;
    const destUsdPrice = destToken ? getTokenUsdPrice(destToken.symbol) : 0;

    const sourceUsdValue = amount && sourceToken ? Number.parseFloat(amount || '0') * sourceUsdPrice : 0;
    const destUsdValue = amount && destToken ? Number.parseFloat(amount || '0') * destUsdPrice : 0;

    // Calculate fees and estimates
    const priceImpact = '0.02%';
    const estReceived = amount && sourceToken && destToken
    ? (
        (Number.parseFloat(amount || '0') * getTokenUsdPrice(sourceToken.symbol) / getTokenUsdPrice(destToken.symbol)) 
        * 0.9975 // fee
    ).toFixed(6)
    : '0';

    const minReceived = amount && destToken ? (Number.parseFloat(amount || '0') * 0.995).toFixed(6) : '0';
    const swapFee = amount && sourceToken ? (Number.parseFloat(amount || '0') * 0.0025).toFixed(6) : '0';
    const networkFee = '0.001 ETH';

    // Handle submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!address) {
            alert('Please connect your wallet');
            return;
        }

        if (!amount || !sourceToken || !destToken) {
            alert('Please enter an amount and select tokens');
            return;
        }

        try {
            setTxStatus('Creating order...');

            const inputTokenAddress = sourceToken.address as HexAddress;
            const outputTokenAddress = destToken.address as HexAddress;
            const recipientAddress = address as HexAddress;

            const result = await createOrder({
                recipient: recipientAddress,
                inputToken: inputTokenAddress,
                outputToken: outputTokenAddress,
                targetInputToken: outputTokenAddress,
                targetOutputToken: outputTokenAddress,
                amountIn: amount,
                amountOut: amount,
                destinationDomain: remoteDomain as number,
                targetDomain: remoteDomain as number,
                destinationRouter: remoteRouter,
                orderAction: OrderAction.Transfer,
            });

            if (result?.success) {
                setTxStatus('Order created successfully!');

                const intervalId = setInterval(async () => {
                    if (result.txHash) {
                        try {
                            const status = await getOrderStatus(result.txHash);
                            setTxStatus(`Order status: ${status}`);

                            if (status === 'SETTLED' || status === 'REFUNDED') {
                                clearInterval(intervalId);
                            }
                        } catch (error) {
                            console.error("Error checking status:", error);
                            setTxStatus(`Order created. Status updates may be delayed.`);
                        }
                    }
                }, 10000);

                setTimeout(() => clearInterval(intervalId), 300000);
            } else {
                const errorMessage = result?.error instanceof Error
                    ? result.error.message
                    : 'Unknown error';

                setTxStatus(`Order creation failed: ${errorMessage}`);
            }
        } catch (err) {
            console.error('Error submitting order:', err);
            setTxStatus(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    // Handle amount change with smart ratio calculation
    const handleAmountChange = (value: string) => {
        setAmount(value.replace(/[^0-9.]/g, ''));
    };

    // Open token selector
    const openTokenSelector = (isSell: boolean) => {
        setIsSellSelector(isSell);
        setSelectorOpen(true);
    };

    // Handle token selection
    const handleTokenNetworkSelect = (network: Network, token: Token) => {
        if (isSellSelector) {
            setSourceNetwork(network);
            setSourceToken(token);
        } else {
            setDestNetwork(network);
            setDestToken(token);
        }
    };

    // Swap source and destination
    const handleSwap = () => {
        // Swap tokens
        const tempToken = sourceToken;
        setSourceToken(destToken);
        setDestToken(tempToken);

        // Swap networks
        const tempNetwork = sourceNetwork;
        setSourceNetwork(destNetwork);
        setDestNetwork(tempNetwork);
    };

    // Calculate UI fixed values
    const exchangeRate = sourceToken && destToken 
        ? calculateExchangeRatio(sourceToken.symbol, destToken.symbol)
        : '0';

    return (
        <div className="flex min-h-screen items-center justify-center bg-black p-4">
            <div className="w-full max-w-md">
                <Card className="border-white/20 bg-[#121212] p-4">
                    <div className="mb-2 text-3xl font-bold text-white">Cross-Chain Bridge</div>
                    {sourceToken && destToken && (
                        <div className="mb-6 text-blue-500">
                            <span>
                                {`1 ${sourceToken.symbol} = ${exchangeRate} ${destToken.symbol}`}
                            </span>
                            <span className="ml-2 text-xs text-gray-400">
                                (${getTokenUsdPrice(sourceToken.symbol)} → ${getTokenUsdPrice(destToken.symbol)})
                            </span>
                        </div>
                    )}

                    {/* Source Section */}
                    <div className="mb-2 rounded-xl border border-white/10 bg-[#1A1A1A]/50 p-4">
                        <div className="mb-2 text-sm text-gray-400">From {displaySourceNetwork}</div>
                        <div className="flex items-center justify-between">
                            <input
                                type="text"
                                value={amount}
                                onChange={(e) => handleAmountChange(e.target.value)}
                                placeholder="0.0"
                                className="w-1/2 bg-transparent text-4xl font-medium text-white outline-none"
                            />
                            <Button
                                variant="outline"
                                onClick={() => openTokenSelector(true)}
                                className="flex h-12 items-center gap-2 rounded-full border-blue-500/20 bg-blue-500/10 px-4 text-white hover:bg-blue-500/20"
                            >
                                <div className="relative">
                                    {sourceToken ? (
                                        <img
                                            src={sourceToken.icon}
                                            alt={sourceToken.symbol}
                                            className="h-8 w-8 rounded-full"
                                            onError={(e) => {
                                                // Replace with a Lucide icon component instead of another image
                                                const parent = e.currentTarget.parentNode;
                                                if (parent) {
                                                    const iconElement = document.createElement('div');
                                                    iconElement.className = "flex h-8 w-8 items-center justify-center rounded-full bg-blue-500";
                                                    iconElement.textContent = sourceToken.symbol.charAt(0);
                                                    parent.replaceChild(iconElement, e.currentTarget);
                                                }
                                            }}
                                        />
                                    ) : (
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                                            ?
                                        </div>
                                    )}
                                    <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-black bg-[#121212]">
                                        <img
                                            src={sourceNetwork?.icon || "/network/arbitrum-spolia.png"}
                                            alt={sourceNetwork?.name}
                                            className="h-4 w-4 rounded-full"
                                            onError={(e) => {
                                                // Replace with a Lucide icon component instead of another image
                                                const parent = e.currentTarget.parentNode;
                                                if (parent) {
                                                  const iconElement = document.createElement('div');
                                                  iconElement.className = "flex h-5 w-5 items-center justify-center rounded-full bg-blue-500";
                                                  iconElement.textContent = sourceNetwork.name.charAt(0);
                                                  parent.replaceChild(iconElement, e.currentTarget);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-lg font-medium">{sourceToken?.symbol || 'Select'}</span>
                                    <span className="text-xs text-gray-400">{sourceNetwork?.name}</span>
                                </div>
                                <ChevronRight className="h-5 w-5 text-gray-400" />
                            </Button>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                            <div className="text-sm text-gray-400">${sourceUsdValue.toFixed(2)}</div>
                            <div className="flex items-center text-sm text-blue-400">
                                <Wallet className="mr-1 h-4 w-4" />
                                {/* Display wallet balance if connected */}
                                <span>
                                    {isClient
                                        ? (isConnected 
                                            ? `${getMockTokenBalance(address, sourceToken?.symbol || '')} ${sourceToken?.symbol || ''}`
                                            : "Connect wallet")
                                        : "Connect wallet"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Swap Button */}
                    <div className="relative flex justify-center">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleSwap}
                            className="absolute -top-4 z-10 h-8 w-8 rounded-full border-white/10 bg-[#121212] text-gray-400 hover:bg-blue-600/20 hover:text-white transition-colors"
                        >
                            <ArrowUpDown className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Destination Section */}
                    <div className="mb-4 rounded-xl border border-white/10 bg-[#1A1A1A]/50 p-4">
                        <div className="mb-2 text-sm text-gray-400">To {displayDestNetwork}</div>
                        <div className="flex items-center justify-between">
                            <input
                                type="text"
                                value={estReceived}
                                readOnly
                                placeholder="0.0"
                                className="w-1/2 bg-transparent text-4xl font-medium text-white outline-none"
                            />
                            <Button
                                variant="outline"
                                onClick={() => openTokenSelector(false)}
                                className="flex h-12 items-center gap-2 rounded-full border-white/10 bg-white/5 px-4 text-white hover:bg-white/10"
                            >
                                <div className="relative">
                                    {destToken ? (
                                        <img
                                            src={destToken.icon}
                                            alt={destToken.symbol}
                                            className="h-8 w-8 rounded-full"
                                            onError={(e) => {
                                                // Replace with a Lucide icon component instead of another image
                                                const parent = e.currentTarget.parentNode;
                                                if (parent) {
                                                  const iconElement = document.createElement('div');
                                                  iconElement.className = "flex h-8 w-8 items-center justify-center rounded-full bg-blue-500";
                                                  iconElement.textContent = destToken.symbol.charAt(0);
                                                  parent.replaceChild(iconElement, e.currentTarget);
                                                }
                                              }}
                                        />
                                    ) : (
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
                                            ?
                                        </div>
                                    )}
                                    <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-black bg-[#121212]">
                                        <img
                                            src={destNetwork?.icon || "/network/gtx-update-dark.png"}
                                            alt={destNetwork?.name}
                                            className="h-4 w-4 rounded-full"
                                            onError={(e) => {
                                                // Replace with a Lucide icon component instead of another image
                                                const parent = e.currentTarget.parentNode;
                                                if (parent) {
                                                  const iconElement = document.createElement('div');
                                                  iconElement.className = "flex h-5 w-5 items-center justify-center rounded-full bg-blue-500";
                                                  iconElement.textContent = destNetwork.name.charAt(0);
                                                  parent.replaceChild(iconElement, e.currentTarget);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-lg font-medium">{destToken?.symbol || 'Select'}</span>
                                    <span className="text-xs text-gray-400">{destNetwork?.name}</span>
                                </div>
                                <ChevronRight className="h-5 w-5 text-gray-400" />
                            </Button>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                            <div className="text-sm text-gray-400">${destUsdValue.toFixed(2)}</div>
                            <div className="flex items-center text-sm text-gray-400">
                                <Wallet className="mr-1 h-4 w-4" />
                                {/* Display wallet balance if connected */}
                                <span>
                                    {isClient
                                        ? (isConnected 
                                            ? `${getMockTokenBalance(address, destToken?.symbol || '')} ${destToken?.symbol || ''}`
                                            : "Connect wallet")
                                        : "Connect wallet"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Transaction Details */}
                    <div className="mb-6 rounded-xl border border-white/10 bg-[#1A1A1A]/50 p-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Exchange rate</span>
                                <span className="text-white">1 {sourceToken?.symbol} = {exchangeRate} {destToken?.symbol}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Est. received</span>
                                <span className="text-white">{estReceived} {destToken?.symbol || ''}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Min. received</span>
                                <span className="text-white">{minReceived} {destToken?.symbol || ''}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Fee (0.25%)</span>
                                <span className="text-white">{swapFee} {sourceToken?.symbol || ''}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Network fee</span>
                                <span className="text-white">{networkFee}</span>
                            </div>
                        </div>
                    </div>

                    {/* Status display */}
                    {txStatus && (
                        <div className="mb-4 rounded-xl border border-white/10 bg-[#1A1A1A]/50 p-4">
                            <div className="text-sm text-gray-200">{txStatus}</div>
                            {txHash && (
                                <a
                                    href={`https://sepolia.arbiscan.io/tx/${txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 flex items-center text-sm text-blue-400 hover:text-blue-300"
                                >
                                    View on Explorer <ExternalLink className="ml-1 h-3 w-3" />
                                </a>
                            )}
                        </div>
                    )}

                    {/* Action Button */}
                    <Button
                        className="w-full bg-blue-600 py-6 text-lg font-medium text-white hover:bg-blue-700"
                        onClick={handleSubmit}
                        disabled={isProcessing || !amount || !sourceToken || !destToken || !isConnected}
                    >
                        {/* Use conditional rendering to avoid hydration mismatch */}
                        {isClient
                            ? (!isConnected
                                ? 'Connect Wallet'
                                : isProcessing
                                    ? 'Processing...'
                                    : `Bridge to ${displayDestNetwork}`)
                            : 'Connect Wallet'}
                    </Button>
                </Card>
            </div>

            {/* Only render the selector component on the client side */}
            {isClient && (
                <TokenNetworkSelector
                    open={selectorOpen}
                    onOpenChange={setSelectorOpen}
                    networks={networks}
                    tokens={tokensByNetwork}
                    initialNetwork={isSellSelector ? sourceNetwork : destNetwork}
                    onSelect={handleTokenNetworkSelect}
                />
            )}
        </div>
    );
};

export default CrossChainOrderForm;