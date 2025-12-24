import { useState, useEffect, useCallback } from 'react';

interface Toast {
    id: string;
    type: 'success' | 'error' | 'info' | 'sync';
    message: string;
    progress?: number;
}

let toastId = 0;

// Global toast state for external access
let addToastFn: ((toast: Omit<Toast, 'id'>) => string) | null = null;
let removeToastFn: ((id: string) => void) | null = null;
let updateToastFn: ((id: string, updates: Partial<Toast>) => void) | null = null;

// External API for adding toasts from anywhere
export function showToast(type: Toast['type'], message: string): string {
    if (addToastFn) {
        return addToastFn({ type, message });
    }
    return '';
}

export function hideToast(id: string): void {
    if (removeToastFn) {
        removeToastFn(id);
    }
}

export function updateToast(id: string, updates: Partial<Toast>): void {
    if (updateToastFn) {
        updateToastFn(id, updates);
    }
}

export default function ToastContainer() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, 'id'>): string => {
        const id = `toast-${++toastId}`;
        setToasts(prev => [...prev, { ...toast, id }]);

        // Auto-remove after 5s (unless it's a sync toast)
        if (toast.type !== 'sync') {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 5000);
        }

        return id;
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const updateToastState = useCallback((id: string, updates: Partial<Toast>) => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    }, []);

    // Register global functions
    useEffect(() => {
        addToastFn = addToast;
        removeToastFn = removeToast;
        updateToastFn = updateToastState;

        return () => {
            addToastFn = null;
            removeToastFn = null;
            updateToastFn = null;
        };
    }, [addToast, removeToast, updateToastState]);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-20 right-4 z-50 space-y-2 max-w-sm">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`
                        px-4 py-3 rounded-xl shadow-lg backdrop-blur-xl border
                        animate-in slide-in-from-right duration-300
                        ${toast.type === 'success' ? 'bg-green-500/20 border-green-500/30 text-green-400' : ''}
                        ${toast.type === 'error' ? 'bg-red-500/20 border-red-500/30 text-red-400' : ''}
                        ${toast.type === 'info' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : ''}
                        ${toast.type === 'sync' ? 'bg-sonexa-surface border-sonexa-border text-white' : ''}
                    `}
                >
                    <div className="flex items-center gap-3">
                        {/* Icon */}
                        {toast.type === 'success' && (
                            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                        {toast.type === 'error' && (
                            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                        {toast.type === 'info' && (
                            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                        {toast.type === 'sync' && (
                            <div className="w-5 h-5 border-2 border-sonexa-primary border-t-transparent rounded-full animate-spin" />
                        )}

                        {/* Message */}
                        <div className="flex-1">
                            <p className="text-sm font-medium">{toast.message}</p>
                            {toast.progress !== undefined && (
                                <div className="mt-2 h-1 bg-sonexa-border rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-sonexa-primary transition-all duration-300"
                                        style={{ width: `${toast.progress}%` }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Close button */}
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
