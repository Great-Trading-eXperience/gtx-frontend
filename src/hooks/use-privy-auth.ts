'use client';

import { usePrivy } from '@privy-io/react-auth';
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

  // Helper function to check if user has a wallet connected
  const hasWallet = user?.linkedAccounts?.some(account => account.type === 'wallet') || false;

  // Helper function to get the primary wallet address
  const walletAddress = user?.linkedAccounts?.find(account => account.type === 'wallet')?.address;

  // Helper function to check if user is authenticated with social login
  const hasSocialLogin = user?.linkedAccounts?.some(account => 
    ['google_oauth', 'twitter_oauth', 'discord_oauth', 'github_oauth', 'email'].includes(account.type)
  ) || false;

  // Helper function to get social login method
  const socialLoginMethod = user?.linkedAccounts?.find(account => 
    ['google_oauth', 'twitter_oauth', 'discord_oauth', 'github_oauth', 'email'].includes(account.type)
  )?.type;

  // Helper function to get user's display name
  const displayName = user?.linkedAccounts?.find(account => account.type === 'email')?.address ||
                     user?.linkedAccounts?.find(account => account.type === 'google_oauth')?.name ||
                     user?.linkedAccounts?.find(account => account.type === 'twitter_oauth')?.username ||
                     user?.linkedAccounts?.find(account => account.type === 'discord_oauth')?.username ||
                     user?.linkedAccounts?.find(account => account.type === 'github_oauth')?.username ||
                     'Anonymous';

  return {
    // Core Privy methods
    ready,
    authenticated,
    user,
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
    
    // Computed states
    isFullyAuthenticated: authenticated && (hasWallet || hasSocialLogin),
    needsWalletConnection: authenticated && !hasWallet,
    authenticationMethod: hasWallet ? 'wallet' : socialLoginMethod || 'none',
  };
}