import GTXFaucet from '@/features/faucet/components/faucet';

const Faucet = () => {
  return (
    <div className="min-h-screen relative overflow-hidden z-50">
      <div className="min-h-screen bg-black relative overflow-hidden z-50">
        <GTXFaucet />
      </div>
    </div>
  );
};

export default Faucet;