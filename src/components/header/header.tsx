import { Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { ButtonConnectWallet } from "../button-connect-wallet.tsx/button-connect-wallet";

const Header = () => {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  const links = [
    { destination: "/", label: "Home" },
    { destination: "/spot", label: "Spot" },
    { destination: "/perpetual", label: "Perpetual" },
    { destination: "/earn", label: "Earn" },
    { destination: "/faucet", label: "Faucet" },
    { destination: "/create", label: "Create" },
    { destination: "/swap", label: "Swap" },
    // { destination: "/perpetual/create-market", label: "Create Market" },
    { destination: "https://github.com/Great-Trading-eXperience", label: "Documentation" }
  ];

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
              src={"/logo/gtx-update.png"}
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
                "text-white"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Column */}
        <div className="flex justify-end items-center">
          <ButtonConnectWallet
            colors={solidColorConfig}
            className="border border-slate-500"
          />
          
          {/* Mobile Menu Button - Only Visible on Mobile */}
          <div className="flex ml-4 lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" className="text-[#0064A7] dark:text-gray-200">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-8 pt-4">
                    <h2 className="text-2xl font-bold">GTX</h2>
                  </div>
                  <div className="flex flex-col gap-4">
                    {links.map((link) => (
                      <Link key={link.label} href={link.destination}>
                        <Button
                          variant="ghost"
                          className="w-full justify-start font-medium whitespace-nowrap"
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