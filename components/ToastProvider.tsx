import React, { createContext, useCallback, useContext, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MotivationalToast, { MotivationalToastConfig } from './MotivationalToast';
import ToastMessage, { ToastConfig } from './ToastMessage';
import UnlockToast, { UnlockToastConfig } from './UnlockToast';

interface Toast extends ToastConfig {
  id: string;
  visible: boolean;
}

interface MotivationalToastState extends MotivationalToastConfig {
  id: string;
  visible: boolean;
}

interface UnlockToastState extends UnlockToastConfig {
  id: string;
  visible: boolean;
}

interface ToastContextType {
  showToast: (config: Omit<ToastConfig, 'id'>) => void;
  showMotivationalToast: (config: Omit<MotivationalToastConfig, 'id'>) => void;
  showUnlockToast: (config: Omit<UnlockToastConfig, 'id'>) => void;
  hideToast: (id: string) => void;
  hideAllToasts: () => void;
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
  maxToasts?: number;
}

export function ToastProvider({ children, maxToasts = 3 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [motivationalToast, setMotivationalToast] = useState<MotivationalToastState | null>(null);
  const [unlockToast, setUnlockToast] = useState<UnlockToastState | null>(null);

  const generateId = useCallback(() => {
    return Date.now().toString() + Math.random().toString(36).slice(2, 11);
  }, []);

  const showToast = useCallback((config: Omit<ToastConfig, 'id'>) => {
    // Don't show regular toasts while unlock toast is active
    if (unlockToast?.visible) return;

    const id = generateId();
    const newToast: Toast = {
      ...config,
      id,
      visible: true,
    };

    setToasts((prevToasts) => {
      const updatedToasts = [...prevToasts, newToast];
      // Remove oldest toasts if we exceed maxToasts
      if (updatedToasts.length > maxToasts) {
        return updatedToasts.slice(-maxToasts);
      }
      return updatedToasts;
    });
  }, [generateId, maxToasts, unlockToast]);

  const showMotivationalToast = useCallback((config: Omit<MotivationalToastConfig, 'id'>) => {
    // Don't show motivational toasts while unlock toast is active
    if (unlockToast?.visible) return;

    const id = generateId();
    setMotivationalToast({
      ...config,
      id,
      visible: true,
    });
  }, [generateId, unlockToast]);

  const hideMotivationalToast = useCallback(() => {
    setMotivationalToast((prev) => prev ? { ...prev, visible: false } : null);
  }, []);

  const removeMotivationalToast = useCallback(() => {
    setMotivationalToast(null);
  }, []);

  // Unlock toast - exclusive mode: clears all other toasts when shown
  const showUnlockToast = useCallback((config: Omit<UnlockToastConfig, 'id'>) => {
    // Clear all existing toasts first
    setToasts([]);
    setMotivationalToast(null);

    const id = generateId();
    setUnlockToast({
      ...config,
      id,
      visible: true,
    });
  }, [generateId]);

  const hideUnlockToast = useCallback(() => {
    setUnlockToast((prev) => prev ? { ...prev, visible: false } : null);
  }, []);

  const removeUnlockToast = useCallback(() => {
    setUnlockToast(null);
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prevToasts) =>
      prevToasts.map((toast) =>
        toast.id === id ? { ...toast, visible: false } : toast
      )
    );
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const hideAllToasts = useCallback(() => {
    setToasts((prevToasts) =>
      prevToasts.map((toast) => ({ ...toast, visible: false }))
    );
    hideMotivationalToast();
    hideUnlockToast();
  }, [hideMotivationalToast, hideUnlockToast]);

  const contextValue: ToastContextType = {
    showToast,
    showMotivationalToast,
    showUnlockToast,
    hideToast,
    hideAllToasts,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <View style={styles.toastContainer} pointerEvents="box-none">
        {toasts.map((toast) => (
          <ToastMessage
            key={toast.id}
            {...toast}
            onHide={() => removeToast(toast.id)}
            onDismiss={() => hideToast(toast.id)}
          />
        ))}
        {motivationalToast && (
          <MotivationalToast
            key={motivationalToast.id}
            {...motivationalToast}
            onHide={removeMotivationalToast}
            onDismiss={hideMotivationalToast}
          />
        )}
        {unlockToast && (
          <UnlockToast
            key={unlockToast.id}
            {...unlockToast}
            onHide={removeUnlockToast}
            onDismiss={hideUnlockToast}
          />
        )}
      </View>
    </ToastContext.Provider>
  );
}

// Helper functions for common toast types
export const showSuccessToast = (message: string, options?: Partial<ToastConfig>) => {
  // This will be used with the hookend
  return { message, type: 'success' as const, ...options };
};

export const showErrorToast = (message: string, options?: Partial<ToastConfig>) => {
  return { message, type: 'error' as const, ...options };
};

export const showWarningToast = (message: string, options?: Partial<ToastConfig>) => {
  return { message, type: 'warning' as const, ...options };
};

export const showInfoToast = (message: string, options?: Partial<ToastConfig>) => {
  return { message, type: 'info' as const, ...options };
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    pointerEvents: 'box-none', // Allow touches to pass through
  },
});