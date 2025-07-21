import { Menu, Moon, Sun, Wallet } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/router";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { ButtonConnectWallet } from "../button-connect-wallet.tsx/button-connect-wallet";
import { PrivyAuthButton } from "../auth/privy-auth-button";
import { usePrivyAuth } from "@/hooks/use-privy-auth";

import { FEATURE_FLAGS, isTabEnabled } from "@/constants/features/features-config";

interface NavbarProps {
  onTogglePanel: () => void;
}

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
    {
      destination: "/spot",
      label: "Spot",
      enabled: isTabEnabled("SPOT")
    },
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

  return (
    <header className="relative z-10 border-b border-white/10 backdrop-blur-lg bg-black/20">
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
              <div>
                <div onClick={onTogglePanel} className="border border-gray-600 rounded-lg flex flex-row items-center justify-between w-40 px-2 py-1 font-medium text-gray-400 cursor-pointer hover:text-gray-200 hover:border-gray-500">
                  <Wallet className="w-6 h-6" /> 0.0000 USDC
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