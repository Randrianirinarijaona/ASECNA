import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '../../hooks';
import type { ToastVariant } from '../../types';
import './ToastStack.css';

const ICONS: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle size={16} />,
  error: <AlertCircle size={16} />,
  warning: <AlertTriangle size={16} />,
  info: <Info size={16} />,
};

export function ToastStack() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="toast-stack" role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.variant}`}>
          <span className="toast-icon">{ICONS[t.variant]}</span>
          <span className="toast-message">{t.message}</span>
          <button
            className="toast-dismiss"
            onClick={() => removeToast(t.id)}
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}