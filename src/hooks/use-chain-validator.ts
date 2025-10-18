import { FEATURE_FLAGS } from '@/constants/features/features-config';
import { useWallets } from '@privy-io/react-auth';
import { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useChainId, useDisconnect } from 'wagmi';

// Chain configuration
const CORE_ANVIL_CHAIN_ID = 31337; // For embedded wallets
const SIDE_DEVNET_CHAIN_ID = 31338; // For external wallets

// Map chain IDs to readable names
const CHAIN_NAMES: Record<number, string> = {
  31337: 'Core Devnet',
  31338: 'Side Devnet',
  1: 'Ethereum Mainnet',
  5: 'Goerli',
  11155111: 'Sepolia',
};

interface ChainValidatorReturn {
  isValidChain: boolean;
  embeddedWalletChain: number;
  externalWalletChain: number;
  currentChainName: string;
  isValidating: boolean;
  hasEmbeddedWallet: boolean;
  hasExternalWallet: boolean;
}

/**
 * Hook to validate chains for BOTH embedded and external wallets
 * - Embedded wallets: Must stay on Core Devnet (31337)
 * - External wallets: Must stay on Side Devnet (31338)
 * Automatically switches wallets to correct chains or disconnects if switching fails
 */
export function useChainValidator(): ChainValidatorReturn {
  const currentChainId = useChainId();
  const { disconnect } = useDisconnect();
  const { wallets } = useWallets();

  const [isValidating, setIsValidating] = useState(false);
  const validationInProgressRef = useRef(false);
  const lastValidatedStateRef = useRef<string>('');
  const switchingWalletRef = useRef<Set<string>>(new Set());

  // Separate wallets by type
  const embeddedWallet = wallets.find(
    wallet =>
      wallet.walletClientType === 'privy' ||
      wallet.walletClientType === 'embedded' ||
      wallet.connectorType === 'embedded'
  );

  const externalWallets = wallets.filter(
    wallet =>
      wallet.walletClientType !== 'privy' &&
      wallet.walletClientType !== 'embedded' &&
      wallet.connectorType !== 'embedded'
  );

  const hasEmbeddedWallet = !!embeddedWallet;
  const hasExternalWallet = externalWallets.length > 0;

  // Get current chain name
  const currentChainName = CHAIN_NAMES[currentChainId] || `Chain ${currentChainId}`;

  // Generate validation state key to prevent duplicate validations
  const getValidationStateKey = useCallback(() => {
    const embeddedChain = embeddedWallet?.chainId || 'none';
    const externalChains = externalWallets.map(w => w.chainId || 'none').join(',');
    return `embedded:${embeddedChain}|external:${externalChains}`;
  }, [embeddedWallet, externalWallets]);

  // Switch embedded wallet to Core Devnet
  const switchEmbeddedWallet = useCallback(async () => {
    if (!embeddedWallet || !embeddedWallet.chainId) return;

    const walletId = embeddedWallet.address || 'embedded';

    // Skip if already switching this wallet
    if (switchingWalletRef.current.has(walletId)) {
      console.log('[CHAIN_VALIDATOR] Embedded wallet switch already in progress');
      return;
    }

    if (Number(embeddedWallet.chainId) === CORE_ANVIL_CHAIN_ID) {
      console.log('[CHAIN_VALIDATOR] Embedded wallet already on Core Devnet');
      return;
    }

    const currentChain =
      CHAIN_NAMES[Number(embeddedWallet.chainId)] || `Chain ${embeddedWallet.chainId}`;
    console.log(
      `[CHAIN_VALIDATOR] Embedded wallet on ${currentChain} (${embeddedWallet.chainId}), switching to Core Devnet`
    );

    switchingWalletRef.current.add(walletId);

    try {
      await embeddedWallet.switchChain(CORE_ANVIL_CHAIN_ID);
      console.log(
        '[CHAIN_VALIDATOR] Successfully switched embedded wallet to Core Devnet'
      );

      toast.success('Embedded wallet switched to Core Devnet', {
        duration: 3000,
      });
    } catch (error) {
      console.error('[CHAIN_VALIDATOR] Failed to switch embedded wallet:', error);

      toast.error(
        'Failed to switch embedded wallet to Core Devnet. Please try manually.',
        {
          duration: 6000,
        }
      );
    } finally {
      switchingWalletRef.current.delete(walletId);
    }
  }, [embeddedWallet]);

  // Switch external wallets to Side Devnet
  const switchExternalWallets = useCallback(async () => {
    if (externalWallets.length === 0) return;

    for (const wallet of externalWallets) {
      if (!wallet.chainId) continue;

      const walletId = wallet.address || 'external';

      // Skip if already switching this wallet
      if (switchingWalletRef.current.has(walletId)) {
        console.log(
          `[CHAIN_VALIDATOR] External wallet ${walletId} switch already in progress`
        );
        continue;
      }

      if (Number(wallet.chainId) === SIDE_DEVNET_CHAIN_ID) {
        console.log(
          `[CHAIN_VALIDATOR] External wallet ${wallet.walletClientType} already on Side Devnet`
        );
        continue;
      }

      const currentChain =
        CHAIN_NAMES[Number(wallet.chainId)] || `Chain ${wallet.chainId}`;
      console.log(
        `[CHAIN_VALIDATOR] External wallet ${wallet.walletClientType} on ${currentChain} (${wallet.chainId}), switching to Side Devnet`
      );

      switchingWalletRef.current.add(walletId);

      try {
        await wallet.switchChain(SIDE_DEVNET_CHAIN_ID);
        console.log(
          `[CHAIN_VALIDATOR] Successfully switched external wallet to Side Devnet`
        );

        toast.success(`External wallet switched to Side Devnet`, {
          duration: 3000,
        });
      } catch (error) {
        console.error('[CHAIN_VALIDATOR] Failed to switch external wallet:', error);

        toast.error(
          `Failed to switch external wallet to Side Devnet. Please switch manually in your wallet.`,
          {
            duration: 6000,
            action: {
              label: 'Disconnect',
              onClick: () => disconnect(),
            },
          }
        );
      } finally {
        switchingWalletRef.current.delete(walletId);
      }
    }
  }, [externalWallets, disconnect]);

  // Main validation effect - validates ALL wallets
  useEffect(() => {
    const validateAllWallets = async () => {
      // Skip if no wallets connected
      if (wallets.length === 0) {
        console.log('[CHAIN_VALIDATOR] No wallets connected');
        lastValidatedStateRef.current = '';
        setIsValidating(false);
        return;
      }

      // Skip if validation already in progress
      if (validationInProgressRef.current) {
        console.log('[CHAIN_VALIDATOR] Validation already in progress');
        return;
      }

      // Skip if crosschain is disabled
      if (!FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED) {
        console.log('[CHAIN_VALIDATOR] Crosschain disabled - allowing all chains');
        return;
      }

      // Check if we need to validate (state changed)
      const currentStateKey = getValidationStateKey();
      if (lastValidatedStateRef.current === currentStateKey) {
        console.log('[CHAIN_VALIDATOR] Wallet states unchanged, skipping validation');
        return;
      }

      console.log('[CHAIN_VALIDATOR] Starting validation for all wallets');
      validationInProgressRef.current = true;
      setIsValidating(true);

      try {
        // Validate and switch both wallet types in parallel
        await Promise.all([switchEmbeddedWallet(), switchExternalWallets()]);

        // Mark current state as validated
        lastValidatedStateRef.current = currentStateKey;
      } catch (error) {
        console.error('[CHAIN_VALIDATOR] Validation error:', error);
      } finally {
        validationInProgressRef.current = false;
        setIsValidating(false);
      }
    };

    // Add delay to ensure wallets are fully connected and chain info is available
    const timeout = setTimeout(validateAllWallets, 1500);

    return () => {
      clearTimeout(timeout);
    };
  }, [wallets, getValidationStateKey, switchEmbeddedWallet, switchExternalWallets]);

  // Listen to currentChainId changes (when user manually switches in wallet)
  useEffect(() => {
    // Reset last validated state when chain changes to trigger re-validation
    if (wallets.length > 0) {
      console.log(
        `[CHAIN_VALIDATOR] Chain changed to ${currentChainName} (${currentChainId}), will re-validate`
      );
      lastValidatedStateRef.current = '';
    }
  }, [currentChainId, currentChainName, wallets.length]);

  // Check if all wallets are on correct chains
  const isValidChain = useCallback((): boolean => {
    if (!FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED) return true;

    let valid = true;

    // Check embedded wallet
    if (
      embeddedWallet?.chainId &&
      Number(embeddedWallet.chainId) !== CORE_ANVIL_CHAIN_ID
    ) {
      console.log(
        `[CHAIN_VALIDATOR] Embedded wallet on wrong chain: ${embeddedWallet.chainId}`
      );
      valid = false;
    }

    // Check external wallets
    for (const wallet of externalWallets) {
      if (wallet.chainId && Number(wallet.chainId) !== SIDE_DEVNET_CHAIN_ID) {
        console.log(
          `[CHAIN_VALIDATOR] External wallet on wrong chain: ${wallet.chainId}`
        );
        valid = false;
      }
    }

    return valid;
  }, [embeddedWallet, externalWallets]);

  return {
    isValidChain: isValidChain(),
    embeddedWalletChain: Number(embeddedWallet?.chainId) || CORE_ANVIL_CHAIN_ID,
    externalWalletChain: Number(externalWallets[0]?.chainId) || SIDE_DEVNET_CHAIN_ID,
    currentChainName,
    isValidating,
    hasEmbeddedWallet,
    hasExternalWallet,
  };
}
