import React, { createContext, useCallback, useContext, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MotivationalToast, { MotivationalToastConfig } from './MotivationalToast';
import UnlockToast, { UnlockToastConfig } from './UnlockToast';

interface MotivationalToastState extends MotivationalToastConfig {
  id: string;
  visible: boolean;
}

interface UnlockToastState extends UnlockToastConfig {
  id: string;
  visible: boolean;
}

interface ToastContextType {
  showMotivationalToast: (config: Omit<MotivationalToastConfig, 'id'>) => void;
  showUnlockToast: (config: Omit<UnlockToastConfig, 'id'>) => void;
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
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [motivationalToast, setMotivationalToast] = useState<MotivationalToastState | null>(null);
  const [unlockToast, setUnlockToast] = useState<UnlockToastState | null>(null);

  const generateId = useCallback(() => {
    return Date.now().toString() + Math.random().toString(36).slice(2, 11);
  }, []);

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
    // Clear motivational toast first
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

  const hideAllToasts = useCallback(() => {
    hideMotivationalToast();
    hideUnlockToast();
  }, [hideMotivationalToast, hideUnlockToast]);

  const contextValue: ToastContextType = {
    showMotivationalToast,
    showUnlockToast,
    hideAllToasts,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <View style={styles.toastContainer} pointerEvents="box-none">
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