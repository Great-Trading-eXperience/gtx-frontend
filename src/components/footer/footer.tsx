'use client';

import { Twitter, Copy } from 'lucide-react';
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
  tagline: 'Trade across major EVM chains without moving your funds.',
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

const Footer = () => {
  return (
    <footer className="relative overflow-hidden bg-black text-white">
      {/* Main content */}
      <div className="relative z-10 max-w-screen-xl mx-auto px-6 py-16">
        {/* Top section - minimal like Flying Tulip */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-20">
          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <div className="space-y-2">
              <a 
                href="mailto:contact@gtx.com" 
                className="text-gray-400 hover:text-white transition-colors block"
              >
                info@gtxdex.xyz
              </a>
            </div>
          </div>

          {/* Social icons */}
          <div className="flex items-center gap-4">
            <a
              href="https://x.com/gtx_dex"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Twitter size={24} />
            </a>
          </div>
        </div>

        {/* Bottom section - copyright only */}
        <div className="border-t border-gray-800 pt-8 mb-8">
          <p className="text-gray-400 text-sm">
            © {CURRENT_YEAR} Great Trading Xperience. All rights reserved.
          </p>
        </div>

        {/* Large GTX text - positioned at the bottom */}
        <div className="flex justify-center -mb-8">
          <div className="text-[8rem] md:text-[12rem] lg:text-[16rem] xl:text-[20rem] font-bold text-gray-400/40 leading-none select-none tracking-wider">
            GTX
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
