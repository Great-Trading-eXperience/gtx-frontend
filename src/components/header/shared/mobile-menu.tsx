"use client"

import { cn } from "@/lib/utils";
import { Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "../../ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../../ui/sheet";

interface LinkItem {
  destination: string;
  label: string;
  enabled: boolean;
}

interface MobileMenuProps {
  links: LinkItem[];
  appName?: string;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ links, appName = "GTX" }) => {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = router.pathname;

  return (
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
              <h2 className="text-2xl font-bold">{appName}</h2>
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
  );
};

export default MobileMenu;