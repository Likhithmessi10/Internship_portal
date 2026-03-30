import React, { useState } from 'react';
import { X, Search, Building2, Users, Briefcase, FileText, Download, ChevronRight } from 'lucide-react';

const StatsDetailModal = ({ title, data = [], type, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredData = data.filter(item => {
        const searchStr = searchTerm.toLowerCase();
        if (type === 'DEPARTMENTS') return item.toLowerCase().includes(searchStr);
        if (type === 'INTERNS') return (
            item.student?.fullName?.toLowerCase().includes(searchStr) ||
            item.student?.email?.toLowerCase().includes(searchStr) ||
            item.internship?.title?.toLowerCase().includes(searchStr)
        );
        if (type === 'PROGRAMS') return (
            item.title?.toLowerCase().includes(searchStr) ||
            item.department?.toLowerCase().includes(searchStr) ||
            item.location?.toLowerCase().includes(searchStr)
        );
        if (type === 'APPLICATIONS') return (
            item.student?.fullName?.toLowerCase().includes(searchStr) ||
            item.internship?.title?.toLowerCase().includes(searchStr)
        );
        return true;
    });

    const renderItem = (item, index) => {
        switch (type) {
            case 'DEPARTMENTS':
                return (
                    <div key={index} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-outline-variant/10 hover:border-primary/30 transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                <Building2 size={18} />
                            </div>
                            <span className="font-bold text-primary text-sm uppercase tracking-tight">{item}</span>
                        </div>
                        <ChevronRight size={16} className="text-outline opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                );
            case 'INTERNS':
                return (
                    <div key={index} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-outline-variant/10 hover:border-emerald-500/30 transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 font-black text-xs uppercase">
                                {item.student?.fullName?.charAt(0)}
                            </div>
                            <div>
                                <p className="font-bold text-primary text-sm leading-tight">{item.student?.fullName}</p>
                                <p className="text-[10px] text-outline font-medium uppercase tracking-tighter mt-0.5">{item.internship?.title} • {item.internship?.department}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-2 py-1 rounded uppercase">Active</span>
                        </div>
                    </div>
                );
            case 'PROGRAMS':
                return (
                    <div key={index} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-outline-variant/10 hover:border-sky-500/30 transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-all">
                                <Briefcase size={18} />
                            </div>
                            <div>
                                <p className="font-bold text-primary text-sm leading-tight uppercase tracking-tight">{item.title}</p>
                                <p className="text-[10px] text-outline font-medium uppercase tracking-tighter mt-0.5">{item.department} • {item.location}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-black text-primary">{item.applicationsCount || 0}</p>
                            <p className="text-[9px] text-outline font-bold uppercase tracking-widest leading-none">Pool Size</p>
                        </div>
                    </div>
                );
            case 'APPLICATIONS':
                return (
                    <div key={index} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-outline-variant/10 hover:border-amber-500/30 transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                                <FileText size={18} />
                            </div>
                            <div>
                                <p className="font-bold text-primary text-sm leading-tight">{item.student?.fullName}</p>
                                <p className="text-[10px] text-outline font-medium uppercase tracking-tighter mt-0.5">Applied for: {item.internship?.title}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-black bg-amber-50 text-amber-600 px-2 py-1 rounded uppercase">{item.status || 'PENDING'}</span>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const handleExport = () => {
        // Mock export logic - convert filteredData to CSV and download
        const headers = ["Title", "Details"];
        let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";
        
        filteredData.forEach(item => {
            if (type === 'DEPARTMENTS') csvContent += `"${item}","Department"\n`;
            else if (type === 'INTERNS') csvContent += `"${item.student?.fullName}","${item.internship?.title}"\n`;
            else if (type === 'PROGRAMS') csvContent += `"${item.title}","${item.department}"\n`;
            else if (type === 'APPLICATIONS') csvContent += `"${item.student?.fullName}","${item.internship?.title}"\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${title.replace(/\s+/g, '_')}_List.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-surface-container-lowest dark:bg-slate-950 w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/20 flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-8 duration-500">
                {/* Modal Header */}
                <div className="p-8 border-b border-outline-variant/10 flex justify-between items-center bg-white dark:bg-slate-900">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            {type === 'DEPARTMENTS' && <Building2 size={24} />}
                            {type === 'INTERNS' && <Users size={24} />}
                            {type === 'PROGRAMS' && <Briefcase size={24} />}
                            {type === 'APPLICATIONS' && <FileText size={24} />}
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-primary uppercase tracking-tight leading-none">{title}</h3>
                            <p className="text-[11px] font-bold text-outline uppercase tracking-widest mt-1">Detailed Institutional Record View</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-red-50 hover:text-red-600 rounded-full transition-all text-outline">
                        <X size={20} />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="px-8 py-4 bg-surface-container-low flex items-center gap-4 border-b border-outline-variant/10">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder={`Search ${title?.toLowerCase()}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white dark:bg-slate-800 border border-outline-variant/20 rounded-2xl pl-12 pr-4 py-3 text-xs font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all uppercase placeholder:normal-case italic"
                        />
                    </div>
                    <button 
                        onClick={handleExport}
                        className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-outline-variant/20 rounded-2xl text-[10px] font-black text-primary hover:bg-primary hover:text-white transition-all uppercase tracking-widest"
                    >
                        <Download size={14} /> Export
                    </button>
                </div>

                {/* List Area */}
                <div className="flex-1 overflow-y-auto p-8 space-y-3 custom-scrollbar">
                    {filteredData.length > 0 ? (
                        filteredData.map((item, idx) => renderItem(item, idx))
                    ) : (
                        <div className="py-20 text-center space-y-4">
                            <div className="w-16 h-16 bg-surface-container-low rounded-full flex items-center justify-center mx-auto text-outline/30">
                                <Search size={32} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-primary uppercase tracking-tight">No results found</p>
                                <p className="text-xs font-bold text-outline uppercase tracking-widest mt-1">Try adjusting your search criteria</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 px-8 bg-surface-container-low border-t border-outline-variant/10 flex justify-between items-center">
                    <span className="text-[10px] font-black text-outline uppercase tracking-widest">
                        Showing {filteredData.length} Records
                    </span>
                    <button onClick={onClose} className="px-8 py-3 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
                        Close View
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StatsDetailModal;
