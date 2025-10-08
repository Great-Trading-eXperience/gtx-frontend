/**
 * Determine the icon image path and background color for a token
 * @param tokenName The token symbol/name
 * @returns Icon information object
 */
export function getIconInfo(tokenName: string) {
  const name = tokenName.toLowerCase();
  const availableTokenImages = [
    "bitcoin",
    "btc",
    "wbtc",
    "doge",
    "eth",
    "weth",
    "floki",
    "link",
    "pepe",
    "shiba",
    "shib",
    "trump",
    "usdc",
    "usdt",
  ];

  // Determine which image file to use
  let tokenImageName = "";

  if (name.includes("btc") || name.includes("bitcoin")) {
    tokenImageName = "bitcoin";
  } else if (name.includes("doge")) {
    tokenImageName = "doge";
  } else if (name.includes("eth")) {
    tokenImageName = "eth";
  } else if (name.includes("floki")) {
    tokenImageName = "floki";
  } else if (name.includes("link")) {
    tokenImageName = "link";
  } else if (name.includes("pepe")) {
    tokenImageName = "pepe";
  } else if (name.includes("shib")) {
    tokenImageName = "shiba";
  } else if (name.includes("trump")) {
    tokenImageName = "trump";
  } else if (name.includes("usdc") || name.includes("usdt")) {
    tokenImageName = "usdc";
  }

  // Background colors for tokens - now all black
  const getBgColor = () => {
    return "#000000"; // All icons now have black background
  };

  // Determine if we need to use an image or the fallback Hexagon icon
  const hasTokenImage = availableTokenImages.some((token) =>
    name.includes(token)
  );

  return {
    hasImage: hasTokenImage,
    imagePath: hasTokenImage ? `/tokens/${tokenImageName}.png` : null,
    bg: getBgColor(),
  };
} 