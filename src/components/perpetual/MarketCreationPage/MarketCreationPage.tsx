import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { CheckCircle2, Loader2, Hexagon, Wallet, Settings, History, Droplets } from 'lucide-react';
import { toast } from 'sonner';
import useCreateMarket from '@/hooks/web3/gtx/perpetual/useCreateMarket';
import { OracleSource } from '@/hooks/web3/gtx/perpetual/useOracleServiceManager';
import TokenSelection from './TokenSelection';
import OracleSources from './OracleSources';
import { useAccount } from 'wagmi';
import { PrivyAuthButton } from '@/components/auth/privy-auth-button';
import GradientLoader from '@/components/gradient-loader/gradient-loader';
import { getTokenAddresses } from '@/helper/token-helper';
import { HexAddress } from '@/types/general/address';
const MarketCreationPage: React.FC = () => {
  // Wallet connection and loading states
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { isConnected } = useAccount();
  const [showConnectionLoader, setShowConnectionLoader] = useState(false);
  const [previousConnectionState, setPreviousConnectionState] = useState(isConnected);

  // State for tokens
  const [tokenType, setTokenType] = useState<'evm' | 'solana'>('evm');
  const [evmToken, setEvmToken] = useState<string>('');
  const [solanaToken, setSolanaToken] = useState<string>('');
  const [shortToken, setShortToken] = useState<string>(String(getTokenAddresses().USDC));
  const [tokenPair, setTokenPair] = useState<string>('');
  const [customSymbol, setCustomSymbol] = useState<string>('');
  const [useCustomSymbol, setUseCustomSymbol] = useState<boolean>(false);
  
  // State for oracle sources
  const [sources, setSources] = useState<OracleSource[]>([
    { name: 'geckoterminal', identifier: '', network: 'eth' },
    { name: 'dexscreener', identifier: '', network: 'ethereum' },
    { name: 'binance', identifier: '', network: '' },
    { name: 'okx', identifier: '', network: '' }
  ]);
  
  // Create market hook
  const { 
    createMarket, 
    solanaToEvmAddress,
    generateDefaultSources,
    isCreateMarketPending, 
    isCreateMarketConfirming,
    isCreateMarketConfirmed,
    createMarketHash,
    createdMarketAddress 
  } = useCreateMarket();

  // Handle initial mounting
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Handle wallet connection state changes
  useEffect(() => {
    if (mounted) {
      if (isConnected && !previousConnectionState) {
        setShowConnectionLoader(true);
        const timer = setTimeout(() => {
          setShowConnectionLoader(false);
        }, 2000);
        return () => clearTimeout(timer);
      }
      setPreviousConnectionState(isConnected);
    }
  }, [isConnected, previousConnectionState, mounted]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (tokenType === 'evm' && !evmToken) {
      toast.error('Please enter an EVM token address');
      return;
    }
    
    if (tokenType === 'solana' && !solanaToken) {
      toast.error('Please enter a Solana token address');
      return;
    }
    
    if (!shortToken) {
      toast.error('Quote token is required');
      return;
    }
    
    // Use custom symbol if enabled
    const finalTokenPair = useCustomSymbol && customSymbol ? customSymbol : tokenPair;
    
    if (!finalTokenPair) {
      toast.error('Token pair name is required');
      return;
    }
    
    try {
      if (tokenType === 'evm') {
        await createMarket({
          longToken: evmToken as HexAddress,
          shortToken: shortToken as HexAddress,
          tokenPair: finalTokenPair,
          sources: sources
        });
      } else {
        await createMarket({
          // This is just a placeholder - the actual conversion happens in the hook
          longToken: '0x0000000000000000000000000000000000000000' as HexAddress,
          shortToken: shortToken as HexAddress,
          tokenPair: finalTokenPair,
          sources: sources,
          isSolanaToken: true,
          solanaAddress: solanaToken
        });
      }
    } catch (error) {
      console.error('Error creating market:', error);
      toast.error('Failed to create market. Please try again.');
    }
  };

  // Show initial loading skeletons
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-20 h-20 border-t-2 border-b-2 border-cyan-400 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // Show connection loading state only when transitioning from disconnected to connected
  if (showConnectionLoader) {
    return <GradientLoader />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950/40 to-slate-950 relative overflow-hidden">
      {/* Hexagonal Grid Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTI1IDJMMi42OCAxMy41djI1TDI1IDUwbDIyLjMyLTExLjV2LTI1eiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDU2LCAxODksIDI0OCwgMC4wMykpIiBzdHJva2Utd2lkdGg9IjAuNSIvPjwvc3ZnPg==')] opacity-50"></div>

      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400/40 rounded-full animate-pulse blur-[2px]"></div>
          <div className="absolute top-3/4 left-1/2 w-1.5 h-1.5 bg-blue-400/40 rounded-full animate-pulse delay-75 blur-[1px]"></div>
          <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-cyan-300/40 rounded-full animate-pulse delay-150 blur-[2px]"></div>
          <div className="absolute bottom-1/4 right-1/3 w-1.5 h-1.5 bg-blue-300/40 rounded-full animate-pulse delay-300 blur-[1px]"></div>
          <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-cyan-400/40 rounded-full animate-pulse delay-500 blur-[1px]"></div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 py-24">
        {isConnected ? (
          <div className="space-y-6 w-full max-w-3xl mx-auto">
            {/* Hero Section */}
            <div className="text-center max-w-2xl mx-auto relative">
              <div className="inline-flex items-center justify-center mb-6 relative">
                <div className="absolute inset-0 bg-cyan-500/10 blur-[32px] rounded-full"></div>
                <div className="relative">
                  <Hexagon className="w-16 h-16 text-cyan-500 absolute -left-1 -top-1 opacity-20" />
                  <Settings className="w-14 h-14 text-cyan-400 relative z-10" />
                </div>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4 drop-shadow-[0_0_15px_rgba(56,189,248,0.1)]">
                Create Perpetual Market
              </h1>
              <p className="text-cyan-100/80">Set up a new trading market for EVM or Solana tokens</p>
            </div>

            {/* Create Market Form */}
            <Card className="border-0 bg-slate-900/40 backdrop-blur-xl shadow-[0_0_15px_rgba(56,189,248,0.03)] border border-cyan-500/10">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Token Selection Component */}
                  <TokenSelection
                    tokenType={tokenType}
                    setTokenType={setTokenType}
                    evmToken={evmToken}
                    setEvmToken={setEvmToken}
                    solanaToken={solanaToken}
                    setSolanaToken={setSolanaToken}
                    shortToken={shortToken}
                    setShortToken={setShortToken}
                    tokenPair={tokenPair}
                    setTokenPair={setTokenPair}
                    solanaToEvmAddress={solanaToEvmAddress}
                    generateDefaultSources={generateDefaultSources}
                    setSources={setSources}
                  />
                  
                  {/* Token pair name */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-gray-300">Token Pair Name</Label>
                      <div className="flex items-center gap-2 ml-auto">
                        <Checkbox 
                          id="customSymbol" 
                          checked={useCustomSymbol}
                          onCheckedChange={(checked) => setUseCustomSymbol(checked === true)}
                          className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                        />
                        <Label htmlFor="customSymbol" className="text-sm cursor-pointer text-cyan-100/70">
                          Use custom symbol
                        </Label>
                      </div>
                    </div>
                    
                    {useCustomSymbol ? (
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                          <div className="relative">
                            <Hexagon className="w-6 h-6 text-cyan-500/20 absolute -left-0.5 -top-0.5" />
                            <Droplets className="w-5 h-5 text-cyan-400/60 relative z-10" />
                          </div>
                        </div>
                        <Input 
                          value={customSymbol} 
                          onChange={(e) => setCustomSymbol(e.target.value)} 
                          placeholder="e.g. ETH/USDT"
                          className="pl-12 bg-slate-900/50 border-blue-500/25 focus:ring-cyan-400/20 hover:border-cyan-500/40 transition-all"
                        />
                      </div>
                    ) : (
                      <div className="h-10 px-3 py-2 rounded-md border border-blue-500/25 bg-slate-900/50 flex items-center text-gray-300">
                        {tokenPair || "Select tokens to generate pair name"}
                      </div>
                    )}
                  </div>
                  
                  {/* Oracle Sources Component */}
                  <OracleSources 
                    sources={sources}
                    setSources={setSources}
                  />
                  
                  {/* Success message */}
                  {isCreateMarketConfirmed && createdMarketAddress && (
                    <div className="bg-slate-900/50 rounded-lg p-4 border border-green-500/25">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="absolute inset-0 bg-green-500/10 blur-[12px] rounded-full"></div>
                          <Hexagon className="w-10 h-10 text-green-500/20 absolute -left-1 -top-1" />
                          <CheckCircle2 className="w-8 h-8 text-green-400 relative z-10" />
                        </div>
                        <div>
                          <p className="font-medium text-green-400">Market created successfully!</p>
                          <p className="text-sm text-cyan-100/60 break-all mt-1">
                            Market Address: {createdMarketAddress}
                          </p>
                          {createMarketHash && (
                            <a 
                              href={`https://testnet.monadexplorer.com/address/${createdMarketAddress}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                            >
                              View on Monad Explorer
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Submit button */}
                  <Button 
                    type="submit" 
                    className="w-full rounded-md bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white h-10 shadow-[0_0_15px_rgba(56,189,248,0.15)] hover:shadow-[0_0_20px_rgba(56,189,248,0.25)] transition-all"
                    disabled={isCreateMarketPending || isCreateMarketConfirming}
                  >
                    {(isCreateMarketPending || isCreateMarketConfirming) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isCreateMarketPending ? 'Preparing Transaction...' : 
                     isCreateMarketConfirming ? 'Creating Market...' : 
                     'Create Market'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            
          </div>
        ) : (
          <div className="min-h-[60vh] flex items-center justify-center">
            <Card className="border-0 bg-slate-900/40 backdrop-blur-xl max-w-md w-full shadow-[0_0_30px_rgba(56,189,248,0.03)] border border-cyan-500/10">
              <CardContent className="p-12 text-center">
                <div className="relative inline-block mb-8">
                  <div className="absolute inset-0 bg-cyan-500/10 blur-[24px] rounded-full"></div>
                  <Hexagon className="w-20 h-20 text-cyan-500/20 absolute -left-2 -top-2" />
                  <Settings className="w-16 h-16 text-cyan-400 relative z-10" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-4">
                  Connect Wallet
                </h2>
                <p className="text-cyan-100/80 mb-8">Connect your wallet to create a perpetual market</p>
                <PrivyAuthButton showFullProfile={false} />
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default MarketCreationPage;