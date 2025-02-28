import React, { useState } from 'react';
// import { useCreatePool } from '@/hooks/useCreatePool';
import { HexAddress } from '@/types/web3/general/address';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useCreatePool } from '@/hooks/web3/gtx/clob-dex/pool-manager/useCreatePool';

const CreatePoolComponent: React.FC = () => {
  // Form state
  const [baseCurrency, setBaseCurrency] = useState<string>('');
  const [quoteCurrency, setQuoteCurrency] = useState<string>('');
  const [lotSize, setLotSize] = useState<string>('');
  const [maxOrderAmount, setMaxOrderAmount] = useState<string>('');

  // Validation state
  const [errors, setErrors] = useState<{
    baseCurrency?: string;
    quoteCurrency?: string;
    lotSize?: string;
    maxOrderAmount?: string;
  }>({});

  // Pool creation hook
  const {
    handleCreatePool,
    isCreatePoolPending,
    isCreatePoolConfirming,
    isCreatePoolConfirmed,
    isCreatePoolSimulationError,
    isCreatePoolSimulationLoading,
    simulateError,
    createPoolHash
  } = useCreatePool();

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: {
      baseCurrency?: string;
      quoteCurrency?: string;
      lotSize?: string;
      maxOrderAmount?: string;
    } = {};

    // Validate base currency
    if (!baseCurrency) {
      newErrors.baseCurrency = 'Base currency is required';
    } else if (!baseCurrency.startsWith('0x') || baseCurrency.length !== 42) {
      newErrors.baseCurrency = 'Invalid address format';
    }

    // Validate quote currency
    if (!quoteCurrency) {
      newErrors.quoteCurrency = 'Quote currency is required';
    } else if (!quoteCurrency.startsWith('0x') || quoteCurrency.length !== 42) {
      newErrors.quoteCurrency = 'Invalid address format';
    }

    // Validate lot size
    if (!lotSize) {
      newErrors.lotSize = 'Lot size is required';
    } else if (isNaN(Number(lotSize)) || Number(lotSize) <= 0) {
      newErrors.lotSize = 'Lot size must be a positive number';
    }

    // Validate max order amount
    if (!maxOrderAmount) {
      newErrors.maxOrderAmount = 'Max order amount is required';
    } else if (isNaN(Number(maxOrderAmount)) || Number(maxOrderAmount) <= 0) {
      newErrors.maxOrderAmount = 'Max order amount must be a positive number';
    } else if (Number(maxOrderAmount) < Number(lotSize)) {
      newErrors.maxOrderAmount = 'Max order amount must be greater than lot size';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Convert values to appropriate types
    const baseAddress = baseCurrency as HexAddress;
    const quoteAddress = quoteCurrency as HexAddress;
    
    // Ensure numeric conversion works correctly with scientific notation
    const lotSizeValue = Number(lotSize);
    const maxOrderAmountValue = Number(maxOrderAmount);
    
    const lotSizeBigInt = BigInt(Math.floor(lotSizeValue));
    const maxOrderAmountBigInt = BigInt(Math.floor(maxOrderAmountValue));
    
    console.log('Creating pool with parameters:', {
      baseAddress,
      quoteAddress,
      lotSizeBigInt: lotSizeBigInt.toString(),
      maxOrderAmountBigInt: maxOrderAmountBigInt.toString()
    });

    // Call the create pool function
    handleCreatePool(baseAddress, quoteAddress, lotSizeBigInt, maxOrderAmountBigInt);
  };

  const isLoading = isCreatePoolPending || isCreatePoolConfirming || isCreatePoolSimulationLoading;

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Create New Trading Pool</CardTitle>
        <CardDescription>
          Set up a new trading pool with base and quote currencies
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="baseCurrency">Base Currency Address</Label>
            <Input
              id="baseCurrency"
              placeholder="0x..."
              value={baseCurrency}
              onChange={(e) => setBaseCurrency(e.target.value)}
              disabled={isLoading}
              className={errors.baseCurrency ? "border-red-500" : ""}
            />
            {errors.baseCurrency && (
              <p className="text-sm text-red-500">{errors.baseCurrency}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quoteCurrency">Quote Currency Address</Label>
            <Input
              id="quoteCurrency"
              placeholder="0x..."
              value={quoteCurrency}
              onChange={(e) => setQuoteCurrency(e.target.value)}
              disabled={isLoading}
              className={errors.quoteCurrency ? "border-red-500" : ""}
            />
            {errors.quoteCurrency && (
              <p className="text-sm text-red-500">{errors.quoteCurrency}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lotSize">Lot Size</Label>
            <Input
              id="lotSize"
              placeholder="Enter lot size"
              value={lotSize}
              onChange={(e) => setLotSize(e.target.value)}
              disabled={isLoading}
              className={errors.lotSize ? "border-red-500" : ""}
            />
            {errors.lotSize && (
              <p className="text-sm text-red-500">{errors.lotSize}</p>
            )}
            <p className="text-xs text-gray-500">
              Minimum tradable amount for this pool
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxOrderAmount">Max Order Amount</Label>
            <Input
              id="maxOrderAmount"
              placeholder="Enter max order amount"
              value={maxOrderAmount}
              onChange={(e) => setMaxOrderAmount(e.target.value)}
              disabled={isLoading}
              className={errors.maxOrderAmount ? "border-red-500" : ""}
            />
            {errors.maxOrderAmount && (
              <p className="text-sm text-red-500">{errors.maxOrderAmount}</p>
            )}
            <p className="text-xs text-gray-500">
              Maximum order size allowed in this pool
            </p>
          </div>

          {isCreatePoolSimulationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {simulateError?.toString() || "Failed to create pool. Please check your inputs and try again."}
              </AlertDescription>
            </Alert>
          )}

          {isCreatePoolConfirmed && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-800">Success</AlertTitle>
              <AlertDescription className="text-green-700">
                Pool created successfully!
                {createPoolHash && (
                  <a 
                    href={`https://etherscan.io/tx/${createPoolHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block mt-1 text-blue-600 hover:underline"
                  >
                    View transaction on Etherscan
                  </a>
                )}
              </AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>

      <CardFooter>
        <Button 
          onClick={handleSubmit} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isCreatePoolPending ? "Confirming..." : 
               isCreatePoolConfirming ? "Processing..." : 
               "Simulating..."}
            </>
          ) : (
            "Create Pool"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CreatePoolComponent;