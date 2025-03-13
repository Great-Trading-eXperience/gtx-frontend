import React, { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { COMMON_TOKENS, USDC_ADDRESS } from '@/hooks/web3/gtx/perpetual/contract-address';
import { OracleSource } from '@/hooks/web3/gtx/perpetual/useOracleServiceManager';
import { Hexagon, Code } from 'lucide-react';

interface SolanaToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

interface TokenSelectionProps {
  tokenType: 'evm' | 'solana';
  setTokenType: (type: 'evm' | 'solana') => void;
  evmToken: string;
  setEvmToken: (token: string) => void;
  solanaToken: string;
  setSolanaToken: (token: string) => void;
  shortToken: string;
  setShortToken: (token: string) => void;
  tokenPair: string;
  setTokenPair: (pair: string) => void;
  solanaToEvmAddress: (address: string) => string;
  generateDefaultSources: (
    tokenAddress: `0x${string}`,
    pairName: string,
    isSolana?: boolean,
    solanaAddress?: string
  ) => OracleSource[];
  setSources: (sources: OracleSource[]) => void;
}

const TokenSelection: React.FC<TokenSelectionProps> = ({
  tokenType,
  setTokenType,
  evmToken,
  setEvmToken,
  solanaToken,
  setSolanaToken,
  shortToken,
  setShortToken,
  tokenPair,
  setTokenPair,
  solanaToEvmAddress,
  generateDefaultSources,
  setSources
}) => {
  // Update token pair when tokens are selected
  useEffect(() => {
    if (tokenType === 'evm' && evmToken) {
      // For manually entered EVM token, use address as identifier
      const shortTokenObj = COMMON_TOKENS.find((t) => String(t.address) === shortToken);
      
      if (shortTokenObj) {
        // Use a simplified pair name with the token address
        const pairName = `${evmToken.substring(0, 8)}.../${shortTokenObj.symbol}`;
        setTokenPair(pairName);
        updateSources(evmToken, pairName, false);
      }
    } else if (tokenType === 'solana' && solanaToken) {
      const shortTokenObj = COMMON_TOKENS.find((t) => String(t.address) === shortToken);
      
      if (shortTokenObj) {
        // Use a simplified pair name with the token address
        const pairName = `${solanaToken.substring(0, 8)}.../${shortTokenObj.symbol}`;
        setTokenPair(pairName);
        
        // Convert Solana address to EVM for display
        const evmAddress = solanaToEvmAddress(solanaToken);
        updateSources(evmAddress, pairName, true, solanaToken);
      }
    }
  }, [evmToken, solanaToken, shortToken, tokenType]);
  
  // Update sources based on selected tokens
  const updateSources = (
    tokenAddress: string, 
    pairName: string, 
    isSolana: boolean = false, 
    solanaAddress?: string
  ) => {
    const newSources = generateDefaultSources(
      tokenAddress as `0x${string}`,
      pairName,
      isSolana,
      solanaAddress
    );
    
    setSources(newSources);
  };

  return (
    <>
      {/* Token type selection */}
      <div className="space-y-2">
        <Label className="text-gray-300">Token Type</Label>
        <Tabs defaultValue="evm" onValueChange={(v) => setTokenType(v as 'evm' | 'solana')} className="w-full">
          <TabsList className="grid grid-cols-2 w-full bg-slate-900/30 border border-blue-500/20">
            <TabsTrigger value="evm" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              EVM Token
            </TabsTrigger>
            <TabsTrigger value="solana" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              Solana Token
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="evm" className="pt-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Enter EVM Token Address</Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <div className="relative">
                    <Hexagon className="w-6 h-6 text-cyan-500/20 absolute -left-0.5 -top-0.5" />
                    <Code className="w-5 h-5 text-cyan-400/60 relative z-10" />
                  </div>
                </div>
                <Input
                  value={evmToken}
                  onChange={(e) => setEvmToken(e.target.value)}
                  placeholder="0x..."
                  className="pl-12 bg-slate-900/50 border-blue-500/25 focus:ring-cyan-400/20 hover:border-cyan-500/40 transition-all"
                />
              </div>
              {evmToken && (
                <p className="text-xs text-cyan-100/60 mt-1">EVM Token: {evmToken}</p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="solana" className="pt-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Enter Solana Token Address</Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <div className="relative">
                    <Hexagon className="w-6 h-6 text-cyan-500/20 absolute -left-0.5 -top-0.5" />
                    <Code className="w-5 h-5 text-cyan-400/60 relative z-10" />
                  </div>
                </div>
                <Input
                  value={solanaToken}
                  onChange={(e) => setSolanaToken(e.target.value)}
                  placeholder="Enter Solana token address..."
                  className="pl-12 bg-slate-900/50 border-blue-500/25 focus:ring-cyan-400/20 hover:border-cyan-500/40 transition-all"
                />
              </div>
              
              {solanaToken && (
                <div className="mt-2 pt-2 border-t border-blue-500/10">
                  <p className="text-xs text-cyan-100/60">
                    <span className="font-medium">Solana Address:</span> {solanaToken}
                  </p>
                  <p className="text-xs text-cyan-100/60 mt-1">
                    <span className="font-medium">EVM Address:</span> {solanaToken ? solanaToEvmAddress(solanaToken) : ''}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Quote token selection */}
      <div className="space-y-2">
        <Label className="text-gray-300">Quote Token</Label>
        <div className="relative h-10 px-3 py-2 rounded-md border border-blue-500/25 bg-slate-900/50 flex items-center text-gray-300">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <div className="relative">
              <Hexagon className="w-6 h-6 text-cyan-500/20 absolute -left-0.5 -top-0.5" />
              <Code className="w-5 h-5 text-cyan-400/60 relative z-10" />
            </div>
          </div>
          <span className="pl-10">USDC</span>
        </div>
        <p className="text-xs text-cyan-100/60">
          Using address: {shortToken}
        </p>
      </div>
    </>
  );
};

export default TokenSelection;