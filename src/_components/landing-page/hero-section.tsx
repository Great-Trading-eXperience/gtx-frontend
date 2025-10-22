'use client';

import {
  Globe,
  Shield,
  Zap,
} from 'lucide-react';
import HeroShaderBackground from '../hero-shader-background';

export function HeroSection() {
  const features = [
    { icon: Zap, text: 'Earn While Trading' },
    { icon: Shield, text: 'Zero Slippage CLOB' },
    { icon: Globe, text: 'Crosschain Deposits' },
  ];

  return (
    <HeroShaderBackground variant="gtx">
      <section className="relative z-10 overflow-hidden min-h-screen flex items-center">
        {/* Additional decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="w-full px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
        {/* Centered hero content */}
        <div className="text-center max-w-5xl mx-auto">
          <div className="space-y-6 sm:space-y-8 animate-fade-in-up">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full border border-blue-500/30 bg-blue-900/20 text-blue-400 text-sm font-medium backdrop-blur-sm">
              Earn Yield While You Trade
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight text-[#dfdfdf]">
              Great Trading{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-600">
                Xperience
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-lg sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Your deposited assets earn staking rewards while you trade with synthetic tokens. Experience zero-slippage CLOB trading across any EVM chain without sacrificing yield.
            </p>

            {/* Feature badges */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-3 sm:pt-4">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-center gap-1.5 sm:gap-2 bg-[#0a0a0a] border border-blue-500/30 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-opacity-35"
                  >
                    <feature.icon className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
                    <span className="text-xs sm:text-sm text-gray-300">
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
          </div>
        </div>
        </div>
      </section>
    </HeroShaderBackground>
  );
}
