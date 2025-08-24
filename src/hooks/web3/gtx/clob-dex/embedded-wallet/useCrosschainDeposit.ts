import { usePrivy, useWallets } from '@privy-io/react-auth';
import { encodeFunctionData, formatUnits } from 'viem';
import ERC20ABI from '@/abis/tokens/TokenABI';
import { ChainBalanceManagerABI } from '@/abis/gtx/clob/ChainBalanceManagerABI';
import { useState } from 'react';
import { useToast } from '@/components/clob-dex/place-order/toastContext';
import { getContractAddress, ContractName } from '@/constants/contract/contract-address';
import { isCrosschainSupportedChain, getSupportedCrosschainDepositChainNames } from '@/constants/features/features-config';

export function useCrosschainDeposit() {
  const { wallets } = useWallets();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const { showToast, updateToast } = useToast();

  // Helper function to get balance via provider
  const getBalance = async (provider: any, address: string, tokenAddress?: string): Promise<string> => {
    try {
      if (!tokenAddress) {
        // Get native ETH balance
        const balance = await provider.request({
          method: 'eth_getBalance',
          params: [address, 'latest'],
        });
        return formatUnits(BigInt(balance), 18);
      } else {
        // Get ERC20 token balance
        const data = encodeFunctionData({
          abi: ERC20ABI,
          functionName: 'balanceOf',
          args: [address as `0x${string}`],
        });
        
        const balance = await provider.request({
          method: 'eth_call',
          params: [
            {
              to: tokenAddress,
              data,
            },
            'latest',
          ],
        });
        return formatUnits(BigInt(balance), 6); // Assuming USDC with 6 decimals
      }
    } catch (error) {
      console.error('[CROSSCHAIN-DEPOSIT] Error getting balance:', error);
      return '0';
    }
  };

  // Helper function to log balances for both chains
  const logBalances = async (
    sourceProvider: any,
    destinationProvider: any,
    externalAddress: string,
    embeddedAddress: string,
    tokenAddress: string,
    sourceChainId: number,
    destinationChainId: number,
    phase: 'before' | 'after'
  ) => {
    console.log(`[CROSSCHAIN-DEPOSIT] \n=== BALANCE LOG ${phase.toUpperCase()} CROSSCHAIN DEPOSIT ===`);
    
    try {
      // Source chain balances
      console.log(`[CROSSCHAIN-DEPOSIT] \n--- SOURCE CHAIN (${sourceChainId}) BALANCES ---`);
      const sourceExternalNative = await getBalance(sourceProvider, externalAddress);
      const sourceExternalToken = await getBalance(sourceProvider, externalAddress, tokenAddress);
      const sourceEmbeddedNative = await getBalance(sourceProvider, embeddedAddress);
      const sourceEmbeddedToken = await getBalance(sourceProvider, embeddedAddress, tokenAddress);
      
      console.log(`[CROSSCHAIN-DEPOSIT] External Wallet (${externalAddress}):`);
      console.log(`[CROSSCHAIN-DEPOSIT]   - Native ETH: ${sourceExternalNative}`);
      console.log(`[CROSSCHAIN-DEPOSIT]   - Token: ${sourceExternalToken}`);
      console.log(`[CROSSCHAIN-DEPOSIT] Embedded Wallet (${embeddedAddress}):`);
      console.log(`[CROSSCHAIN-DEPOSIT]   - Native ETH: ${sourceEmbeddedNative}`);
      console.log(`[CROSSCHAIN-DEPOSIT]   - Token: ${sourceEmbeddedToken}`);

      // Destination chain balances (if different provider)
      if (destinationProvider && destinationChainId !== sourceChainId) {
        console.log(`[CROSSCHAIN-DEPOSIT] \n--- DESTINATION CHAIN (${destinationChainId}) BALANCES ---`);
        const destExternalNative = await getBalance(destinationProvider, externalAddress);
        const destExternalToken = await getBalance(destinationProvider, externalAddress, tokenAddress);
        const destEmbeddedNative = await getBalance(destinationProvider, embeddedAddress);
        const destEmbeddedToken = await getBalance(destinationProvider, embeddedAddress, tokenAddress);
        
        console.log(`[CROSSCHAIN-DEPOSIT] External Wallet (${externalAddress}):`);
        console.log(`[CROSSCHAIN-DEPOSIT]   - Native ETH: ${destExternalNative}`);
        console.log(`[CROSSCHAIN-DEPOSIT]   - Token: ${destExternalToken}`);
        console.log(`[CROSSCHAIN-DEPOSIT] Embedded Wallet (${embeddedAddress}):`);
        console.log(`[CROSSCHAIN-DEPOSIT]   - Native ETH: ${destEmbeddedNative}`);
        console.log(`[CROSSCHAIN-DEPOSIT]   - Token: ${destEmbeddedToken}`);
      }
      
      console.log(`[CROSSCHAIN-DEPOSIT] === END BALANCE LOG ${phase.toUpperCase()} ===\n`);
    } catch (error) {
      console.error('[CROSSCHAIN-DEPOSIT] Error logging balances:', error);
    }
  };

  const deposit = async (amount: string, tokenAddress: `0x${string}`, recipientAddress: `0x${string}`, sourceChainId: number) => {
    console.log('[CROSSCHAIN-DEPOSIT] 🟠 useCrosschainDeposit: Crosschain deposit hook called');
    console.log('[CROSSCHAIN-DEPOSIT] 🟠 useCrosschainDeposit: Amount:', amount, 'Token:', tokenAddress);
    console.log('[CROSSCHAIN-DEPOSIT] 🟠 useCrosschainDeposit: Recipient:', recipientAddress, 'Source Chain:', sourceChainId);
    
    // Note: recipientAddress should be the embedded (privy) wallet address
    // The external wallet will be the sender of the transaction
    const toastId = showToast({
      type: 'loading',
      message: 'Processing crosschain deposit...',
    });

    try {
      setLoading(true);
      setError(null);
      setCurrentStep('Initializing crosschain deposit...');
      console.log('[CROSSCHAIN-DEPOSIT] 🟠 useCrosschainDeposit: Starting crosschain deposit process');

      // Validate chain support first
      if (!isCrosschainSupportedChain(sourceChainId)) {
        const supportedChains = getSupportedCrosschainDepositChainNames().join(', ');
        throw new Error(`Current chain does not support crosschain deposits. Please switch to a supported crosschain deposit chain: ${supportedChains}`);
      }

      // Add more defensive checks
      if (!wallets || wallets.length === 0) {
        throw new Error('No wallets available');
      }

      setCurrentStep('Searching for wallets...');
      console.log('[CROSSCHAIN-DEPOSIT] Available wallets:', wallets);

      const external = wallets.find(w => {
        console.log('[CROSSCHAIN-DEPOSIT] Checking wallet:', w);
        return (
          w &&
          w.walletClientType !== 'privy' &&
          w.chainId &&
          typeof w.chainId === 'string' &&
          w.chainId.startsWith(`eip155:${sourceChainId}`) &&
          w.address &&
          typeof w.address === 'string' &&
          w.address.startsWith('0x')
        );
      });

      // Get the embedded wallet following the same pattern as usePrivyPlaceOrder
      const embedded = wallets.find(w => w.walletClientType === 'privy') || wallets[0];
      const embeddedAddress = embedded?.address;

      console.log('[CROSSCHAIN-DEPOSIT] External wallet:', external);
      console.log('[CROSSCHAIN-DEPOSIT] Embedded wallet:', embedded);
      console.log('[CROSSCHAIN-DEPOSIT] Embedded address:', embeddedAddress);
      console.log('[CROSSCHAIN-DEPOSIT] All wallets:', wallets.map(w => ({ type: w.walletClientType, address: w.address, chainId: w.chainId })));

      if (!external) {
        throw new Error('External wallet not found or not properly configured');
      }

      if (!embedded || !embeddedAddress) {
        throw new Error('Embedded wallet not found or missing address');
      }

      setCurrentStep('Wallets found, validating...');

      // Additional validation
      if (!external.getEthereumProvider) {
        throw new Error('External wallet does not support getEthereumProvider');
      }

      setCurrentStep('Preparing transaction data...');

      // Get ChainBalanceManager contract address for the source chain
      let chainBalanceManagerAddress: string;
      try {
        chainBalanceManagerAddress = getContractAddress(sourceChainId, ContractName.chainBalanceManager);
        if (!chainBalanceManagerAddress || chainBalanceManagerAddress === '0x0000000000000000000000000000000000000000') {
          throw new Error(`ChainBalanceManager address not configured for chain ${sourceChainId}`);
        }
        
        console.log('[CROSSCHAIN-DEPOSIT] 🔴 CHAIN BALANCE MANAGER INFO:');
        console.log('[CROSSCHAIN-DEPOSIT] 🔴   Address:', chainBalanceManagerAddress);
        console.log('[CROSSCHAIN-DEPOSIT] 🔴   Source Chain ID:', sourceChainId);
        console.log('[CROSSCHAIN-DEPOSIT] 🔴   Contract Name:', ContractName.chainBalanceManager);
      } catch (error) {
        throw new Error(`ChainBalanceManager not available on chain ${sourceChainId}`);
      }

      // Convert amount to proper units (assuming 6 decimals for USDC)
      const units = BigInt(Math.floor(Number(amount) * 10 ** 6));

      console.log('[CROSSCHAIN-DEPOSIT] 🔴 TRANSACTION PARAMETERS:');
      console.log('[CROSSCHAIN-DEPOSIT] 🔴   Token Address:', tokenAddress);
      console.log('[CROSSCHAIN-DEPOSIT] 🔴   Amount (original):', amount);
      console.log('[CROSSCHAIN-DEPOSIT] 🔴   Amount (units):', units.toString());
      console.log('[CROSSCHAIN-DEPOSIT] 🔴   Recipient Address:', recipientAddress);
      console.log('[CROSSCHAIN-DEPOSIT] 🔴   Sender Address (External Wallet):', external.address);

      // First, we need to approve the ChainBalanceManager to spend the tokens
      const approveData = encodeFunctionData({
        abi: ERC20ABI,
        functionName: 'approve',
        args: [chainBalanceManagerAddress, units],
      });

      console.log('[CROSSCHAIN-DEPOSIT] 🔴 APPROVE TRANSACTION DATA:');
      console.log('[CROSSCHAIN-DEPOSIT] 🔴   Target Contract (Token):', tokenAddress);
      console.log('[CROSSCHAIN-DEPOSIT] 🔴   Spender (ChainBalanceManager):', chainBalanceManagerAddress);
      console.log('[CROSSCHAIN-DEPOSIT] 🔴   Amount to approve:', units.toString());
      console.log('[CROSSCHAIN-DEPOSIT] 🔴   Encoded data:', approveData);

      // Then, we'll call the deposit function on ChainBalanceManager
      const depositData = encodeFunctionData({
        abi: ChainBalanceManagerABI,
        functionName: 'deposit',
        args: [tokenAddress, units, recipientAddress],
      });

      console.log('[CROSSCHAIN-DEPOSIT] 🔴 DEPOSIT TRANSACTION DATA:');
      console.log('[CROSSCHAIN-DEPOSIT] 🔴   Target Contract (ChainBalanceManager):', chainBalanceManagerAddress);
      console.log('[CROSSCHAIN-DEPOSIT] 🔴   Function:', 'deposit');
      console.log('[CROSSCHAIN-DEPOSIT] 🔴   Args:');
      console.log('[CROSSCHAIN-DEPOSIT] 🔴     - tokenAddress:', tokenAddress);
      console.log('[CROSSCHAIN-DEPOSIT] 🔴     - units:', units.toString());
      console.log('[CROSSCHAIN-DEPOSIT] 🔴     - recipientAddress:', recipientAddress);
      console.log('[CROSSCHAIN-DEPOSIT] 🔴   Encoded data:', depositData);

      setCurrentStep('Connecting to wallet provider...');

      const provider = await external.getEthereumProvider();

      if (!provider) {
        throw new Error('Failed to get Ethereum provider from external wallet');
      }

      console.log('[CROSSCHAIN-DEPOSIT] Provider obtained:', provider);

      // Check if provider has request method
      if (!provider.request || typeof provider.request !== 'function') {
        throw new Error('Provider does not have request method');
      }

      // For now, assume destination chain is different (e.g., Rari testnet)
      // In a real implementation, this would be configurable
      const destinationChainId = 1918988905; // Rari testnet
      
      // Get destination provider (for balance logging only)
      let destinationProvider = null;
      try {
        // Try to get embedded wallet provider for destination chain
        const embeddedOnDestination = wallets.find(w => 
          w && w.walletClientType === 'privy' && 
          w.chainId && w.chainId.includes(destinationChainId.toString())
        );
        if (embeddedOnDestination) {
          destinationProvider = await embeddedOnDestination.getEthereumProvider();
        }
      } catch (error) {
        console.warn('[CROSSCHAIN-DEPOSIT] Could not get destination provider for balance logging:', error);
      }

      setCurrentStep('Switching to correct network...');

      // Switch chain to the source chain
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${sourceChainId.toString(16)}` }],
      });

      // Log balances before transaction
      setCurrentStep('Logging initial balances...');
      await logBalances(
        provider,
        destinationProvider,
        external.address,
        recipientAddress,
        tokenAddress,
        sourceChainId,
        destinationChainId,
        'before'
      );

      setCurrentStep('Please approve token spending in your wallet...');

      console.log('[CROSSCHAIN-DEPOSIT] 🔴 SENDING APPROVE TRANSACTION:');
      console.log('[CROSSCHAIN-DEPOSIT] 🔴   Method: eth_sendTransaction');
      console.log('[CROSSCHAIN-DEPOSIT] 🔴   From (Sender):', external.address);
      console.log('[CROSSCHAIN-DEPOSIT] 🔴   To (Token Contract):', tokenAddress);
      console.log('[CROSSCHAIN-DEPOSIT] 🔴   Value:', '0x0');
      console.log('[CROSSCHAIN-DEPOSIT] 🔴   Data:', approveData);

      // Send approve transaction first - external wallet approves ChainBalanceManager to spend tokens
      const approveTxHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: external.address, // External wallet is the sender
            to: tokenAddress,
            value: '0x0',
            data: approveData,
          },
        ],
      });

      console.log('[CROSSCHAIN-DEPOSIT] Approve transaction sent:', approveTxHash);
      setCurrentStep('Approval confirmed, now initiating crosschain deposit...');

      // Wait a moment for the approval to be mined
      await new Promise(resolve => setTimeout(resolve, 2000));

      setCurrentStep('Please confirm the crosschain deposit in your wallet...');

      console.log('[CROSSCHAIN-DEPOSIT] 🔴 SENDING DEPOSIT TRANSACTION:');
      console.log('[CROSSCHAIN-DEPOSIT] 🔴   Method: eth_sendTransaction');
      console.log('[CROSSCHAIN-DEPOSIT] 🔴   From (Sender):', external.address);
      console.log('[CROSSCHAIN-DEPOSIT] 🔴   To (ChainBalanceManager):', chainBalanceManagerAddress);
      console.log('[CROSSCHAIN-DEPOSIT] 🔴   Value:', '0x0');
      console.log('[CROSSCHAIN-DEPOSIT] 🔴   Data:', depositData);
      console.log('[CROSSCHAIN-DEPOSIT] 🔴   Function Call: deposit(tokenAddress, units, recipientAddress)');
      console.log('[CROSSCHAIN-DEPOSIT] 🔴   Function Args: [', tokenAddress, ',', units.toString(), ',', recipientAddress, ']');

      // Send deposit transaction to ChainBalanceManager
      // External wallet calls deposit(), tokens go from external -> ChainBalanceManager -> recipient (embedded wallet)
      const depositTxHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: external.address, // External wallet is the sender
            to: chainBalanceManagerAddress,
            value: '0x0',
            data: depositData, // Contains recipientAddress (embedded wallet) as the final destination
          },
        ],
      });

      setCurrentStep('Crosschain deposit submitted successfully!');
      updateToast(toastId, {
        type: 'success',
        message: 'Crosschain deposit successful! Tokens will arrive shortly.',
      });
      console.log('[CROSSCHAIN-DEPOSIT] 🟠 useCrosschainDeposit: Crosschain deposit transaction sent:', depositTxHash);
      console.log('[CROSSCHAIN-DEPOSIT] 🟠 useCrosschainDeposit: Crosschain deposit completed successfully');

      // Log balances after transaction (immediate - before cross-chain processing)
      setCurrentStep('Logging post-transaction balances...');
      await logBalances(
        provider,
        destinationProvider,
        external.address,
        recipientAddress,
        tokenAddress,
        sourceChainId,
        destinationChainId,
        'after'
      );

      // Reset after a short delay
      setTimeout(() => {
        setCurrentStep('');
      }, 3000);

      return depositTxHash;
    } catch (error) {
      console.error('[CROSSCHAIN-DEPOSIT] 🟠 useCrosschainDeposit: Crosschain deposit error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      updateToast(toastId, {
        type: 'error',
        message: 'Crosschain deposit failed. Please try again.',
      });
      setCurrentStep('');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setLoading(false);
    setCurrentStep('');
    setError(null);
  };

  return {
    deposit,
    loading,
    currentStep,
    error,
    resetState,
  };
}