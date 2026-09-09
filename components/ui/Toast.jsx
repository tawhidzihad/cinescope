'use client';

// ==========================================================================
// Toast — accessible, non-blocking notification (migrated from toast.js)
// ==========================================================================

import { useEffect, useState, useCallback, useRef, createContext, useContext } from 'react';

const ToastContext = createContext(() => { });

export function useToast() {
    return useContext(ToastContext);
}

export function ToastProvider({ children }) {
    const [toast, setToast] = useState(null);
    const timerRef = useRef();

    const show = useCallback(({ message, type = 'info', duration = 4000 }) => {
        clearTimeout(timerRef.current);
        setToast({ message, type, id: Date.now() });
        timerRef.current = setTimeout(() => setToast(null), duration);
    }, []);

    useEffect(() => () => clearTimeout(timerRef.current), []);

    return (
        <ToastContext.Provider value={show}>
            {children}
            {toast && (
                <div className="toast-container" aria-live="polite" aria-atomic="true">
                    <div className={`toast toast-${toast.type}`} role="status" key={toast.id}>
                        <div className="toast-icon" aria-hidden="true">
                            {toast.type === 'success' ? (
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
                                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                            ) : toast.type === 'error' ? (
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
                                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="15" y1="9" x2="9" y2="15" />
                                    <line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
                                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                            )}
                        </div>
                        <div className="toast-message">{toast.message}</div>
                        <button
                            type="button"
                            className="toast-close"
                            aria-label="Dismiss notification"
                            onClick={() => setToast(null)}
                        >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
                                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </ToastContext.Provider>
    );
}
