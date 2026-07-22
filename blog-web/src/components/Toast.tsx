import { X, CheckCircle, Info, AlertCircle } from 'lucide-react';
import type { ToastType } from '../context/ToastContext';
import './Toast.css';

interface ToastProps {
  toast: {
    id: string;
    message: string;
    type: ToastType;
  };
  onClose: () => void;
}

export default function Toast({ toast, onClose }: ToastProps) {
  const icons = {
    success: <CheckCircle size={20} className="toast-icon success" />,
    error: <AlertCircle size={20} className="toast-icon error" />,
    info: <Info size={20} className="toast-icon info" />
  };

  return (
    <div className={`toast-message glass slide-in-right type-${toast.type}`}>
      <div className="toast-content">
        {icons[toast.type]}
        <span>{toast.message}</span>
      </div>
      <button onClick={onClose} className="toast-close">
        <X size={16} />
      </button>
    </div>
  );
}
