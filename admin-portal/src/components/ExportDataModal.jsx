import React, { useState } from 'react';
import { X, Download, Check } from 'lucide-react';
import api from '../utils/api';

const ExportDataModal = ({ isOpen, onClose, currentFilter, internshipId }) => {
    const [selectedColumns, setSelectedColumns] = useState([
        'trackingId', 'name', 'email', 'college', 'cgpa', 'status'
    ]);
    const [isExporting, setIsExporting] = useState(false);

    const columns = [
        { id: 'trackingId', label: 'Tracking ID' },
        { id: 'name', label: 'Candidate Name' },
        { id: 'email', label: 'Email Address' },
        { id: 'phone', label: 'Phone Number' },
        { id: 'college', label: 'College/University' },
        { id: 'branch', label: 'Branch/Stream' },
        { id: 'year', label: 'Year of Study' },
        { id: 'cgpa', label: 'CGPA' },
        { id: 'status', label: 'Application Status' },
        { id: 'applied', label: 'Date Applied' },
        { id: 'internshipTitle', label: 'Internship Title' },
        { id: 'internshipDept', label: 'Department' }
    ];

    const toggleColumn = (id) => {
        setSelectedColumns(prev => 
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const handleExport = async () => {
        if (selectedColumns.length === 0) {
            alert('Please select at least one column to export.');
            return;
        }

        setIsExporting(true);
        try {
            const params = new URLSearchParams();
            if (currentFilter && currentFilter !== 'All') params.append('status', currentFilter);
            if (internshipId) params.append('internshipId', internshipId);
            params.append('columns', selectedColumns.join(','));

            const response = await api.get(`/common/export/applications?${params.toString()}`, {
                responseType: 'blob'
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Applications_Export_${new Date().toLocaleDateString()}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            
            onClose();
        } catch (err) {
            console.error('Export failed:', err);
            alert('Failed to generate export. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                    <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
                        <Download size={18} className="text-primary" />
                        Export Data Selection
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <X size={18} className="text-slate-500" />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
                        Select columns to include in your Excel report:
                    </p>

                    <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {columns.map(col => (
                            <div 
                                key={col.id}
                                onClick={() => toggleColumn(col.id)}
                                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                                    selectedColumns.includes(col.id) 
                                    ? 'bg-primary/5 border-primary/30 dark:bg-primary/10 dark:border-primary/40' 
                                    : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                }`}
                            >
                                <span className={`text-[11px] font-bold ${
                                    selectedColumns.includes(col.id) ? 'text-primary dark:text-primary-light' : 'text-slate-600 dark:text-slate-400'
                                }`}>
                                    {col.label}
                                </span>
                                {selectedColumns.includes(col.id) && (
                                    <Check size={14} className="text-primary" />
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 flex items-center gap-3">
                        <button 
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-inter"
                        >
                            Cancel
                        </button>
                        <button 
                            disabled={isExporting}
                            onClick={handleExport}
                            className="flex-1 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white bg-primary hover:opacity-90 disabled:opacity-50 shadow-lg shadow-primary/20 transition-all font-inter flex items-center justify-center gap-2"
                        >
                            {isExporting ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <Download size={14} />
                                    Download Excel
                                </>
                            )}
                        </button>
                    </div>
                </div>
                
                <div className="px-6 py-4 bg-indigo-50 dark:bg-indigo-950/30 border-t border-indigo-100 dark:border-indigo-900/50">
                    <p className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400/70 tracking-tight leading-relaxed">
                        Note: The export will automatically apply your current status filters and scoping rules based on your access level.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ExportDataModal;
