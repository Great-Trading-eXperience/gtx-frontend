'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useEffect } from 'react';

export function usePrivyAuth() {
  const {
    ready,
    authenticated,
    user,
    login,
    logout,
    linkWallet,
    unlinkWallet,
    connectWallet,
    exportWallet,
  } = usePrivy();
  
  const { wallets } = useWallets();

  // Helper function to check if user has a wallet connected
  const hasWallet = user?.linkedAccounts?.some(account => account.type === 'wallet') || false;

  // Helper function to get the primary wallet address
  const walletAddress = user?.linkedAccounts?.find(account => account.type === 'wallet')?.address || undefined;
  
  // Get the first wallet (Privy embedded wallet)
  const embeddedWallet = wallets[0];

  // Helper function to check if user is authenticated with social login
  const hasSocialLogin = user?.linkedAccounts?.some(account => 
    ['google_oauth', 'twitter_oauth', 'discord_oauth', 'github_oauth', 'email'].includes(account.type)
  ) || false;

  // Helper function to get social login method
  const socialLoginMethod = user?.linkedAccounts?.find(account => 
    ['google_oauth', 'twitter_oauth', 'discord_oauth', 'github_oauth', 'email'].includes(account.type)
  )?.type || undefined;

  // Helper function to get user's display name
  const displayName = String(
    user?.linkedAccounts?.find(account => account.type === 'email')?.address ||
    user?.linkedAccounts?.find(account => account.type === 'google_oauth')?.name ||
    user?.linkedAccounts?.find(account => account.type === 'twitter_oauth')?.username ||
    user?.linkedAccounts?.find(account => account.type === 'discord_oauth')?.username ||
    user?.linkedAccounts?.find(account => account.type === 'github_oauth')?.username ||
    'Anonymous'
  );

  return {
    // Core Privy methods
    ready,
    authenticated,
    login,
    logout,
    linkWallet,
    unlinkWallet,
    connectWallet,
    exportWallet,
    
    // Helper properties
    hasWallet,
    walletAddress,
    hasSocialLogin,
    socialLoginMethod,
    displayName,
    embeddedWallet,
    
    // Computed states
    isFullyAuthenticated: authenticated && (hasWallet || hasSocialLogin),
    needsWalletConnection: authenticated && !hasWallet,
    authenticationMethod: hasWallet ? 'wallet' : socialLoginMethod || 'none',
  };
}