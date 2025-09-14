import { usePrivyAuth } from "@/hooks/use-privy-auth";
import { cn } from "@/lib/utils";
import { useWallets } from "@privy-io/react-auth";
import { Wallet } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { PrivyAuthButton } from "../../auth/privy-buttons/privy-auth-button";
import { isTabEnabled } from "@/constants/features/features-config";
import ChainDropdown from "../shared/chain-dropdown";
import MobileMenu from "../shared/mobile-menu";

interface NavbarProps {
  onTogglePanel: () => void;
}


const Header = ({onTogglePanel}: NavbarProps) => {
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

  const { wallets } = useWallets();

  const embeddedWallet = wallets.find(wallet => wallet.walletClientType === 'privy');
  const embeddedWalletAddress = embeddedWallet?.address || 'Not Created';
  
  // Helper function to truncate wallet address
  const truncateAddress = (address: string): string => {
    if (address === 'Not Created') return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
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
                <div onClick={onTogglePanel} className="border border-white/20 rounded-lg flex flex-row items-center justify-center gap-2 px-2 py-1.5 text-white cursor-pointer">
                  <Wallet className="w-6 h-6" /> 
                  <span>{truncateAddress(embeddedWalletAddress)}</span>
                </div>
              </div>
            ) : (
              <PrivyAuthButton />
            )}
          </div>

          {/* Mobile Menu */}
          <MobileMenu links={links} />
        </div>
      </nav>
    </header>
  );
};

export default Header;
