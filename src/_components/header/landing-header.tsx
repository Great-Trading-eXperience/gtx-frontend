'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

// Types
interface NavLink {
  destination: string;
  label: string;
  isExternal?: boolean;
}

// Constants
const NAVIGATION_LINKS: NavLink[] = [
  { destination: '/markets', label: 'Launch App', isExternal: true },
];

const LOGO_CONFIG = {
  src: '/logo/gtx.png',
  alt: 'GTX Logo',
  text: 'GTX',
};

const SHIMMER_ANIMATION = {
  animate: { x: ['-100%', '100%'] },
  transition: { duration: 2, repeat: Infinity, ease: 'linear' as const },
};

// Subcomponents

const Logo = () => (
  <div className="flex-shrink-0 relative z-10">
    <Link href="/" className="flex items-center group">
      <div className="relative h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 lg:h-14 lg:w-14">
        <div className="absolute inset-0 bg-blue-500/20 rounded-[27px] lg:rounded-full blur-md" />
        <Image
          src={LOGO_CONFIG.src}
          alt={LOGO_CONFIG.alt}
          width={56}
          height={56}
          className="h-full w-full relative z-10"
          priority
        />
      </div>
      <div className="ml-2 sm:ml-3 md:ml-4 flex flex-col">
        <span className="text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-wide">
          {LOGO_CONFIG.text}
        </span>
      </div>
    </Link>
  </div>
);

const LaunchAppButton = ({ href }: { href: string }) => (
  <Link
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="group inline-flex items-center gap-2 px-4 sm:px-5 md:px-6 lg:px-8 py-2 md:py-3 bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-900 text-white text-sm sm:text-base md:text-lg font-medium rounded-[27px] lg:rounded-full border border-gray-300/40 relative overflow-hidden"
  >
    Launch App
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
      {...SHIMMER_ANIMATION}
    />
    <div className="flex items-center gap-2 relative z-10">
      <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
    </div>
  </Link>
);

interface RegularNavLinkProps {
  href: string;
  label: string;
  isActive: boolean;
}

const RegularNavLink = ({ href, label, isActive }: RegularNavLinkProps) => (
  <Link
    href={href}
    className={`relative text-sm sm:text-base md:text-lg font-medium transition-colors group ${
      isActive ? 'text-white' : 'text-gray-200 hover:text-white'
    }`}
  >
    {label}
    <span
      className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-300 ${
        isActive ? 'w-full' : 'w-0 group-hover:w-full'
      }`}
    />
  </Link>
);

const Navigation = () => {
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-center space-x-4 sm:space-x-6 md:space-x-8 lg:space-x-10 relative z-10">
      {NAVIGATION_LINKS.map((link) => {
        const isActive = pathname === link.destination;

        if (link.isExternal) {
          return <LaunchAppButton key={link.label} href={link.destination} />;
        }

        return (
          <RegularNavLink
            key={link.label}
            href={link.destination}
            label={link.label}
            isActive={isActive}
          />
        );
      })}
    </nav>
  );
};

const LandingHeader = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 pt-3 sm:pt-4 md:pt-5 px-4 sm:px-6 md:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="relative flex items-center justify-between rounded-[27px] lg:rounded-full border border-blue-500/20 bg-black/40 backdrop-blur-md px-3 sm:px-4 md:px-6 py-2 shadow-lg shadow-blue-900/10 overflow-hidden">
          {/* Subtle gradient overlay that matches hero shader colors */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#000814]/80 via-[#001d3d]/60 to-[#003566]/80 opacity-50 pointer-events-none" />

          <Logo />
          <Navigation />
        </div>
      </div>
    </header>
  );
};

export default LandingHeader;
