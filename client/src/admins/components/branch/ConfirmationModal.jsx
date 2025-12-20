import React from 'react';
import { AlertCircle, Trash2, X } from 'lucide-react';

/**
 * Reusable Confirmation Modal Component
 * Replaces browser alert() and confirm() with custom styled modals
 * 
 * Props:
 * - isOpen: boolean - whether modal is visible
 * - onClose: function - called when modal is closed
 * - onConfirm: function - called when primary action is clicked
 * - title: string - modal title
 * - description: string - modal description/message
 * - confirmText: string - primary action button text (default: 'Confirm')
 * - cancelText: string - secondary action button text (default: 'Cancel')
 * - isDangerous: boolean - whether to style as destructive action (default: false)
 * - isLoading: boolean - whether action is loading (default: false)
 * - icon: ReactNode - custom icon (default: AlertCircle)
 * - size: 'sm' | 'md' | 'lg' - modal size (default: 'md')
 */
export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  description = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
  isLoading = false,
  icon: Icon = AlertCircle,
  size = 'md'
}) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg'
  };

  const buttonColorClasses = isDangerous
    ? {
        primary: 'bg-red-600 hover:bg-red-700 text-white',
        icon: 'text-red-600'
      }
    : {
        primary: 'bg-green-600 hover:bg-green-700 text-white',
        icon: 'text-green-600'
      };

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-200 backdrop-blur-sm"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={`bg-white rounded-xl shadow-2xl ${sizeClasses[size]} w-full transform transition-all duration-200 animate-in fade-in zoom-in-95`}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          aria-describedby="modal-description"
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-gray-100">
            <div className="flex items-start gap-4">
              <div className={`p-2.5 rounded-lg bg-opacity-10 ${isDangerous ? 'bg-red-600' : 'bg-green-600'}`}>
                <Icon className={`w-6 h-6 ${buttonColorClasses.icon}`} />
              </div>
              <div>
                <h2 id="modal-title" className="text-lg font-bold text-gray-900">
                  {title}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            <p id="modal-description" className="text-gray-600 leading-relaxed">
              {description}
            </p>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex gap-3 justify-end border-t border-gray-100">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className={`px-4 py-2.5 rounded-lg transition-all font-medium text-sm flex items-center gap-2 ${buttonColorClasses.primary} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Predefined modal types for common operations
 */
export const ConfirmationModals = {
  /**
   * Delete confirmation modal
   */
  Delete: (props) => (
    <ConfirmationModal
      title="Delete Item"
      description="Are you sure you want to delete this item? This action cannot be undone."
      confirmText="Delete"
      cancelText="Cancel"
      isDangerous={true}
      icon={Trash2}
      {...props}
    />
  ),

  /**
   * Confirm action modal
   */
  Confirm: (props) => (
    <ConfirmationModal
      title="Confirm Action"
      description="Are you sure you want to proceed?"
      confirmText="Confirm"
      cancelText="Cancel"
      {...props}
    />
  ),

  /**
   * Cancel/Close modal
   */
  Cancel: (props) => (
    <ConfirmationModal
      title="Cancel Order"
      description="Are you sure you want to cancel this order? This action cannot be undone."
      confirmText="Cancel Order"
      cancelText="Keep Order"
      isDangerous={true}
      icon={AlertCircle}
      {...props}
    />
  )
};
