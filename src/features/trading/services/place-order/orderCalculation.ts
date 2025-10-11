import { formatUnits, parseUnits } from 'viem';

export class OrderCalculationService {
  static calculateLimitOrderTotal(
    price: string,
    quantity: string,
    quoteDecimals: number
  ): string {
    try {
      const priceValue = parseFloat(price);
      const quantityValue = parseFloat(quantity);

      if (isNaN(priceValue) || isNaN(quantityValue)) {
        return '0';
      }

      return (priceValue * quantityValue).toFixed(quoteDecimals);
    } catch {
      return '0';
    }
  }

  static calculateMarketOrderTotal(slippageInfo: any, side: number): string {
    try {
      if (!slippageInfo?.conservativeMinOut) {
        return '0';
      }

      const decimals = side === 0 ? 18 : 6;
      const minOut = formatUnits(slippageInfo.conservativeMinOut, decimals);

      return parseFloat(minOut).toFixed(decimals === 18 ? 6 : 2);
    } catch {
      return '0';
    }
  }

  static parseOrderQuantity(quantity: string, decimals: number): bigint {
    return parseUnits(quantity, decimals);
  }

  static formatOrderQuantity(quantity: bigint, decimals: number): string {
    return formatUnits(quantity, decimals);
  }
}
