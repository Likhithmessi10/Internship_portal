import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Themed Select Component
 * Matches the APTRANSCO portal design system
 * 
 * @param {string} value - Selected value
 * @param {function} onChange - Change handler
 * @param {Array} options - Array of {value, label} objects
 * @param {string} placeholder - Placeholder text
 * @param {boolean} disabled - Disabled state
 * @param {string} className - Additional classes
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {boolean} error - Error state
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
                <label className="block text-[10px] font-black text-outline uppercase tracking-widest mb-2 ml-1">
                    {label} {required && <span className="text-error">*</span>}
                </label>
            )}
            
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    w-full bg-white border rounded-xl text-left font-bold
                    transition-all duration-200
                    flex items-center justify-between
                    ${sizeClasses[size]}
                    ${error 
                        ? 'border-error focus:ring-4 focus:ring-error/10 focus:border-error' 
                        : 'border-outline-variant/20 focus:ring-4 focus:ring-primary/10 focus:border-primary'
                    }
                    ${disabled 
                        ? 'bg-surface-container-low text-outline cursor-not-allowed' 
                        : 'cursor-pointer hover:border-primary/50'
                    }
                    ${!selectedOption && 'text-outline/40'}
                `}
            >
                <span className={selectedOption ? 'text-primary' : ''}>
                    {selectedOption?.label || placeholder}
                </span>
                <ChevronDown 
                    size={18} 
                    className={`text-outline/40 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <>
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute z-50 w-full mt-1 bg-white border border-outline-variant/20 rounded-xl shadow-2xl max-h-64 overflow-auto">
                        {options.length === 0 ? (
                            <div className="px-4 py-3 text-xs text-outline/40 font-bold">
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
                                            ? 'bg-primary/10 text-primary' 
                                            : 'text-primary hover:bg-surface-container-low'
                                        }
                                    `}
                                >
                                    <span>{option.label}</span>
                                    {value === option.value && (
                                        <Check size={16} className="text-primary" />
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
