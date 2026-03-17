import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { XCircle, ArrowLeft, Eye } from 'lucide-react';
import ApplicationProfileModal from './ApplicationProfileModal';

const AdminRejected = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const navigate = useNavigate();

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/applications/rejected');
            setApplications(res.data.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full" />
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Premium Header/Banner */}
            <div className="bg-gradient-to-br from-red-950 via-slate-900 to-red-950 rounded-[2.5rem] p-10 mb-8 text-white shadow-2xl relative overflow-hidden group border border-white/5 dark:border-white/10">
                {/* Decorative Blur Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-red-500 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <button onClick={() => navigate('/dashboard')} className="w-14 h-14 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center backdrop-blur-xl shadow-inner hover:bg-white/20 transition-all hover:rotate-6">
                            <ArrowLeft className="w-6 h-6 text-white" />
                        </button>
                        <div>
                            <h1 className="text-4xl font-black font-rajdhani mb-1 text-white uppercase tracking-tighter">
                                Rejected <span className="text-red-400">Applications</span>
                            </h1>
                            <p className="text-red-200/70 font-medium text-lg tracking-wide uppercase text-[12px] font-bold tracking-[0.3em]">
                                Archive of declined applicants
                            </p>
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10">
                        <span className="text-3xl font-black text-white">{applications.length}</span>
                        <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-red-300">Total Rejected</span>
                    </div>
                </div>
            </div>

            <div className="glass-card bg-white dark:bg-slate-900/60 border-black/5 dark:border-white/10 rounded-[2.5rem] premium-shadow overflow-hidden transition-all duration-500">
                <div className="p-8 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-red-950/20">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-4 font-rajdhani uppercase tracking-widest">
                        <div className="p-2 bg-red-100 dark:bg-red-500/20 rounded-xl">
                            <XCircle size={24} className="text-red-600 dark:text-red-400" />
                        </div>
                        Rejection <span className="text-gray-400 dark:text-slate-500">Log</span>
                    </h2>
                </div>

                {applications.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-100 dark:border-white/5">
                            <XCircle size={40} className="text-gray-200 dark:text-slate-700" />
                        </div>
                        <p className="text-gray-500 dark:text-slate-400 font-bold text-lg">No rejected applications found.</p>
                        <button onClick={() => navigate('/dashboard')} className="mt-6 inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-[0.2em] text-xs hover:underline">
                            <ArrowLeft size={16} /> Back to Dashboard
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto px-8 pb-8">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-white/5">
                                    <th className="py-5 text-left text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Student</th>
                                    <th className="py-5 text-left text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">College Info</th>
                                    <th className="py-5 text-center text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">CGPA</th>
                                    <th className="py-5 text-left text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Position</th>
                                    <th className="py-5 text-center text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Declined On</th>
                                    <th className="py-5 text-center text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                {applications.map(app => (
                                    <tr key={app.id} className="hover:bg-red-50/30 dark:hover:bg-red-500/5 transition-all group font-medium">
                                        <td className="py-5 pr-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400 font-black text-lg shadow-inner">
                                                    {app.student?.fullName?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white leading-tight">{app.student?.fullName}</p>
                                                    <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 font-bold uppercase tracking-widest">{app.student?.phone}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 pr-4">
                                            <p className="text-sm text-gray-700 dark:text-slate-300 font-bold max-w-xs truncate">{app.student?.collegeName}</p>
                                            <span className="inline-block mt-1 text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-slate-800 rounded font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest border border-gray-200 dark:border-white/5">
                                                {app.student?.collegeCategory}
                                            </span>
                                        </td>
                                        <td className="py-5 text-center">
                                            <span className="text-lg font-black text-gray-900 dark:text-white">{app.student?.cgpa}</span>
                                        </td>
                                        <td className="py-5 pr-4">
                                            <p className="text-sm font-bold text-gray-800 dark:text-indigo-200">{app.internship?.title}</p>
                                            <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5 font-bold uppercase tracking-[0.15em]">{app.internship?.department}</p>
                                        </td>
                                        <td className="py-5 text-center">
                                            <span className="text-[10px] font-black text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-white/5 uppercase tracking-widest">
                                                {new Date(app.updatedAt).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td className="py-5 text-center">
                                            <button onClick={() => setSelected(app)}
                                                className="p-2.5 bg-gray-50 dark:bg-slate-800 hover:bg-indigo-600 dark:hover:bg-indigo-600 text-gray-400 hover:text-white rounded-xl transition-all shadow-sm border border-gray-200 dark:border-white/5 group/btn">
                                                <Eye size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Profile Modal */}
            {selected && (
                <ApplicationProfileModal
                    application={selected}
                    onClose={() => setSelected(null)}
                    onHire={null}
                    onReject={null}
                />
            )}
        </div>
    );
};

export default AdminRejected;
