'use client';

import React from 'react';
import { X, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from './toastContext';

const ToastContainer: React.FC = () => {
  const { toasts, hideToast } = useToast();

  if (toasts.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return (
          <CheckCircle className={`w-4 h-4 text-green-500`} />
        );
      case 'error':
        return (
          <XCircle className={`w-4 h-4 text-red-500`} />
        );
      case 'loading':
        return (
          <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
        );
      default:
        return (
          <AlertCircle className={`w-4 h-4 text-gray-500`} />
        );
    }
  };

  const getBorderColor = (type: string): string => {
    switch (type) {
      case 'success':
        return 'border-l-green-500';
      case 'error':
        return 'border-l-red-500';
      case 'loading':
        return 'border-l-blue-500';
      default:
        return 'border-l-gray-500';
    }
  };

  return (
    <div className="fixed bottom-24 right-[36rem] z-50 max-w-sm w-full">
      {toasts.map(toast => (
        <div key={toast.id}>
          <div
            className={`bg-gray-900 border border-gray-700 ${getBorderColor(
              toast.type
            )} border-l-4 rounded-lg shadow-xl backdrop-blur-sm min-w-80 max-w-96 p-4 flex items-start gap-3`}
          >
            <div className="flex-shrink-0 mt-0.5">{getIcon(toast.type)}</div>

            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium">{toast.message}</div>
            </div>

            {toast.type !== 'loading' && (
              <button
                onClick={() => hideToast(toast.id)}
                className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
