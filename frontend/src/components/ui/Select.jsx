import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Themed Select Component for Student Portal
 * Matches the APTRANSCO student portal design system
 */
const Select = ({
    value,
    onChange,
    options = [],
    placeholder = 'Select...',
    disabled = false,
    className = '',
    size = 'md',
    error = false,
    label,
    required = false
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const selectedOption = options.find(opt => opt.value === value);

    const sizeClasses = {
        sm: 'px-3 py-2 text-xs',
        md: 'px-4 py-3 text-sm',
        lg: 'px-4 py-4 text-base'
    };

    return (
        <div className={`relative ${className}`}>
            {label && (
                <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 mb-2">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    w-full bg-white dark:bg-slate-800 border rounded-xl text-left font-bold
                    transition-all duration-200
                    flex items-center justify-between
                    ${sizeClasses[size]}
                    ${error 
                        ? 'border-red-500 focus:ring-4 focus:ring-red-100 focus:border-red-500' 
                        : 'border-gray-200 dark:border-white/10 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 focus:border-indigo-500'
                    }
                    ${disabled 
                        ? 'bg-gray-50 dark:bg-slate-900 text-gray-400 cursor-not-allowed' 
                        : 'cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600'
                    }
                    ${!selectedOption && 'text-gray-400'}
                `}
            >
                <span className={selectedOption ? 'text-gray-900 dark:text-white' : ''}>
                    {selectedOption?.label || placeholder}
                </span>
                <ChevronDown 
                    size={18} 
                    className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <>
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl max-h-64 overflow-auto">
                        {options.length === 0 ? (
                            <div className="px-4 py-3 text-xs text-gray-400 font-medium">
                                No options available
                            </div>
                        ) : (
                            options.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    className={`
                                        w-full px-4 py-3 text-left text-sm font-bold
                                        transition-colors
                                        flex items-center justify-between
                                        ${value === option.value 
                                            ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' 
                                            : 'text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700'
                                        }
                                    `}
                                >
                                    <span>{option.label}</span>
                                    {value === option.value && (
                                        <Check size={16} className="text-indigo-600 dark:text-indigo-400" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default Select;
