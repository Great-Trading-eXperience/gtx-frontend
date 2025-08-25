'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';

interface Toast {
  id: string;
  type: 'loading' | 'success' | 'error';
  message: string;
  duration?: number; // in milliseconds, optional for loading
}

interface ToastProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'loading' | 'info';
  duration?: number;
  txHash?: string;
}

interface ToastContextType {
  toasts: ToastProps[];
  showToast: (toast: Omit<ToastProps, 'id'>) => string;
  hideToast: (id: string) => void;
  updateToast: (id: string, updates: Partial<Omit<ToastProps, 'id'>>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const showToast = useCallback((toast: Omit<ToastProps, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastProps = {
      ...toast,
      id,
      // duration: toast.duration ?? (toast.type === 'loading' ? undefined : 4000),
    };

    setToasts(prev => [...prev, newToast]);

    // Auto remove toast after duration (except loading toasts)
    if (newToast.duration) {
      setTimeout(() => {
        hideToast(id);
      }, newToast.duration);
    }

    return id;
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const updateToast = useCallback((id: string, updates: Partial<Omit<ToastProps, 'id'>>) => {
    setToasts(prev =>
      prev.map(toast =>
        toast.id === id
          ? { ...toast, ...updates }
          : toast
      )
    );

    // If updating to non-loading toast, set auto-remove timer
    if (updates.type && updates.type !== 'loading') {
      const duration = updates.duration ?? 4000;
      setTimeout(() => {
        hideToast(id);
      }, duration);
    }
  }, [hideToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast, updateToast }}>
      {children}
    </ToastContext.Provider>
  );
};