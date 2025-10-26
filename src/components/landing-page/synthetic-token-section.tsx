'use client';

import { motion } from 'motion/react';
import { ArrowDown } from 'lucide-react';

// Token Badge Component
const TokenBadge = ({ symbol, type, className = "", highlight = false }: { symbol: string; type: 'real' | 'synthetic'; className?: string; highlight?: boolean }) => {
  return (
    <div className={`px-4 py-3 rounded-lg border-2 text-center ${
      highlight 
        ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/25' 
        : type === 'real' 
          ? 'bg-gray-800 border-gray-600 text-white' 
          : 'bg-blue-900/40 border-blue-500 text-blue-300'
    } ${className}`}>
      <div className="text-xs opacity-80 mb-1">{type === 'real' ? 'Real Asset' : 'Synthetic Token'}</div>
      <div className="font-bold text-lg">{symbol}</div>
    </div>
  );
};

// Contract Box Component
const ContractBox = ({ name, className = "", highlight = false }: { name: string; className?: string; highlight?: boolean }) => {
  return (
    <div className={`px-4 py-3 rounded-lg border-2 text-center ${
      highlight 
        ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/25' 
        : 'bg-gray-800 border-gray-600 text-white'
    } ${className}`}>
      <div className="text-xs text-gray-300 mb-1">Smart Contract</div>
      <div className="font-bold text-sm">{name}</div>
    </div>
  );
};

export function SyntheticTokenSection() {
  return (
    <section className="py-20 relative z-10 overflow-hidden">
      <div className="max-w-screen-xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Trade While You{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
              Earn
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto">
            Our dual-token architecture separates earning from trading. Your real assets generate yield 
            while synthetic tokens enable seamless market access.
          </p>
        </div>

        {/* Architecture Diagram */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, amount: 0.2 }}
          className="max-w-5xl mx-auto"
        >
          <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-8 backdrop-blur-sm">
            {/* Complete Flow Diagram */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              
              {/* Part 1: Deposit */}
              <div className="flex flex-col items-center">
                <div className="text-center mb-6">
                  <div className="text-lg font-semibold text-white mb-4">Deposit</div>
                  <TokenBadge symbol="USDC" type="real" highlight={true} />
                </div>
                
                <ArrowDown className="text-blue-400 mb-4" size={24} />
                
                <ContractBox name="Balance Manager" highlight={true} className="mb-4" />
                
                {/* Split Flow */}
                <div className="flex justify-between w-full max-w-sm gap-6">
                  <div className="flex flex-col items-center">
                    <ArrowDown className="text-gray-400 mb-2" size={20} />
                    <TokenBadge symbol="USDC" type="real" className="mb-2" />
                    <ArrowDown className="text-gray-400 mb-2" size={16} />
                    <ContractBox name="Yield Manager" highlight={true} />
                    <div className="text-xs text-gray-300 mt-2 text-center">Earns Yield</div>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <ArrowDown className="text-blue-400 mb-2" size={20} />
                    <TokenBadge symbol="gsUSDC" type="synthetic" highlight={true} className="mb-2" />
                    <div className="text-xs text-blue-300 mt-2 text-center">For Trading</div>
                  </div>
                </div>
              </div>

              {/* Part 2: Trading & Earning */}
              <div className="flex flex-col items-center space-y-6">
                
                {/* Trading */}
                <div className="w-full">
                  <div className="text-lg font-semibold text-white mb-4 text-center">Trading</div>
                  
                  <div className="flex flex-col items-center p-4 bg-gray-800/50 border-2 border-blue-500 rounded-lg">
                    <TokenBadge symbol="gsUSDC" type="synthetic" className="mb-3" />
                    <ArrowDown className="text-blue-400 mb-2" size={20} />
                    <ContractBox name="Matching Engine" highlight={true} />
                    <div className="text-xs text-blue-300 mt-2">CLOB Trading</div>
                  </div>
                </div>

                {/* Earning */}
                <div className="w-full">
                  <div className="text-lg font-semibold text-white mb-4 text-center">Earning</div>
                  
                  <div className="flex flex-col items-center p-4 bg-gray-800/50 border-2 border-gray-500 rounded-lg">
                    <TokenBadge symbol="USDC" type="real" className="mb-3" />
                    <div className="text-xs text-gray-300 mb-2">Continuously</div>
                    <div className="px-4 py-2 rounded-lg bg-gray-700 border border-gray-500 text-center">
                      <div className="font-semibold text-white text-sm">Earning Yield</div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}