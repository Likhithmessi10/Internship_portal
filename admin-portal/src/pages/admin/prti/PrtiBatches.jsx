import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../utils/api';
import { Plus, Trash2, Calendar, Folder, Loader2, ArrowRight } from 'lucide-react';

const PrtiBatches = () => {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newBatch, setNewBatch] = useState({ title: '', description: '' });

    const fetchBatches = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/batches');
            setBatches(res.data.data);
        } catch (err) {
            console.error('Failed to fetch batches:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBatches();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newBatch.title) return;
        setCreating(true);
        try {
            await api.post('/admin/batches', newBatch);
            setNewBatch({ title: '', description: '' });
            fetchBatches();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create program');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure? This will only work if there are no internships in this program.')) return;
        try {
            await api.delete(`/admin/batches/${id}`);
            fetchBatches();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete');
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-20">
            <header className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-primary tracking-tight mb-2">Master Programs</h1>
                    <p className="text-sm text-outline/60 font-medium uppercase tracking-wider">Manage high-level internship cycles and batches.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Creation Form */}
                <div className="lg:col-span-1">
                    <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 shadow-sm sticky top-8">
                        <h3 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
                            <Plus className="w-5 h-5" /> Create New Program
                        </h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-outline mb-1.5 block">Program Title</label>
                                <input 
                                    type="text" 
                                    value={newBatch.title} 
                                    onChange={e => setNewBatch({...newBatch, title: e.target.value})}
                                    placeholder="e.g. Summer Internship 2026"
                                    className="admin-input text-sm font-bold w-full"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-outline mb-1.5 block">Description (Optional)</label>
                                <textarea 
                                    value={newBatch.description} 
                                    onChange={e => setNewBatch({...newBatch, description: e.target.value})}
                                    placeholder="Brief overview of this batch..."
                                    className="admin-input text-sm font-bold w-full resize-none"
                                    rows={3}
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={creating || !newBatch.title}
                                className="w-full py-3 bg-primary text-white rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
                            >
                                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                Launch Program
                            </button>
                        </form>
                    </div>
                </div>

                {/* Programs List */}
                <div className="lg:col-span-2 space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-primary/30" />
                        </div>
                    ) : batches.length === 0 ? (
                        <div className="text-center py-20 bg-surface-container-low rounded-3xl border border-dashed border-outline-variant/30">
                            <Folder className="w-12 h-12 text-outline/20 mx-auto mb-4" />
                            <p className="text-outline/40 font-bold uppercase tracking-widest text-sm">No master programs created yet.</p>
                        </div>
                    ) : (
                        batches.map(batch => (
                            <div key={batch.id} className="group bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 shadow-sm hover:shadow-md hover:border-primary/20 transition-all flex items-center justify-between">
                                <Link to={`/prti/batches/${batch.id}`} className="flex items-center gap-5 flex-1 min-w-0 no-underline">
                                    <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center text-primary border border-primary/5 group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-xl font-bold text-primary tracking-tight truncate">{batch.title}</h4>
                                        <div className="flex items-center gap-4 mt-1">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-outline flex items-center gap-1.5">
                                                <Folder className="w-3 h-3" /> {batch._count?.internships || 0} Internships
                                            </span>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-outline/40">
                                                Created {new Date(batch.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Link
                                        to={`/prti/batches/${batch.id}`}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-primary/5 hover:bg-primary hover:text-white text-primary rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all no-underline"
                                    >
                                        View <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(batch.id)}
                                        className="p-2.5 text-outline/30 hover:text-error hover:bg-error/5 rounded-xl transition-all"
                                        title="Delete Program"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default PrtiBatches;
