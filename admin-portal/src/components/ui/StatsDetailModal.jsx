import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Building2, Users, Briefcase, FileText, Download, ChevronRight } from 'lucide-react';

const StatsDetailModal = ({ title, data = [], type, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredData = data.filter(item => {
        const q = searchTerm.toLowerCase();
        if (type === 'DEPARTMENTS')  return item.toLowerCase().includes(q);
        if (type === 'INTERNS')      return item.student?.fullName?.toLowerCase().includes(q) || item.internship?.title?.toLowerCase().includes(q);
        if (type === 'PROGRAMS')     return item.title?.toLowerCase().includes(q) || item.department?.toLowerCase().includes(q);
        if (type === 'APPLICATIONS') return item.student?.fullName?.toLowerCase().includes(q) || item.internship?.title?.toLowerCase().includes(q);
        return true;
    });

    const renderItem = (item, index) => {
        switch (type) {
            case 'DEPARTMENTS':
                return (
                    <div key={index} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary/40 hover:bg-primary/5 transition-all group">
                        <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                            <Building2 size={16} />
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{item}</span>
                        <ChevronRight size={14} className="text-slate-300 group-hover:text-primary ml-auto transition-colors" />
                    </div>
                );
            case 'INTERNS':
                return (
                    <div key={index} className="flex items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-400/40 transition-all">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center font-black text-emerald-600 dark:text-emerald-400 text-sm shrink-0">
                                {item.student?.fullName?.charAt(0)}
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{item.student?.fullName}</p>
                                <p className="text-[10px] text-slate-400 font-medium truncate">{item.internship?.title} · {item.internship?.department}</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-full uppercase shrink-0">Active</span>
                    </div>
                );
            case 'PROGRAMS':
                return (
                    <div key={index} className="flex items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-sky-400/40 transition-all">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
                                <Briefcase size={15} />
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{item.title}</p>
                                <p className="text-[10px] text-slate-400 font-medium truncate">{item.department} · {item.location || 'Multiple'}</p>
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-sm font-black text-slate-700 dark:text-slate-200">{item.applicationsCount || 0}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Apps</p>
                        </div>
                    </div>
                );
            case 'APPLICATIONS':
                return (
                    <div key={index} className="flex items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-400/40 transition-all">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center text-amber-600 shrink-0">
                                <FileText size={15} />
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{item.student?.fullName}</p>
                                <p className="text-[10px] text-slate-400 font-medium truncate">{item.internship?.title}</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-black bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full uppercase shrink-0">
                            {item.status || 'Pending'}
                        </span>
                    </div>
                );
            default:
                return null;
        }
    };

    const handleExport = () => {
        let csv = 'data:text/csv;charset=utf-8,Title,Details\n';
        filteredData.forEach(item => {
            if (type === 'DEPARTMENTS')  csv += `"${item}","Department"\n`;
            if (type === 'INTERNS')      csv += `"${item.student?.fullName}","${item.internship?.title}"\n`;
            if (type === 'PROGRAMS')     csv += `"${item.title}","${item.department}"\n`;
            if (type === 'APPLICATIONS') csv += `"${item.student?.fullName}","${item.internship?.title}"\n`;
        });
        const link = document.createElement('a');
        link.href = encodeURI(csv);
        link.download = `${title?.replace(/\s+/g, '_')}.csv`;
        link.click();
    };

    const TypeIcon = type === 'DEPARTMENTS' ? Building2 : type === 'INTERNS' ? Users : type === 'PROGRAMS' ? Briefcase : FileText;

    return createPortal(
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal — centred, never taller than viewport */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div
                    className="pointer-events-auto w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col"
                    style={{ maxHeight: 'calc(100vh - 2rem)' }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <TypeIcon size={18} />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-800 dark:text-white">{title}</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filteredData.length} records</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Search + Export */}
                    <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
                        <div className="relative flex-1">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder={`Search ${title?.toLowerCase()}…`}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors shrink-0"
                        >
                            <Download size={12} /> Export
                        </button>
                    </div>

                    {/* Scrollable list */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
                        {filteredData.length > 0
                            ? filteredData.map((item, idx) => renderItem(item, idx))
                            : (
                                <div className="py-16 text-center">
                                    <Search size={28} className="text-slate-300 mx-auto mb-3" />
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No results found</p>
                                </div>
                            )
                        }
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 dark:border-slate-700 shrink-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {filteredData.length} of {data.length} records
                        </span>
                        <button
                            onClick={onClose}
                            className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-primary/90 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
};

export default StatsDetailModal;
