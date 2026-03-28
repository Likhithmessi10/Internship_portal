import React from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

const DeleteConfirmationModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    loading,
    warning,
    confirmText = 'Delete'
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="bg-gradient-to-br from-error to-error/80 p-6 text-white">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/20">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black">Delete {title}</h3>
                                <p className="text-[10px] text-white/70 uppercase font-black mt-1 tracking-widest">
                                    This action cannot be undone
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-all">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {warning && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <div className="flex items-start gap-3">
                                <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-amber-800 mb-1">Warning</p>
                                    <p className="text-[9px] text-amber-700 leading-relaxed">{warning}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <p className="text-sm font-bold text-gray-700">{message}</p>

                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                        <p className="text-[10px] font-bold text-red-800 uppercase tracking-widest">
                            <AlertTriangle size={12} className="inline mr-1" />
                            Permanent Action
                        </p>
                        <p className="text-[9px] text-red-700 mt-1">
                            All associated data will be permanently deleted.
                        </p>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-all disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="px-8 py-4 bg-error text-white rounded-xl font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-error/20"
                    >
                        <Trash2 size={18} /> {loading ? 'Deleting...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;
