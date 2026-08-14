/**
 * @file Toast.tsx
 * @description Floating notification toast container providing immediate user feedback on mutations.
 * 
 * Key Responsibilities:
 * - Render success, error, and informational toast messages.
 * - Auto-dismiss after 3 seconds or on manual close.
 * 
 * Related Modules / Dependencies:
 * - lucide-react: Icons for checkmark, alert, info, and close
 * - ../types: ToastMessage interface
 */

import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import type { ToastMessage } from '../types/index';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => {
        const Icon =
          toast.type === 'success'
            ? CheckCircle2
            : toast.type === 'error'
            ? AlertCircle
            : Info;

        return (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <Icon size={16} />
            <span>{toast.message}</span>
            <button
              type="button"
              className="icon-btn"
              style={{ color: 'inherit', marginLeft: 'auto' }}
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss toast"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
