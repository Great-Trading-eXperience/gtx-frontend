import { useEffect, useState } from 'react';

let scriptLoadingPromise: Promise<void> | null = null;
let isScriptLoaded = false;

export function useTradingViewScript() {
  const [isLoaded, setIsLoaded] = useState(isScriptLoaded);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (isScriptLoaded) {
      setIsLoaded(true);
      return;
    }

    if (document.getElementById('tradingview-script')) {
      isScriptLoaded = true;
      setIsLoaded(true);
      return;
    }

    if (!scriptLoadingPromise) {
      scriptLoadingPromise = new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.id = 'tradingview-script';
        script.src = '/charting_library/charting_library.standalone.js';
        script.async = true;

        script.onload = () => {
          isScriptLoaded = true;
          resolve();
        };

        script.onerror = () => {
          const err = new Error('Failed to load TradingView library');
          reject(err);
        };

        document.head.appendChild(script);
      });
    }

    scriptLoadingPromise.then(() => setIsLoaded(true)).catch(err => setError(err));
  }, []);

  return { isLoaded, loadError: error };
}
