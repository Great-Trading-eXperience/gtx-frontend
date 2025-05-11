import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { COMMON_TOKENS } from '@/hooks/web3/gtx/perpetual/chain-id';
import { OracleSource } from '@/hooks/web3/gtx/perpetual/useOracleServiceManager';
import useCreateMarket from '@/hooks/web3/gtx/perpetual/useCreateMarket';
import { getTokenAddresses } from '@/helper/token-helper';

// Define Solana token options
const SOLANA_TOKENS = [
  {
    address: "So11111111111111111111111111111111111111112",
    symbol: "SOL",
    name: "Solana",
    decimals: 9
  },
  {
    address: "CniPCE4b3s8gSUPhUiyMjXnytrEqUrMfSsnbBjLCpump",
    symbol: "PWEASE",
    name: "PWEASE Token",
    decimals: 6
  },
  {
    address: "6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN",
    symbol: "TRUMP",
    name: "Trump Token",
    decimals: 6
  }
];

// Data source options
const DATA_SOURCES = [
  'geckoterminal',
  'dexscreener',
  'binance',
  'okx',
  'coinbase',
  'kucoin'
];

const MarketCreationPage: React.FC = () => {
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
  
  // Update token pair when tokens are selected
  useEffect(() => {
    if (tokenType === 'evm' && evmToken) {
      const longTokenObj = COMMON_TOKENS.find((t: { address: any; }) => String(t.address) === evmToken);
      const shortTokenObj = COMMON_TOKENS.find((t: { address: any; }) => String(t.address) === shortToken);
      
      if (longTokenObj && shortTokenObj) {
        const pairName = `${longTokenObj.symbol}/${shortTokenObj.symbol}`;
        setTokenPair(pairName);
        updateSources(longTokenObj.address, pairName, false);
      }
    } else if (tokenType === 'solana' && solanaToken) {
      const longTokenObj = SOLANA_TOKENS.find(t => t.address === solanaToken);
      const shortTokenObj = COMMON_TOKENS.find((t: { address: any; }) => String(t.address) === shortToken);
      
      if (longTokenObj && shortTokenObj) {
        const pairName = `${longTokenObj.symbol}/${shortTokenObj.symbol}`;
        setTokenPair(pairName);
        
        // Convert Solana address to EVM for display
        const evmAddress = solanaToEvmAddress(longTokenObj.address);
        updateSources(evmAddress, pairName, true, longTokenObj.address);
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
  
  // Handle source operations
  const handleAddSource = () => {
    setSources([...sources, { name: 'binance', identifier: '', network: '' }]);
  };
  
  const handleRemoveSource = (index: number) => {
    setSources(sources.filter((_, i) => i !== index));
  };
  
  const handleUpdateSource = (index: number, field: keyof OracleSource, value: string) => {
    const newSources = [...sources];
    newSources[index] = { ...newSources[index], [field]: value };
    setSources(newSources);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (tokenType === 'evm' && !evmToken) {
      toast.error('Please select an EVM token');
      return;
    }
    
    if (tokenType === 'solana' && !solanaToken) {
      toast.error('Please select a Solana token');
      return;
    }
    
    if (!shortToken) {
      toast.error('Please select a quote token');
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
          longToken: evmToken as `0x${string}`,
          shortToken: shortToken as `0x${string}`,
          tokenPair: finalTokenPair,
          sources: sources
        });
      } else {
        await createMarket({
          // This is just a placeholder - the actual conversion happens in the hook
          longToken: '0x0000000000000000000000000000000000000000' as `0x${string}`,
          shortToken: shortToken as `0x${string}`,
          tokenPair: finalTokenPair,
          sources: sources,
          isSolanaToken: true,
          solanaAddress: solanaToken
        });
      }
    } catch (error) {
      console.error('Error creating market:', error);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Perpetual Market</CardTitle>
        <CardDescription>
          Set up a trading market for EVM or Solana tokens
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Token type selection */}
          <div className="space-y-2">
            <Label>Token Type</Label>
            <Tabs defaultValue="evm" onValueChange={(v) => setTokenType(v as 'evm' | 'solana')}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="evm">EVM Token</TabsTrigger>
                <TabsTrigger value="solana">Solana Token</TabsTrigger>
              </TabsList>
              
              <TabsContent value="evm" className="pt-4">
                <div className="space-y-2">
                  <Label>Select EVM Token</Label>
                  <Select 
                    value={evmToken} 
                    onValueChange={setEvmToken}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select EVM token" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_TOKENS.map((token: { address: React.Key | null | undefined; symbol: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | React.PromiseLikeOfReactNode | null | undefined; name: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | React.PromiseLikeOfReactNode | null | undefined; }) => (
                        <SelectItem key={token.address} value={String(token.address)}>
                          {token.symbol} - {token.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
              
              <TabsContent value="solana" className="pt-4">
                <div className="space-y-2">
                  <Label>Select Solana Token</Label>
                  <Select 
                    value={solanaToken} 
                    onValueChange={setSolanaToken}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Solana token" />
                    </SelectTrigger>
                    <SelectContent>
                      {SOLANA_TOKENS.map(token => (
                        <SelectItem key={token.address} value={token.address}>
                          {token.symbol} - {token.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {solanaToken && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Solana Address:</span> {solanaToken}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
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
            <Label>Quote Token</Label>
            <Select 
              value={shortToken} 
              onValueChange={setShortToken}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select quote token" />
              </SelectTrigger>
              <SelectContent>
                {COMMON_TOKENS.filter((t: { symbol: string; }) => t.symbol === 'USDC' || t.symbol === 'USDT').map((token: { address: React.Key | null | undefined; symbol: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | React.PromiseLikeOfReactNode | null | undefined; name: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | React.PromiseLikeOfReactNode | null | undefined; }) => (
                  <SelectItem key={token.address} value={String(token.address)}>
                    {token.symbol} - {token.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Token pair name */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Token Pair Name</Label>
              <div className="flex items-center gap-2 ml-auto">
                <Checkbox 
                  id="customSymbol" 
                  checked={useCustomSymbol}
                  onCheckedChange={(checked) => setUseCustomSymbol(checked === true)}
                />
                <Label htmlFor="customSymbol" className="text-sm cursor-pointer">
                  Use custom symbol
                </Label>
              </div>
            </div>
            
            {useCustomSymbol ? (
              <Input 
                value={customSymbol} 
                onChange={(e) => setCustomSymbol(e.target.value)} 
                placeholder="e.g. ETH/USDT"
              />
            ) : (
              <div className="h-10 px-3 py-2 rounded-md border border-input bg-background flex items-center">
                {tokenPair || "Select tokens to generate pair name"}
              </div>
            )}
          </div>
          
          {/* Oracle sources configuration */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="sources">
              <AccordionTrigger className="text-sm font-medium">
                Oracle Sources Configuration
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-center">
                    <Label>Data Sources</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={handleAddSource}
                    >
                      Add Source
                    </Button>
                  </div>
                  
                  {sources.map((source, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-start">
                      <div className="col-span-3">
                        <Select 
                          value={source.name} 
                          onValueChange={(value) => handleUpdateSource(index, 'name', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Source" />
                          </SelectTrigger>
                          <SelectContent>
                            {DATA_SOURCES.map(src => (
                              <SelectItem key={src} value={src}>
                                {src}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="col-span-5">
                        <Input 
                          value={source.identifier} 
                          onChange={(e) => handleUpdateSource(index, 'identifier', e.target.value)} 
                          placeholder="Identifier"
                        />
                      </div>
                      
                      <div className="col-span-3">
                        <Input 
                          value={source.network} 
                          onChange={(e) => handleUpdateSource(index, 'network', e.target.value)} 
                          placeholder="Network"
                        />
                      </div>
                      
                      <div className="col-span-1 flex justify-center">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRemoveSource(index)}
                          disabled={sources.length <= 1}
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          {/* Success message */}
          {isCreateMarketConfirmed && createdMarketAddress && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center mb-1">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <p className="font-medium text-green-800">Market Created Successfully!</p>
              </div>
              <p className="text-sm text-green-700 break-all">
                Market Address: {createdMarketAddress}
              </p>
              <p className="text-sm text-green-700 mt-1">
                <a 
                  href={`https://testnet.monadexplorer.com/address/${createdMarketAddress}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline"
                >
                  View on Monad Explorer
                </a>
              </p>
            </div>
          )}
          
          {/* Submit button */}
          <Button 
            type="submit" 
            className="w-full" 
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
      <CardFooter className="flex justify-between text-sm text-muted-foreground">
        {tokenType === 'solana' ? (
          <p>Solana tokens will be converted to EVM-compatible addresses</p>
        ) : (
          <p>Create EVM token markets on Monad Testnet</p>
        )}
      </CardFooter>
    </Card>
  );
};

export default MarketCreationPage;