'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { FiAlertCircle, FiCheckCircle, FiInfo, FiX } from 'react-icons/fi';
import { getErrorMessage } from '@/lib/errors';

type ToastKind = 'error' | 'success' | 'warning';
type ToastMessage = { id: number; kind: ToastKind; message: string };
type ToastContextValue = { showToast: (message: string, kind?: ToastKind) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

function ToastItem({ toast, dismiss }: { toast: ToastMessage; dismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = window.setTimeout(() => dismiss(toast.id), toast.kind === 'error' ? 8000 : 5000);
    return () => window.clearTimeout(timer);
  }, [dismiss, toast.id, toast.kind]);

  const Icon = toast.kind === 'success' ? FiCheckCircle : toast.kind === 'warning' ? FiInfo : FiAlertCircle;

  return (
    <div className={`app-toast app-toast-${toast.kind}`} role={toast.kind === 'error' ? 'alert' : 'status'}>
      <Icon className="app-toast-icon" aria-hidden="true" />
      <p>{toast.message}</p>
      <button type="button" onClick={() => dismiss(toast.id)} aria-label="Dismiss notification">
        <FiX aria-hidden="true" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const nextId = useRef(0);

  const showToast = useCallback((message: string, kind: ToastKind = 'error') => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;
    nextId.current += 1;
    setToasts((current) => [...current, { id: nextId.current, kind, message: trimmedMessage }].slice(-4));
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  useEffect(() => {
    function handleUnhandledRejection(event: PromiseRejectionEvent) {
      showToast(getErrorMessage(event.reason, 'An unexpected request failed. Please try again.'));
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="app-toast-viewport" aria-live="polite" aria-relevant="additions text">
        {toasts.map((toast) => <ToastItem key={toast.id} toast={toast} dismiss={dismiss} />)}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider.');
  return context;
}
