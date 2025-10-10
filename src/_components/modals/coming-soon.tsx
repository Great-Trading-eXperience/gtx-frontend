import Image from "next/image";

const ComingSoonModal = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center -mt-44 z-10">
      <div className="bg-slate-900/40 backdrop-blur-xl max-w-md w-full shadow-[0_0_30px_rgba(56,189,248,0.03)] border border-cyan-500/10 rounded-xl">
        <div className="p-12 text-center">
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 bg-cyan-500/10 blur-[24px] rounded-full"></div>
            <Image
              src="/logo/gtx.png"
              className="w-24 h-24 relative z-10"
              alt="GTX Logo"
              width={96}
              height={96}
            />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-4">
            Coming Soon
          </h2>
          <p className="text-cyan-100/80 mb-8">
            Faucet features are currently under development
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonModal;
