import React, { useState, useEffect } from 'react';
import { parseUnits, formatUnits } from 'viem';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  PERPETUAL_MARKET_ADDRESS
} from '@/constants/contract-address';
import {
  MOCK_USDC_ADDRESS,
  MOCK_WETH_ADDRESS,
  MOCK_WBTC_ADDRESS,
  MOCK_CHAINLINK_CONTRACT,
  MOCK_PEPE_CONTRACT,
  MOCK_SHIB_ADDRESS,
  MOCK_SOL_ADDRESS,
  MOCK_DOGE_ADDRESS,
  MOCK_XRP_ADDRESS,
  MOCK_ADA_ADDRESS
} from '@/constants/contract-address';
import { usePerpetualPlaceOrder } from '@/hooks/web3/gtx/perpetual/usePerpetualPlaceOrder';
import { HexAddress } from '@/types/web3/general/address';

interface TokenOption {
  address: HexAddress;
  symbol: string;
  decimals: number;
  iconUrl?: string;
}

const collateralTokens: TokenOption[] = [
  { address: MOCK_WETH_ADDRESS as HexAddress, symbol: 'WETH', decimals: 18, iconUrl: '/icons/eth.svg' },
  { address: MOCK_WBTC_ADDRESS as HexAddress, symbol: 'WBTC', decimals: 8, iconUrl: '/icons/btc.svg' },
  { address: MOCK_USDC_ADDRESS as HexAddress, symbol: 'USDC', decimals: 6, iconUrl: '/icons/usdc.svg' },
  { address: MOCK_CHAINLINK_CONTRACT as HexAddress, symbol: 'LINK', decimals: 18, iconUrl: '/icons/link.svg' },
  { address: MOCK_PEPE_CONTRACT as HexAddress, symbol: 'PEPE', decimals: 18, iconUrl: '/icons/pepe.svg' },
  { address: MOCK_SHIB_ADDRESS as HexAddress, symbol: 'SHIB', decimals: 18, iconUrl: '/icons/shib.svg' },
  { address: MOCK_SOL_ADDRESS as HexAddress, symbol: 'SOL', decimals: 18, iconUrl: '/icons/sol.svg' },
  { address: MOCK_DOGE_ADDRESS as HexAddress, symbol: 'DOGE', decimals: 18, iconUrl: '/icons/doge.svg' },
  { address: MOCK_XRP_ADDRESS as HexAddress, symbol: 'XRP', decimals: 18, iconUrl: '/icons/xrp.svg' },
  { address: MOCK_ADA_ADDRESS as HexAddress, symbol: 'ADA', decimals: 18, iconUrl: '/icons/ada.svg' }
];

const PerpetualOrderForm: React.FC = () => {
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [positionType, setPositionType] = useState<'increase' | 'decrease'>('increase');
  const [isLong, setIsLong] = useState<boolean>(true);
  const [collateralToken, setCollateralToken] = useState<HexAddress>(MOCK_WETH_ADDRESS as HexAddress);
  const [collateralAmount, setCollateralAmount] = useState<string>('0.1');
  const [sizeDeltaUsd, setSizeDeltaUsd] = useState<string>('100');
  const [leverage, setLeverage] = useState<number>(10);
  const [triggerPrice, setTriggerPrice] = useState<string>('3000');
  const [acceptablePriceImpact, setAcceptablePriceImpact] = useState<number>(5);
  const [autoCancel, setAutoCancel] = useState<boolean>(false);
  
  const selectedToken = collateralTokens.find(token => token.address === collateralToken);

  const { 
    placeMarketIncreaseOrder, 
    placeLimitIncreaseOrder, 
    placeMarketDecreaseOrder, 
    placeLimitDecreaseOrder,
    isOrderPending,
    isOrderConfirming,
    orderHash
  } = usePerpetualPlaceOrder();

  // Update sizeDeltaUsd when leverage or collateral changes
  useEffect(() => {
    if (positionType === 'increase') {
      const collateralValue = parseFloat(collateralAmount) || 0;
      const currentTriggerPrice = parseFloat(triggerPrice) || 1;
      const calculatedSize = collateralValue * currentTriggerPrice * leverage;
      setSizeDeltaUsd(calculatedSize.toString());
    }
  }, [collateralAmount, leverage, triggerPrice, positionType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedToken) {
      toast.error('Please select a valid collateral token');
      return;
    }

    try {
      const collateralAmountBigInt = parseUnits(
        collateralAmount || '0', 
        selectedToken.decimals
      );
      
      const sizeDeltaUsdBigInt = parseUnits(
        sizeDeltaUsd || '0', 
        18
      );
      
      const triggerPriceBigInt = parseUnits(
        triggerPrice || '0', 
        18
      );
      
      const orderParams = {
        market: PERPETUAL_MARKET_ADDRESS as HexAddress,
        collateralToken: collateralToken,
        isLong,
        sizeDeltaUsd: sizeDeltaUsdBigInt,
        collateralAmount: collateralAmountBigInt,
        leverage,
        triggerPrice: triggerPriceBigInt,
        acceptablePriceImpact,
        autoCancel
      };

      // Call the appropriate function based on the order type and position type
      if (positionType === 'increase') {
        if (orderType === 'market') {
          await placeMarketIncreaseOrder(orderParams);
        } else {
          await placeLimitIncreaseOrder(orderParams);
        }
      } else {
        if (orderType === 'market') {
          await placeMarketDecreaseOrder(orderParams);
        } else {
          await placeLimitDecreaseOrder(orderParams);
        }
      }
    } catch (error) {
      console.error('Order submission error:', error);
      toast.error('Failed to submit order');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Perpetual Order</CardTitle>
        <CardDescription>
          Create a new perpetual futures order
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Order Type Tabs */}
            <Tabs 
              value={orderType} 
              onValueChange={(value) => setOrderType(value as 'market' | 'limit')}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="market">Market</TabsTrigger>
                <TabsTrigger value="limit">Limit</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Position Type Tabs */}
            <Tabs 
              value={positionType} 
              onValueChange={(value) => setPositionType(value as 'increase' | 'decrease')}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="increase">Open/Increase</TabsTrigger>
                <TabsTrigger value="decrease">Close/Decrease</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Direction (Long/Short) */}
            <div className="space-y-2">
              <Label>Position Direction</Label>
              <RadioGroup 
                value={isLong ? 'long' : 'short'} 
                onValueChange={(value: string) => setIsLong(value === 'long')}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="long" id="long" />
                  <Label htmlFor="long" className="text-green-600 font-medium">Long</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="short" id="short" />
                  <Label htmlFor="short" className="text-red-600 font-medium">Short</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Collateral Token Selection */}
            <div className="space-y-2">
              <Label htmlFor="collateralToken">Collateral Token</Label>
              <Select
                value={collateralToken}
                onValueChange={(value) => setCollateralToken(value as HexAddress)}
              >
                <SelectTrigger id="collateralToken" className="w-full">
                  <div className="flex items-center gap-2">
                    {selectedToken?.iconUrl && (
                      <img 
                        src={selectedToken.iconUrl} 
                        alt={selectedToken.symbol} 
                        className="w-5 h-5 rounded-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <SelectValue placeholder="Select token" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {collateralTokens.map((token) => (
                    <SelectItem key={token.address} value={token.address}>
                      <div className="flex items-center gap-2">
                        {token.iconUrl && (
                          <img 
                            src={token.iconUrl} 
                            alt={token.symbol} 
                            className="w-5 h-5 rounded-full"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        <span>{token.symbol}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Collateral Amount */}
            {positionType === 'increase' && (
              <div className="space-y-2">
                <Label htmlFor="collateralAmount">Collateral Amount</Label>
                <Input 
                  id="collateralAmount"
                  type="number"
                  step="0.001"
                  min="0"
                  value={collateralAmount}
                  onChange={(e) => setCollateralAmount(e.target.value)}
                  placeholder="Enter amount"
                />
                <p className="text-sm text-gray-500">
                  {selectedToken ? selectedToken.symbol : 'Token'}
                </p>
              </div>
            )}

            {/* Leverage Slider (for increase only) */}
            {positionType === 'increase' && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="leverage">Leverage: {leverage}x</Label>
                </div>
                <Slider
                  id="leverage"
                  min={1}
                  max={50}
                  step={1}
                  value={[leverage]}
                  onValueChange={(values) => setLeverage(values[0])}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1x</span>
                  <span>25x</span>
                  <span>50x</span>
                </div>
              </div>
            )}

            {/* Position Size */}
            <div className="space-y-2">
              <Label htmlFor="sizeDeltaUsd">
                {positionType === 'increase' ? 'Position Size (USD)' : 'Size to Close (USD)'}
              </Label>
              <Input 
                id="sizeDeltaUsd"
                type="number"
                step="1"
                min="0"
                value={sizeDeltaUsd}
                onChange={(e) => setSizeDeltaUsd(e.target.value)}
                placeholder="Enter size in USD"
                disabled={positionType === 'increase'}
              />
            </div>

            {/* Trigger Price (for limit orders) */}
            {orderType === 'limit' && (
              <div className="space-y-2">
                <Label htmlFor="triggerPrice">
                  {isLong ? 'Buy when price reaches' : 'Sell when price reaches'}
                </Label>
                <Input 
                  id="triggerPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={triggerPrice}
                  onChange={(e) => setTriggerPrice(e.target.value)}
                  placeholder="Enter trigger price"
                />
                <p className="text-sm text-gray-500">USD</p>
              </div>
            )}

            {/* Acceptable Price Impact */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="priceImpact">Max Price Impact: {acceptablePriceImpact}%</Label>
              </div>
              <Slider
                id="priceImpact"
                min={1}
                max={20}
                step={1}
                value={[acceptablePriceImpact]}
                onValueChange={(values) => setAcceptablePriceImpact(values[0])}
              />
            </div>

            {/* Auto Cancel (for limit orders) */}
            {orderType === 'limit' && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="autoCancel"
                  checked={autoCancel}
                  onCheckedChange={setAutoCancel}
                />
                <Label htmlFor="autoCancel">
                  Auto-cancel if not filled within 24 hours
                </Label>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="mt-6 p-4 bg-gray-100 rounded-md space-y-2">
            <h3 className="font-medium">Order Summary</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span>Order Type:</span>
              <span className="font-medium">{orderType === 'market' ? 'Market' : 'Limit'} {positionType === 'increase' ? 'Open' : 'Close'}</span>
              
              <span>Position:</span>
              <span className={`font-medium ${isLong ? 'text-green-600' : 'text-red-600'}`}>
                {isLong ? 'Long' : 'Short'}
              </span>
              
              {positionType === 'increase' && (
                <>
                  <span>Collateral:</span>
                  <span className="font-medium">
                    {collateralAmount} {selectedToken?.symbol}
                  </span>
                  
                  <span>Leverage:</span>
                  <span className="font-medium">{leverage}x</span>
                </>
              )}
              
              <span>Size:</span>
              <span className="font-medium">${sizeDeltaUsd}</span>
              
              {orderType === 'limit' && (
                <>
                  <span>Trigger Price:</span>
                  <span className="font-medium">${triggerPrice}</span>
                </>
              )}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full mt-6"
            disabled={isOrderPending || isOrderConfirming}
          >
            {isOrderPending || isOrderConfirming
              ? 'Processing...'
              : `${orderType === 'market' ? 'Market' : 'Limit'} ${positionType === 'increase' ? 'Open' : 'Close'} ${isLong ? 'Long' : 'Short'}`
            }
          </Button>
        </form>
      </CardContent>
      {orderHash && (
        <CardFooter className="flex flex-col items-start">
          <p className="text-sm font-medium">Order submitted:</p>
          <a 
            href={`https://sepolia.etherscan.io/tx/${orderHash}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-blue-500 hover:underline break-all"
          >
            {orderHash}
          </a>
        </CardFooter>
      )}
    </Card>
  );
};

export default PerpetualOrderForm;