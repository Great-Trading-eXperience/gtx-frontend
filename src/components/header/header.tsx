import { usePrivyAuth } from "@/hooks/use-privy-auth";
import { useTokenBalance } from "@/hooks/web3/gtx/clob-dex/embedded-wallet/useBalanceOf";
import { useAvailableTokens } from "@/hooks/web3/gtx/clob-dex/gtx-router/useAvailableTokens";
import { cn, formatNumber } from "@/lib/utils";
import { useWallets } from "@privy-io/react-auth";
import { Check, ChevronDown, Menu, Moon, Sun, Wallet } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/router";
import { PrivyAuthButton } from "../auth/privy-auth-button";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";

import { isTabEnabled } from "@/constants/features/features-config";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSwitchAndAddChain } from "@/hooks/useSwitchAndAddChain";
import { appchainTestnet, arbitrumSepolia, rariTestnet } from "@/configs/wagmi";
import { Chain } from 'viem/chains';
import { useChainId } from "wagmi";

interface NavbarProps {
  onTogglePanel: () => void;
}

const ChainDropdown: React.FC = () => {
  const networks: Chain[] = [
    appchainTestnet,
    arbitrumSepolia,
    rariTestnet
  ];

  const chainId = useChainId();
  const usedNetwork = networks.find(network => network.id === chainId);
  
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<Chain>(usedNetwork || networks[0]);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { switchAndAddChain } = useSwitchAndAddChain();

  const handleSwitchChain = async (selectedChain : Chain) => {
    try {
      const result = await switchAndAddChain(selectedChain);
      console.log(result.message);
    } catch (error) {
      // TypeScript knows 'error' is of type 'unknown', so we can check it
      if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error('An unknown error occurred.');
      }
    }

    setSelectedNetwork(selectedChain);
    setIsOpen(false);
  }

  const handleToggle = () => {
    if (buttonRef.current) {
      setButtonRect(buttonRef.current.getBoundingClientRect());
    }
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside or pressing escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        // Check if click is on dropdown
        const dropdownElement = document.getElementById('dropdown-portal');
        if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Update button position on scroll/resize
  useEffect(() => {
    const updatePosition = () => {
      if (buttonRef.current && isOpen) {
        setButtonRect(buttonRef.current.getBoundingClientRect());
      }
    };

    if (isOpen) {
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  const DropdownContent = () => {
    if (!buttonRect) return null;

    return (
      <div
        id="dropdown-portal"
        style={{
          position: 'fixed',
          top: buttonRect.bottom + 4,
          left: buttonRect.left,
          width: buttonRect.width,
          zIndex: 9999,
        }}
        className="bg-gray-800 border border-gray-600 rounded-lg shadow-xl"
      >
        <div className="py-1">
          {networks.map((network) => (
            <button
              key={network.id}
              onClick={() => handleSwitchChain(network)}
              className="w-full px-4 py-2 text-left hover:bg-gray-700 flex items-center justify-between group transition-colors duration-150 text-sm"
            >
              <span className="text-white font-medium">{network.name}</span>
              {selectedNetwork.id === network.id && (
                <Check className="w-4 h-4 text-green-400" />
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Main Button */}
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center justify-between transition-colors duration-200 min-w-[200px]"
      >
        <div className="flex items-center space-x-3">
          <span className="font-medium text-sm">{selectedNetwork.name}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ml-2 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {/* Portal Dropdown */}
      {isOpen && typeof window !== 'undefined' && createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={() => setIsOpen(false)}
          />
          <DropdownContent />
        </>,
        document.body
      )}
    </>
  );
};

const Header = ({onTogglePanel}: NavbarProps) => {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = router.pathname;
  const { ready, authenticated } = usePrivyAuth();

  const allLinks = [
    {
      destination: "/markets",
      label: "Markets",
      enabled: isTabEnabled("MARKETS")
    },
    {
      destination: "/swap",
      label: "Swap",
      enabled: isTabEnabled("SWAP")
    },
    // {
    //   destination: "/spot",
    //   label: "Spot",
    //   enabled: isTabEnabled("SPOT")
    // },
    {
      destination: "/perpetual",
      label: "Perpetual",
      enabled: isTabEnabled("PERPETUAL")
    },
    {
      destination: "/pool-creation",
      label: "Create",
      enabled: isTabEnabled("CREATE")
    },
    {
      destination: "/faucet",
      label: "Faucet",
      enabled: isTabEnabled("FAUCET")
    },
    {
      destination: "/earn",
      label: "Earn",
      enabled: isTabEnabled("EARN")
    },
    {
      destination: "/vegtx/dashboard",
      label: "veGTX",
      enabled: isTabEnabled("VEGTX")
    }
  ];

  // Filter only enabled links
  const links = allLinks.filter(link => link.enabled);

  const solidColorConfig = {
    backgroundColor: "bg-transparent",
    hoverBackgroundColor: "hover:bg-slate-800/50",
    textColor: "text-white",
    mode: 'solid' as const
  };

  const { wallets } = useWallets();

  const embeddedWallet = wallets.find(wallet => wallet.walletClientType === 'privy');
  const embeddedWalletAddress = embeddedWallet?.address || 'Not Created';
  
  // Helper function to truncate wallet address
  const truncateAddress = (address: string): string => {
    if (address === 'Not Created') return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Get available tokens from pools data
  const { tokens: availableTokens } = useAvailableTokens();
  
  // Find MUSDC token address dynamically
  const musdcToken = availableTokens.find(token => 
    token.symbol === 'MUSDC' || token.symbol === 'USDC'
  );
  const addressMUSDC = musdcToken?.address;

  const {
    formattedBalance: BalanceOfMUSDC,
    tokenSymbol: SymbolMUSDC,
    refetchBalance: refetchMUSDC,
  } = useTokenBalance(addressMUSDC, embeddedWalletAddress as `0x${string}`);

  return (
    <header className="relative z-5 border-b border-white/10 backdrop-blur-lg bg-black/20">
      <nav className="flex flex-row py-3 px-5 md:grid md:grid-cols-3 md:items-center">
        {/* Left Column */}
        <div className="flex flex-row gap-4 items-center">
          <Link href="/" className="flex flex-row items-center gap-2">
            <img
              src={"/logo/gtx.png"}
              className="h-9"
              alt="GTX Logo"
            />
            <p className="text-xl lg:text-2xl font-bold text-white text-center">
              GTX
            </p>
          </Link>
        </div>

        {/* Center Column */}
        <div className="hidden md:flex items-center justify-center gap-4">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.destination}
              className={cn(
                "text-sm lg:text-md px-4 py-1 rounded-lg transition-all whitespace-nowrap",
                "hover:bg-[#0064A7]/10 hover:text-[#0064A7]",
                "dark:hover:bg-white/10 dark:hover:text-white",
                "text-white",
                pathname === link.destination && "bg-[#0064A7]/10 text-[#0064A7] dark:bg-white/10 dark:text-white"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Column */}
        <div className="flex justify-end items-center">
          {/* Show authentication buttons - only Privy */}
          <div className="flex items-center gap-2">
            {ready && authenticated ? (
              <div className="flex flex-row items-center gap-2">
                <ChainDropdown />
                <div onClick={onTogglePanel} className="border border-gray-600 rounded-lg flex flex-row items-center justify-center gap-2 px-2 py-1 font-medium text-gray-400 cursor-pointer hover:text-gray-200 hover:border-gray-500">
                  <Wallet className="w-6 h-6" /> 
                  <span>{truncateAddress(embeddedWalletAddress)}</span>
                </div>
              </div>
            ) : (
              <PrivyAuthButton />
            )}
          </div>

          {/* Mobile Menu Button - Only Visible on Mobile */}
          <div className="flex ml-4 lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" className="text-white">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-8 pt-4">
                    <img
                      src={"/logo/gtx.png"}
                      className="h-8"
                      alt="GTX Logo"
                    />
                    <h2 className="text-2xl font-bold">GTX</h2>
                  </div>
                  <div className="flex flex-col gap-4">
                    {links.map((link) => (
                      <Link key={link.label} href={link.destination}>
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start font-medium whitespace-nowrap",
                            pathname === link.destination && "bg-[#0064A7]/10 text-[#0064A7] dark:bg-white/10 dark:text-white"
                          )}
                        >
                          {link.label}
                        </Button>
                      </Link>
                    ))}
                  </div>
                  <div className="mt-auto pt-4 border-t border-gray-200 dark:border-[#0064A7]">
                    <div className="flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                      >
                        {theme === "dark" ? <Sun /> : <Moon />}
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
