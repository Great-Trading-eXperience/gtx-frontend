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
    // { destination: "/perpetual/create-market", label: "Create Market" },
    { destination: "https://github.com/Great-Trading-eXperience", label: "Docs" }
  ];

  const solidColorConfig = {
    backgroundColor: "bg-transparent",
    hoverBackgroundColor: "hover:bg-slate-800/50",
    textColor: "text-white",
    mode: 'solid' as const
  };

  return (
    <header className="relative z-10 border-b border-white/10 backdrop-blur-lg bg-black/20 ">
      <nav className={cn(
        "flex flex-row py-3",
        pathname === "/" ? "md:flex-row md:justify-between md:items-center" : "",
        pathname === "/spot" || pathname === "/perpetual" ? "px-5 md:flex-row md:justify-between md:items-center" : "max-w-7xl mx-auto"
      )}>
        <div className={cn(
          "flex flex-row gap-4",
          pathname === "/" ? "w-64" : "w-full"
        )}>
          <Link href="/" className="flex flex-row items-center gap-2">
            <img
              src={"/logo/gtx-white.png"}
              className="h-9"
              alt="GTX Logo"
            />
            <p className="text-xl lg:text-2xl font-bold text-white text-center">
              GTX
            </p>
          </Link>

          {pathname !== "/" && (
            <div className="hidden md:flex items-center gap-4 ml-14">
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
          )}
        </div>

        {pathname === "/" && (
          <div className="hidden md:flex items-center justify-center flex-1 gap-4">
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
        )}

        <div className={cn(
          "flex justify-end",
          pathname === "/" ? "w-64" : "w-full"
        )}>
          {pathname !== "/" &&
            <ButtonConnectWallet
              colors={solidColorConfig}
              className="border border-slate-500"
            />
          }
        </div>

        <div className="flex gap-2 lg:hidden">
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
      </nav>
    </header>
  );
};

export default Header;