export interface MarketData {
  id: string;
  name: string;
  pair: string;
  starred: boolean;
  iconInfo: {
    hasImage: boolean;
    imagePath: string | null;
    bg: string;
  };
  age: string;
  timestamp: number;
  price: string;
  volume: string;
  liquidity: string;
} 