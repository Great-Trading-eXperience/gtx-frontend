export const convertPrice = (value: string | number, decimals: number): number => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return numValue / Math.pow(10, decimals);
};

export const normalizeSymbol = (symbol: string): string => symbol.replace('/', '');