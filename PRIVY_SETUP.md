# Privy Authentication Setup

This project now supports social authentication using Privy alongside traditional wallet connections.

## Features

- 🔐 Social login with Google, Twitter, Discord, GitHub, and Email
- 💳 Traditional wallet connection (MetaMask, WalletConnect, etc.)
- 🔗 Link multiple accounts to one profile
- 🎨 Unified authentication experience
- 📱 Mobile-friendly authentication flow

## Setup Instructions

### 1. Create a Privy Account

1. Go to [Privy Dashboard](https://dashboard.privy.io)
2. Create a new account or sign in
3. Create a new app for your project

### 2. Configure Environment Variables

Update your `.env` file with your Privy App ID:

```env
NEXT_PUBLIC_PRIVY_APP_ID=your-actual-privy-app-id-here
```

### 3. Configure OAuth Providers

In your Privy Dashboard, configure the OAuth providers you want to support:

#### Google OAuth Setup:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API and Google OAuth2 API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Set Application type to "Web application"
6. Add Authorized redirect URIs:
   - `https://auth.privy.io/api/v1/oauth/google/callback`
7. Copy Client ID and Client Secret
8. In Privy Dashboard → Settings → Login Methods → Google:
   - Enable Google OAuth
   - Enter your Google Client ID and Client Secret

#### Other Providers:
- **Twitter**: Set up Twitter OAuth credentials
- **Discord**: Set up Discord OAuth credentials
- **GitHub**: Set up GitHub OAuth credentials
- **Email**: Enable email authentication

### 4. Update Allowed Domains

In your Privy Dashboard, add your domains:
- `http://localhost:3000` (for development)
- Your production domain

## Usage

### Basic Authentication

The project includes several authentication components:

1. **PrivyAuthButton**: A complete authentication button with social login
2. **AuthWrapper**: A wrapper component that handles authentication flow
3. **WalletWrapper**: Enhanced to support both Privy and traditional wallet auth

### Using in Components

```tsx
// Use Privy authentication in WalletWrapper
<WalletWrapper usePrivyAuth={true}>
  <YourProtectedComponent />
</WalletWrapper>

// Or use the AuthWrapper directly
<AuthWrapper requireWallet={true}>
  <YourProtectedComponent />
</AuthWrapper>
```

### Using the Hook

```tsx
import { usePrivyAuth } from '@/hooks/use-privy-auth'

function MyComponent() {
  const {
    authenticated,
    user,
    login,
    logout,
    hasWallet,
    walletAddress,
    hasSocialLogin,
    displayName
  } = usePrivyAuth()

  if (!authenticated) {
    return <button onClick={login}>Sign In</button>
  }

  return (
    <div>
      <p>Welcome, {displayName}!</p>
      {hasWallet && <p>Wallet: {walletAddress}</p>}
      <button onClick={logout}>Sign Out</button>
    </div>
  )
}
```

## Components

### PrivyAuthButton

A complete authentication button that handles:
- Social login flow
- Wallet connection
- User profile display
- Sign out functionality

### AuthWrapper

A wrapper component that:
- Shows authentication UI when not signed in
- Optionally requires wallet connection
- Provides fallback to traditional wallet auth
- Handles loading states

### WalletWrapper

Enhanced version that supports:
- Traditional wallet authentication (default)
- Privy authentication (when `usePrivyAuth={true}`)
- Unified authentication experience

## Authentication Flow

1. User clicks "Sign In" button
2. Privy modal opens with social login options
3. User chooses authentication method:
   - Social login (Google, Twitter, etc.)
   - Email
   - Wallet connection
4. User is authenticated and can optionally link additional accounts
5. User can switch between connected accounts

## Customization

### Styling

The authentication components use Tailwind CSS and follow the existing design system. You can customize:

- Colors in `privy-provider.tsx`
- Button styles in `privy-auth-button.tsx`
- Layout in `auth-wrapper.tsx`

### Supported Chains

Configure supported chains in `privy-provider.tsx`:

```tsx
supportedChains: [arbitrumSepolia, mainnet, polygon],
```

### Login Methods

Configure available login methods in `privy-provider.tsx`:

```tsx
loginMethods: ['email', 'google', 'twitter', 'discord', 'github', 'wallet'],
```

## Migration Guide

### From Traditional Wallet Auth

1. Replace `ButtonConnectWallet` with `PrivyAuthButton`
2. Replace `WalletWrapper` with `WalletWrapper usePrivyAuth={true}`
3. Update authentication state checks to use `usePrivyAuth` hook

### Gradual Migration

You can run both authentication methods side by side:
- Keep existing wallet authentication
- Add Privy authentication as an option
- Let users choose their preferred method

## Troubleshooting

### Common Issues

1. **"Invalid App ID"**: Make sure `NEXT_PUBLIC_PRIVY_APP_ID` is set correctly
2. **OAuth errors**: Check OAuth provider configuration in Privy dashboard
3. **Domain errors**: Ensure your domain is added to allowed domains in Privy
4. **Wallet connection issues**: Make sure wallet connectors are properly configured

### Debug Mode

Enable debug mode by setting:
```env
NEXT_PUBLIC_DEBUG=true
```

## Security Considerations

- Never expose your Privy App Secret in frontend code
- Use environment variables for all sensitive configuration
- Regularly review connected accounts and permissions
- Enable 2FA for your Privy dashboard account

## Support

- [Privy Documentation](https://docs.privy.io)
- [Privy Discord Community](https://discord.gg/privy)
- [GitHub Issues](https://github.com/privy-io/privy-react-auth/issues)