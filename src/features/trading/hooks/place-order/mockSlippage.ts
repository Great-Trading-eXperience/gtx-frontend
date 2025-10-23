// Mock orderbook data based on the image
const MOCK_ORDERBOOK = {
  asks: [
    // Sell orders (red) - prices in USDC
    { price: 3830.0, size: 1.449947, total: 2.040097 },
    { price: 3820.0, size: 0.027414, total: 0.59015 },
    { price: 3800.0, size: 0.562736, total: 0.562736 },
  ],
  bids: [
    // Buy orders (green) - prices in USDC
    { price: 3800.0, size: 0.7578, total: 0.7578 },
    { price: 3790.0, size: 0.1102, total: 0.868 },
    { price: 3780.0, size: 0.1374, total: 1.0054 },
    { price: 3750.0, size: 0.5, total: 1.5054 },
  ],
  midPrice: 3800.0, // Mid price between best bid and ask
};

export async function mockGetMarketOrderSlippageInfo(
  pool: any,
  quantity: bigint,
  side: number,
  slippageBps: number
): Promise<any> {
  await new Promise(resolve => setTimeout(resolve, 300));

  const USDC_DECIMALS = 6;
  const TOKEN_DECIMALS = 18;

  let conservativeMinOut: bigint;
  let avgPrice: number;

  if (side === 0) {
    // BUY: USDC (6 decimals) -> Token (18 decimals)
    // Use ask prices (buying from sellers)
    avgPrice = MOCK_ORDERBOOK.asks[0].price; // Use best ask for simplicity

    // Convert quantity from USDC (6 decimals) to readable format
    const usdcAmount = Number(quantity) / Math.pow(10, USDC_DECIMALS);

    // Calculate tokens received
    const tokensReceived = usdcAmount / avgPrice;

    // Convert to 18 decimals
    conservativeMinOut = BigInt(
      Math.floor(tokensReceived * Math.pow(10, TOKEN_DECIMALS))
    );
  } else {
    // SELL: Token (18 decimals) -> USDC (6 decimals)
    // Use bid prices (selling to buyers)
    avgPrice = MOCK_ORDERBOOK.bids[0].price; // Use best bid for simplicity

    // Convert quantity from Token (18 decimals) to readable format
    const tokenAmount = Number(quantity) / Math.pow(10, TOKEN_DECIMALS);

    // Calculate USDC received
    const usdcReceived = tokenAmount * avgPrice;

    // Convert to 6 decimals
    conservativeMinOut = BigInt(Math.floor(usdcReceived * Math.pow(10, USDC_DECIMALS)));
  }

  // Apply slippage (reduce output)
  const slippageMultiplier = 10000 - slippageBps;
  conservativeMinOut = (conservativeMinOut * BigInt(slippageMultiplier)) / 10000n;

  return {
    conservativeMinOut,
    expectedOut: conservativeMinOut,
    maxSlippage: BigInt(slippageBps),
    priceImpact: '0.5',
  };
}
