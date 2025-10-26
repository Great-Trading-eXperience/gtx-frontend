'use client';

import type React from 'react';
import { useRef, useState, useEffect } from 'react';
import { MeshGradient } from '@paper-design/shaders-react';

interface HeroShaderBackgroundProps {
  children: React.ReactNode;
  variant?: 'aurora' | 'neon' | 'sunset' | 'ocean' | 'lava' | 'gtx';
}

const backgroundPresets: Record<string, string[]> = {
  aurora: ['#0f2027', '#203a43', '#2c5364', '#22d3ee', '#84fab0'],
  neon: ['#ff00ff', '#00ffff', '#0000ff', '#0b0f19'],
  sunset: ['#ff6f61', '#ff9966', '#ffcc33', '#663399'],
  ocean: ['#001f3f', '#0074D9', '#7FDBFF', '#0b0f19'],
  lava: ['#ff4500', '#ff6347', '#8b0000', '#2b0000'],
  // GTX custom theme - darker blues with purple accents
  gtx: ['#000814', '#001d3d', '#003566', '#0466c8', '#4361ee'],
};

export default function HeroShaderBackground({
  children,
  variant = 'gtx',
}: HeroShaderBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const colors = backgroundPresets[variant];

  // Client-side only rendering
  useEffect(() => {
    setIsClient(true);

    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const handleMouseEnter = () => setIsActive(true);
    const handleMouseLeave = () => setIsActive(false);

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mouseenter', handleMouseEnter);
      container.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (container) {
        container.removeEventListener('mouseenter', handleMouseEnter);
        container.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  // Fallback for SSR or reduced motion
  if (!isClient || prefersReducedMotion) {
    return (
      <div
        ref={containerRef}
        className="relative overflow-hidden"
      >
        {/* Static gradient fallback */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#000814] via-[#001d3d] to-[#003566] opacity-50" />
        {children}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
    >
      {/* SVG Filters */}
      <svg className="absolute inset-0 w-0 h-0 pointer-events-none">
        <defs>
          <filter id="glass-effect" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence baseFrequency="0.005" numOctaves="1" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.3" />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0.02
                      0 1 0 0 0.02
                      0 0 1 0 0.05
                      0 0 0 0.9 0"
              result="tint"
            />
          </filter>

          <filter id="gooey-filter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 19 -9"
              result="gooey"
            />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Main Background - speeds up on hover */}
      <MeshGradient
        className="absolute inset-0 w-full h-full opacity-60"
        colors={colors}
        speed={isActive ? 0.5 : 0.25}
      />

      {/* Secondary slower layer for depth */}
      <MeshGradient
        className="absolute inset-0 w-full h-full opacity-30"
        colors={colors.slice(0, 3)}
        speed={0.15}
      />

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}