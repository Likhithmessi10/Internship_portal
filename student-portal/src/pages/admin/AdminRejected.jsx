import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { ArrowLeft, XCircle, AlertCircle, ChevronRight, Eye } from 'lucide-react';
import ApplicationProfileModal from './ApplicationProfileModal';

const AdminRejected = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);

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
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link to="/admin/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <ArrowLeft size={18} className="text-gray-500" />
                </Link>
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Rejected Applications</h1>
                    <p className="text-gray-500 text-sm mt-0.5">All rejected applicants across all internships. View their profiles below.</p>
                </div>
            </div>

            {applications.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
                    <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700 font-medium">
                        {applications.length} rejected application{applications.length !== 1 ? 's' : ''}.
                    </p>
                </div>
            )}

            <div className="admin-card">
                {applications.length === 0 ? (
                    <div className="text-center py-16">
                        <XCircle size={48} className="mx-auto text-gray-200 mb-4" />
                        <p className="text-gray-500 font-medium">No rejected applications.</p>
                        <Link to="/admin/dashboard" className="mt-4 inline-flex items-center gap-1.5 text-indigo-600 font-bold hover:underline text-sm">
                            <ArrowLeft size={14} /> Back to Dashboard
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="pb-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Student</th>
                                    <th className="pb-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">College</th>
                                    <th className="pb-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">CGPA</th>
                                    <th className="pb-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Applied For</th>
                                    <th className="pb-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Rejected On</th>
                                    <th className="pb-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Profile</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {applications.map(app => (
                                    <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-4 pr-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600 font-black text-sm flex-shrink-0">
                                                    {app.student?.fullName?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800">{app.student?.fullName}</p>
                                                    <p className="text-xs text-gray-400">{app.student?.phone}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 pr-4">
                                            <p className="text-sm text-gray-700 font-medium max-w-xs truncate">{app.student?.collegeName}</p>
                                            <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded font-semibold text-gray-500">
                                                {app.student?.collegeCategory}
                                            </span>
                                        </td>
                                        <td className="py-4 text-center font-black text-gray-800">{app.student?.cgpa}</td>
                                        <td className="py-4 pr-4">
                                            <p className="text-sm font-medium text-gray-800">{app.internship?.title}</p>
                                            <p className="text-xs text-gray-400">{app.internship?.department}</p>
                                        </td>
                                        <td className="py-4 text-center text-xs text-gray-500">
                                            {new Date(app.updatedAt).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 text-center">
                                            <button onClick={() => setSelected(app)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-bold transition-colors">
                                                <Eye size={12} /> View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

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
