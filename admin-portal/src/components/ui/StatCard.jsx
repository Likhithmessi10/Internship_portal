import React from 'react';

const StatCard = ({ icon: Icon, label, value, subtext, color = 'blue', onEdit, trend }) => {
    const colorVariants = {
        blue: {
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20',
            text: 'text-blue-400',
            glow: 'group-hover:shadow-blue-500/10'
        },
        emerald: {
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            text: 'text-emerald-400',
            glow: 'group-hover:shadow-emerald-500/10'
        },
        amber: {
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
            text: 'text-amber-400',
            glow: 'group-hover:shadow-amber-500/10'
        },
        purple: {
            bg: 'bg-purple-500/10',
            border: 'border-purple-500/20',
            text: 'text-purple-400',
            glow: 'group-hover:shadow-purple-500/10'
        },
        rose: {
            bg: 'bg-rose-500/10',
            border: 'border-rose-500/20',
            text: 'text-rose-400',
            glow: 'group-hover:shadow-rose-500/10'
        }
    };

    const variant = colorVariants[color] || colorVariants.blue;

    return (
        <div className={`group relative bg-surface rounded-2xl p-6 border border-border/50 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${variant.glow}`}>
            {/* Subtle gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
            
            <div className="relative z-10">
                {/* Header with icon and edit button */}
                <div className="flex items-center justify-between mb-5">
                    <div className={`w-12 h-12 rounded-xl ${variant.bg} ${variant.border} border flex items-center justify-center ${variant.text}`}>
                        <Icon size={22} strokeWidth={2} />
                    </div>
                    {onEdit && (
                        <button 
                            onClick={onEdit} 
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
                        >
                            <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                    )}
                </div>

                {/* Stats */}
                <div className="space-y-2">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
                    <p className="text-4xl font-bold text-white tracking-tight leading-none">{value}</p>
                    
                    {/* Trend indicator */}
                    {trend && (
                        <div className="flex items-center gap-1.5 mt-3">
                            <span className={`text-xs font-semibold ${trend > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                            </span>
                            <span className="text-xs text-gray-500">vs last month</span>
                        </div>
                    )}
                    
                    {subtext && (
                        <p className="text-xs text-gray-500 font-medium mt-2">{subtext}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StatCard;
