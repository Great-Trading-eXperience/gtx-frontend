import MarketList from '@/components/markets/markets';
import { DEFAULT_CHAIN } from '@/constants/contract/contract-address';
import { fetchAndProcessMarketData, MarketData } from '@/lib/market-data';

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
  return (
    <div className="min-h-screen bg-black relative overflow-hidden z-50">
      <MarketList initialMarketData={initialMarketData} />
    </div>
  );
};

export default Markets;
