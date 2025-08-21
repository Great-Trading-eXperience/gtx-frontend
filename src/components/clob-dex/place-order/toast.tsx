import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import GTXLoadingAnimation from '../chart/gtx-loading-animation';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  loading?: boolean;
  txHash?: string;
  onClose?: () => void;
}

const GTXToast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 4000,
  loading = false,
  txHash,
  onClose,
}) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!loading && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, loading]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  const getIcon = () => {
    if (loading) {
      return (
        <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
      );
    }

    const iconProps = { className: 'w-4 h-4' };
    switch (type) {
      case 'success':
        return (
          <CheckCircle
            {...iconProps}
            className={`${iconProps.className} text-green-500`}
          />
        );
      case 'error':
        return (
          <XCircle {...iconProps} className={`${iconProps.className} text-red-500`} />
        );
      case 'warning':
        return (
          <AlertCircle
            {...iconProps}
            className={`${iconProps.className} text-yellow-500`}
          />
        );
      default:
        return (
          <AlertCircle
            {...iconProps}
            className={`${iconProps.className} text-blue-500`}
          />
        );
    }
  };

  const getBorderColor = (): string => {
    if (loading) return 'border-l-blue-500';
    switch (type) {
      case 'success':
        return 'border-l-green-500';
      case 'error':
        return 'border-l-red-500';
      case 'warning':
        return 'border-l-yellow-500';
      default:
        return 'border-l-blue-500';
    }
  };

  return (
    <div
      className={`
      transform transition-all duration-300 ease-out
      ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
    `}
    >
      <div
        className={`
        bg-gray-900 border border-gray-700 ${getBorderColor()} border-l-4
        rounded-lg shadow-xl backdrop-blur-sm
        min-w-80 max-w-96 p-4
        flex items-start gap-3
      `}
      >
        <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>

        <div className="flex-1 min-w-0">
          <div className="text-white text-sm font-medium">{message}</div>

          {txHash && (
            <div className="mt-1">
              <a
                href={`https://explorer.testnet.riselabs.xyz/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-xs underline"
              >
                View transaction
              </a>
            </div>
          )}
        </div>

        <button
          onClick={handleClose}
          className="flex-shrink-0 text-gray-400 hover:text-white transition-colors p-1"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default GTXToast;
