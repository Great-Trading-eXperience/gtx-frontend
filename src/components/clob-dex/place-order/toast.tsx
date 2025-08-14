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
        <div className="w-[48px] h-[48px] bg-transparent rounded-b-lg text-gray-900 dark:text-white flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-transparent animate-pulse"></div>

          <div className="absolute w-10 h-10 border-2 border-transparent border-t-blue-400 border-r-cyan-400 rounded-full animate-spin opacity-30"></div>
          <div
            className="absolute w-8 h-8 border border-transparent border-b-blue-300 border-l-cyan-300 rounded-full animate-spin opacity-20"
            style={{ animationDirection: 'reverse', animationDuration: '3s' }}
          ></div>

          <div className="relative z-10 flex flex-col items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-full opacity-30 animate-pulse scale-110"></div>

              <img src="/logo/gtx.png" className="h-6 w-6" alt="GTX Logo" />
              <div className="relative animate-bounce"></div>
            </div>
          </div>

          <style jsx>{`
            @keyframes logoFloat {
              0%,
              100% {
                transform: translateY(0px) scale(1);
              }
              50% {
                transform: translateY(-10px) scale(1.05);
              }
            }

            @keyframes progressBar {
              0% {
                width: 0%;
              }
              50% {
                width: 70%;
              }
              100% {
                width: 100%;
              }
            }

            .animate-spin {
              animation: spin 2s linear infinite;
            }

            @keyframes spin {
              from {
                transform: rotate(0deg);
              }
              to {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </div>
      );
    }

    const iconProps = { className: 'w-10 h-10' };
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
      return <AlertCircle {...iconProps} className={`${iconProps.className} text-blue-500`} />;
    }
  };

  console.log(type);

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
                href={`https://explorer.monad.xyz/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-xs underline"
              >
                View transaction
              </a>
            </div>
          )}

          {loading && (
            <div className="mt-2 w-full bg-gray-700 rounded-full h-1">
              <div className="bg-blue-500 h-1 rounded-full animate-pulse w-1/3"></div>
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
