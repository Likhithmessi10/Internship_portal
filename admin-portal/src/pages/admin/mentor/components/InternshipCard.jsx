import React from 'react';
import { Users, Briefcase, Activity, MapPin, Clock, ChevronRight } from 'lucide-react';

const statusColors = {
    ACTIVE: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    COMPLETED: 'bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-500/20'
};

const InternshipCard = ({ internship, onClick }) => {
    const status = internship.isActive ? 'ACTIVE' : 'COMPLETED';

    return (
        <div
            onClick={() => onClick(internship)}
            className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 cursor-pointer hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
        >
            {/* Subtle gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-start justify-between mb-5">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <Briefcase size={22} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColors[status]}`}>
                    {status}
                </span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {internship.title}
            </h3>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-5">
                <MapPin size={12} />
                <span>{internship.department}</span>
                {internship.location && (
                    <>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span>{internship.location}</span>
                    </>
                )}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center mb-1">
                        <Users size={14} className="text-blue-500" />
                    </div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{internship.internCount}</p>
                    <p className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Interns</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center mb-1">
                        <Activity size={14} className="text-emerald-500" />
                    </div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{internship.avgAttendance}%</p>
                    <p className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Attendance</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center mb-1">
                        <Clock size={14} className="text-purple-500" />
                    </div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{internship.activeCount}</p>
                    <p className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active</p>
                </div>
            </div>

            {/* CTA Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-400 dark:text-slate-500">{internship.duration || 'Duration N/A'}</span>
                <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:gap-2 transition-all">
                    View Details <ChevronRight size={14} />
                </div>
            </div>
        </div>
    );
};

export default InternshipCard;
