'use client';

import { Button } from '@/components/_components/ui/button';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { HeroSection } from './hero-section';

// Lazy load below-the-fold sections
const ProblemsSection = dynamic(() => import('./problem-section').then(mod => ({ default: mod.ProblemsSection })), {
  loading: () => <div className="py-20" />,
  ssr: false
});

const FeaturesSection = dynamic(() => import('./feature-section').then(mod => ({ default: mod.FeaturesSection })), {
  loading: () => <div className="py-20" />,
  ssr: false
});

const TradingStepsSection = dynamic(() => import('./trading-step-section').then(mod => ({ default: mod.TradingStepsSection })), {
  loading: () => <div className="py-20" />,
  ssr: false
});

const IntegrationsSection = dynamic(() => import('./integration-section').then(mod => ({ default: mod.IntegrationsSection })), {
  loading: () => <div className="py-20" />,
  ssr: false
});

const TechnologySection = dynamic(() => import('./technology-section').then(mod => ({ default: mod.TechnologySection })), {
  loading: () => <div className="py-20" />,
  ssr: false
});

const SyntheticTokenSection = dynamic(() => import('./synthetic-token-section').then(mod => ({ default: mod.SyntheticTokenSection })), {
  loading: () => <div className="py-20" />,
  ssr: false
});

export function LandingEspresso() {
  return (
    <main className="text-white min-h-screen overflow-x-hidden bg-black !p-0 !flex-none !justify-start !items-stretch">
      {/* Hero Section - Load immediately - No margin/padding */}
      <HeroSection />

      {/* Below-the-fold sections - Lazy loaded */}
      {/* <ProblemsSection /> */}

      <FeaturesSection />

      <SyntheticTokenSection />

      <TradingStepsSection />

      <IntegrationsSection />

      {/* <TechnologySection /> */}

      {/* CTA Section */}
      <section className="py-20 relative z-10">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-[#0a0a0a] border border-blue-900/30 rounded-xl p-12 shadow-md shadow-blue-900/20 relative overflow-hidden">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-900/20 via-purple-900/10 to-blue-900/20 opacity-50" />
            <div className="relative z-10 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to{' '}
                <span className="text-transparent bg-clip-text bg-gray-200">
                  Supercharge Your Capital
                </span>
                ?
              </h2>
              <p className="text-xl text-gray-200 mb-8">
                Make every dollar work harder. Your assets generate returns 24/7 while you capture market opportunities.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/markets" target="_blank">
                  <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-6 text-lg font-medium rounded-xl relative overflow-hidden group">
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-400/0 via-blue-400/30 to-blue-400/0 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-full transition-all duration-1000 ease-out"></span>
                    <div className="flex items-center gap-2 relative z-10">
                      Launch App
                      <ExternalLink size={20} />
                    </div>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
