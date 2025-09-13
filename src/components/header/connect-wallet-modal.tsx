import { Droplets, X } from 'lucide-react';
import { PrivyAuthButton } from '../auth/privy-auth-button';

const ConnectWalletModal = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="relative z-10 bg-slate-900/95 border border-white/20 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl max-w-md w-full">
        <div className="p-12 text-center">
          <div className="flex items-center justify-center mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-400/30 flex items-center justify-center">
              <Droplets className="w-10 h-10 text-blue-400" />
            </div>
          </div>

          <h2 className="text-white text-3xl font-bold tracking-tight mb-4">
            Connect Wallet
          </h2>
          
          <p className="text-white/70 mb-8 leading-relaxed">
            Connect your wallet to access the full features of GTX.
          </p>
          
          <PrivyAuthButton showFullProfile={false} />
        </div>
      </div>
    </div>
  );
};

export default ConnectWalletModal;