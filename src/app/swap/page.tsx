import SwapForm from '@/features/swap/components/swap';

// Force dynamic rendering to prevent SSG issues with Privy
export const dynamic = 'force-dynamic';

const Swap = () => {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden z-50">
      <SwapForm />
    </div>
  );
};

export default Swap;
