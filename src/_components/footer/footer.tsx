'use client';

import { Twitter } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// Types
interface FooterLink {
  label: string;
  destination: string;
}

interface SocialLink {
  label: string;
  url: string;
  icon: React.ElementType;
}

// Constants
const LOGO_CONFIG = {
  src: '/logo/gtx.png',
  alt: 'GTX Logo',
  text: 'GTX',
  tagline: 'Trade across any EVM chain without moving your funds.',
};

const RESOURCES_LINKS: FooterLink[] = [
  { label: 'Privacy Policy', destination: '/privacy-policy' },
];

const SUPPORT_LINKS: FooterLink[] = [
  { label: 'GTX Docs', destination: '/docs' },
  { label: 'API Documentation', destination: '/api-docs' },
  { label: 'Terms & Conditions', destination: '/terms' },
];

const SOCIAL_LINKS: SocialLink[] = [
  { label: 'Twitter', url: 'https://x.com/gtx_dex', icon: Twitter },
];

const CURRENT_YEAR = new Date().getFullYear();

// Subcomponents
const FooterLogo = () => (
  <div className="col-span-1 md:col-span-2">
    <Link href="/" className="flex items-center gap-2">
      <Image src={LOGO_CONFIG.src} alt={LOGO_CONFIG.alt} width={40} height={40} className="h-10 w-10" />
      <span className="text-3xl font-bold text-white">{LOGO_CONFIG.text}</span>
    </Link>
    <p className="mt-4 text-gray-400 text-sm leading-relaxed">{LOGO_CONFIG.tagline}</p>
    <div className="mt-5">
      <p className="text-gray-400 text-sm">© {CURRENT_YEAR} Great Trading eXperience</p>
    </div>
  </div>
);

interface FooterLinksSectionProps {
  title: string;
  links: FooterLink[];
}

const FooterLinksSection = ({ title, links }: FooterLinksSectionProps) => (
  <div className="col-span-1">
    <h2 className="text-white font-semibold mb-4 text-lg">{title}</h2>
    <ul className="space-y-3">
      {links.map((link) => (
        <li key={link.destination}>
          <Link
            href={link.destination}
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <div className="w-1 h-1 rounded-full bg-white/60" />
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

const SocialLinksSection = () => (
  <div className="col-span-1">
    <h2 className="text-white font-semibold mb-4 text-lg">Community</h2>
    <div className="flex flex-col space-y-4">
      {SOCIAL_LINKS.map((social) => {
        const Icon = social.icon;
        return (
          <a
            key={social.url}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <div className="bg-white/10 p-2 rounded-md">
              <Icon size={18} />
            </div>
            <span>{social.label}</span>
          </a>
        );
      })}
    </div>
  </div>
);

const Footer = () => {
  return (
    <footer className="text-gray-300 relative overflow-hidden bg-[#0A0A0A]">
      {/* Background overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-white/10 opacity-30" />
      <div className="absolute inset-0 bg-[url('/blockchain-bg.svg')] bg-repeat opacity-5" />

      <div className="max-w-screen-xl mx-auto px-6 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
          <FooterLogo />
          <FooterLinksSection title="Resources" links={RESOURCES_LINKS} />
          <FooterLinksSection title="Support" links={SUPPORT_LINKS} />
          <SocialLinksSection />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
