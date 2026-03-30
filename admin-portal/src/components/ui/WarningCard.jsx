import React, { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';

const WarningCard = ({ message, onClose, duration = 10000 }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                handleClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration]);

    const handleClose = () => {
        setIsVisible(false);
        if (onClose) setTimeout(onClose, 300); // Wait for fade out animation
    };

    if (!isVisible) return null;

    return (
        <div className={`fixed top-6 right-6 z-[200] max-w-sm w-full animate-in fade-in slide-in-from-right-8 duration-300`}>
            <div className="bg-white dark:bg-slate-900 border-l-4 border-amber-500 rounded-xl shadow-2xl overflow-hidden flex items-stretch ring-1 ring-black/5 dark:ring-white/10 italic">
                <div className="p-4 flex-1 flex items-start gap-3">
                    <div className="mt-0.5 w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="text-amber-600 dark:text-amber-400" size={18} />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1">Attention Required</h4>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-relaxed tracking-tight">
                            {message}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={handleClose}
                    className="px-3 border-l border-outline-variant/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

export default WarningCard;
