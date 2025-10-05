import { useEffect, useRef } from 'react';

export function useTradingViewSync(
  widget: any,
  symbol: string,
  interval: string,
  isReady: boolean
) {
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!widget || !isReady) return;

    // Debounce symbol changes
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      try {
        widget.setSymbol(symbol, interval, () => {
          console.log('Symbol changed to:', symbol);
        });
      } catch (error) {
        console.error('Error changing symbol:', error);
      }
    }, 300);

    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, [widget, symbol, interval, isReady]);
}
