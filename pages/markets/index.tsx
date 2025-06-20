import MarketList from "@/components/markets/markets";
import { DEFAULT_CHAIN } from "@/constants/contract/contract-address";
import { fetchAndProcessMarketData, MarketData } from "@/lib/market-data";
import Image from "next/image";
import { useEffect, useState } from "react";

interface MarketsProps {
  initialMarketData: MarketData[];
}

export async function getStaticProps() {
  try {
    const marketData = await fetchAndProcessMarketData(Number(DEFAULT_CHAIN));
    
    return {
      props: {
        initialMarketData: marketData,
      },
      revalidate: 30,
    };
  } catch (error) {
    return {
      props: {
        initialMarketData: [],
      },
      revalidate: 30,
    };
  }
}

const Markets = ({ initialMarketData }: MarketsProps) => {
  console.log('initialMarketData', initialMarketData)

  const [mounted, setMounted] = useState(false);
  const [isComingSoon, setIsComingSoon] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsComingSoon(process.env.NEXT_PUBLIC_COMING_SOON_MARKETS === "true");
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden z-50">
      <div className="relative">
        <div className={isComingSoon ? "blur-sm" : ""}>
          <MarketList initialMarketData={initialMarketData} />
        </div>

        {isComingSoon && (
          <div className="h-screen absolute inset-0 flex items-center justify-center -mt-44 z-10">
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
                  Markets features are currently under development
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Markets;
