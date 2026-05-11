import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../../utils/api';
import { ClipboardList, Calendar, X, Send } from 'lucide-react';

const WorkAssignmentModal = ({ application, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        dueDate: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/admin/work/assign', {
                applicationId: application.id,
                ...formData
            });
            onClose(true);
        } catch (err) {
            console.error('Failed to assign work');
            alert('Failed to assign work. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 z-10 border border-white/20">
                <div className="p-8 border-b border-outline-variant/10 flex justify-between items-center bg-gradient-to-r from-primary to-primary/80 text-white">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <ClipboardList size={24} /> New Assignment
                        </h3>
                        <p className="text-[10px] text-white/70 uppercase font-black mt-1 tracking-widest">
                            Assigning task to: {application.student.fullName}
                        </p>
                    </div>
                    <button onClick={() => onClose()} className="hover:bg-white/20 p-2 rounded-full transition-all">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 p-10 overflow-y-auto space-y-10">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-outline ml-1">Task Title</label>
                        <input 
                            required
                            type="text"
                            placeholder="e.g., Network Configuration Analysis"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-primary/10 dark:focus:ring-blue-500/10 focus:border-primary transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-outline ml-1">Task Description</label>
                        <textarea 
                            required
                            rows="4"
                            placeholder="Detail the objectives and expected outcomes..."
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-primary/10 dark:focus:ring-blue-500/10 focus:border-primary transition-all resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-outline ml-1">Due Date (Optional)</label>
                        <div className="relative">
                            <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline/50" />
                            <input 
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                                className="w-full p-4 pl-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-primary/10 dark:focus:ring-blue-500/10 focus:border-primary transition-all"
                            />
                        </div>
                    </div>

                    <button 
                        disabled={loading}
                        className="w-full py-5 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4"
                    >
                        {loading ? 'SENDING NOTIFICATION...' : (
                            <>
                                <Send size={20} /> ASSIGN & NOTIFY INTERN
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default WorkAssignmentModal;
