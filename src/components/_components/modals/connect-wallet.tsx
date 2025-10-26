import { PrivyAuthButton } from '@/components/connect-button/privy-auth-button';
import Image from 'next/image';

const ConnectWalletModal = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="bg-black border border-white/20 rounded-xl shadow-[0_0_25px_rgba(255,255,255,0.07)] backdrop-blur-sm max-w-md w-full">
        <div className="p-12 text-center">
          <div className="flex items-center justify-center mb-8">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-cyan-500/10 blur-[24px] rounded-full"></div>
              <Image
                src="/logo/gtx.png"
                className="w-24 h-24 relative z-10"
                alt="GTX Logo"
                width={96}
                height={96}
              />
            </div>
          </div>
          <h2 className="text-white text-3xl font-bold tracking-tight mb-4">
            Connect Wallet
          </h2>
          <p className="text-white/70 mb-8">
            Connect your wallet to access the full features of GTX.
          </p>
          <PrivyAuthButton showFullProfile={false} />
        </div>
      </div>
    </div>
  );
};

export default ConnectWalletModal;
