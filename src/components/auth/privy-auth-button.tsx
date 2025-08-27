'use client';

import { CustomAvatar } from '@/components/button-connect-wallet.tsx/button-connect-wallet';
import { Button } from '@/components/ui/button';
import { appchainTestnet, wagmiConfig } from '@/configs/wagmi';
import { usePrivyAuth } from '@/hooks/use-privy-auth';
import { Check, Copy, Globe, LogOut, Mail, User, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useChainId } from 'wagmi';
import { switchChain } from 'wagmi/actions';

interface PrivyAuthButtonProps {
  className?: string;
  showFullProfile?: boolean;
}

export function PrivyAuthButton({
  className,
  showFullProfile = true,
}: PrivyAuthButtonProps) {
  const {
    ready,
    authenticated,
    login,
    logout,
    linkWallet,
    hasWallet,
    walletAddress,
    hasSocialLogin,
    socialLoginMethod,
    displayName,
    isFullyAuthenticated,
    needsWalletConnection,
    authenticationMethod,
  } = usePrivyAuth();

  const [copied, setCopied] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're only rendering on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleCopyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // handle login with add app chain in external wallet
  const chainId = useChainId();
  const isAppchainConnected = chainId === appchainTestnet.id;

  const checkAndSwitchToAppchain = async () => {
    if (isAppchainConnected) {
      return { success: true, message: 'Already connected to Appchain' };
    }

    try {
      if (switchChain) {
        await switchChain(wagmiConfig, {chainId : appchainTestnet.id});
        return { success: true, message: 'Switched to Appchain successfully' };
      }
    } catch (error: any) {
      console.log('Chain not found, attempting to add...', error);
    }

    return await addAppchainToWallet();
  };


  const addAppchainToWallet = async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: `0x${appchainTestnet.id.toString(16)}`, // Convert to hex
            chainName: appchainTestnet.name,
            nativeCurrency: appchainTestnet.nativeCurrency,
            rpcUrls: appchainTestnet.rpcUrls.default.http,
            blockExplorerUrls: [appchainTestnet.blockExplorers?.default.url],
          },
        ],
      });

      return { success: true, message: 'Appchain added and switched successfully' };
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('User rejected the request');
      }
      throw new Error(`Failed to add chain: ${error.message}`);
    }
  };

  const handleLogin = async () => {
    const result = await checkAndSwitchToAppchain();
    console.log(result);
    login();
  }

  // Don't render until we're on the client and Privy is ready
  if (!isClient || !ready) {
    return (
      <Button disabled className={className}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
      </Button>
    );
  }

  // Not authenticated - show login button
  if (!authenticated) {
    return (
      <Button
        onClick={handleLogin}
        className={`bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.15)] hover:shadow-[0_0_20px_rgba(59,130,246,0.25)] transition-all rounded-lg text-sm font-bold ${
          className || ''
        }`}
      >
        <Wallet className="mr-2 h-4 w-4" />
        Connect
      </Button>
    );
  }

  // Authenticated but needs wallet connection - only show sign out
  if (needsWalletConnection) {
    return (
      <Button
        onClick={logout}
        variant="outline"
        className={`text-sm font-bold rounded-lg bg-[#1A1A1A] border-white/20 hover:border-red-500/40 hover:bg-red-500/10 transition-all ${
          className || ''
        }`}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    );
  }

  // Fully authenticated - show profile
  if (isFullyAuthenticated && showFullProfile) {
    return (
      <div className="flex gap-2">
        {/* Authentication Method Indicator */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            className="text-sm font-bold rounded-xl bg-[#1A1A1A] border-white/20 hover:border-blue-500/40 hover:bg-[#121212] transition-all"
            disabled
          >
            {authenticationMethod === 'wallet' ? (
              <>
                <Wallet className="mr-2 h-4 w-4" />
                {walletAddress
                  ? `${String(walletAddress).slice(0, 6)}...${String(walletAddress).slice(
                      -4
                    )}`
                  : 'Wallet'}
              </>
            ) : authenticationMethod === 'google_oauth' ? (
              <>
                <Globe className="mr-2 h-4 w-4" />
                Google
              </>
            ) : authenticationMethod === 'email' ? (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Email
              </>
            ) : (
              <>
                <User className="mr-2 h-4 w-4" />
                {socialLoginMethod
                  ? String(socialLoginMethod).replace('_oauth', '').toUpperCase()
                  : 'Social'}
              </>
            )}
          </Button>
          {walletAddress && (
            <Button
              onClick={handleCopyAddress}
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 rounded-xl bg-[#1A1A1A] border-white/20 hover:border-blue-500/40 hover:bg-[#121212] transition-all"
              title="Copy address"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-400" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>

        {/* User Profile */}
        <Button
          variant="outline"
          className="text-sm font-bold rounded-xl bg-[#1A1A1A] border-white/20 hover:border-blue-500/40 hover:bg-[#121212] transition-all"
          disabled
        >
          {walletAddress && (
            <CustomAvatar address={walletAddress} ensImage={undefined} size={18} />
          )}
          <span className="mx-2">{String(displayName || 'Anonymous')}</span>
        </Button>

        {/* Sign Out Button */}
        <Button
          onClick={logout}
          variant="outline"
          className="text-sm font-bold rounded-xl bg-[#1A1A1A] border-white/20 hover:border-red-500/40 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    );
  }

  // Simple authenticated state
  return (
    <Button
      onClick={logout}
      variant="outline"
      className={`text-sm font-bold rounded-lg bg-[#1A1A1A] border-white/20 hover:border-red-500/40 hover:bg-red-500/10 transition-all ${
        className || ''
      }`}
    >
      <LogOut className="mr-2 h-4 w-4" />
      Sign Out
    </Button>
  );
}
