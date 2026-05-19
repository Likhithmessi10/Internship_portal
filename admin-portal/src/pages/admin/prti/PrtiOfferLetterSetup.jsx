import React, { useEffect, useState } from 'react';
import api from '../../../utils/api';
import {
    FileText, ExternalLink, CheckCircle, AlertTriangle, Loader2,
    RefreshCw, Award, ChevronRight
} from 'lucide-react';

const PrtiOfferLetterSetup = () => {
    const [config, setConfig] = useState(null);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');
    const [sidecarUnreachable, setSidecarUnreachable] = useState(false);

    const load = async ({ silent = false } = {}) => {
        if (!silent) setLoading(true);
        setError(''); setMsg(''); setSidecarUnreachable(false);
        try {
            const [cfgRes, listRes] = await Promise.allSettled([
                api.get('/prti/config/offer-letter'),
                api.get('/prti/config/offer-letter/templates')
            ]);

            if (cfgRes.status === 'fulfilled') {
                setConfig(cfgRes.value.data.data);
            }

            if (listRes.status === 'fulfilled') {
                setTemplates(listRes.value.data.data || []);
            } else {
                setSidecarUnreachable(true);
                setTemplates([]);
            }
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to load configuration');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { load(); }, []);

    const choose = async (templateId) => {
        setSaving(true); setError(''); setMsg('');
        try {
            await api.put('/prti/config/offer-letter', { offerLetterTemplateId: templateId });
            setMsg('Active offer letter template updated.');
            await load({ silent: true });
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to update template');
        } finally {
            setSaving(false);
        }
    };

    const clear = async () => {
        if (!window.confirm('Clear the active offer letter template? Students will no longer be able to download their offer letters until you pick a new one.')) return;
        await choose(null);
    };

    if (loading) {
        return <div className="flex items-center justify-center py-24"><Loader2 size={28} className="animate-spin text-indigo-500" /></div>;
    }

    const sidecarUrl = config?.templateFillingUrl;
    const activeId = config?.offerLetterTemplateId;
    const activeMeta = config?.template;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <section>
                <span className="text-[10px] font-bold tracking-[0.1em] text-indigo-600 uppercase mb-1 block">Document Generation</span>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                    <Award size={30} className="text-indigo-600" /> Offer Letter Template
                </h1>
                <p className="text-sm text-slate-500 font-medium mt-1">
                    Pick which uploaded template the portal uses when students download their offer letter. Upload and design templates in the <strong>template-filling</strong> service.
                </p>
            </section>

            {sidecarUnreachable && (
                <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl flex items-start gap-3">
                    <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-amber-900">Template-filling service is not running</p>
                        <p className="text-xs text-amber-700 mt-1">
                            Start it with <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-[11px]">cd template-filling && npm run dev</code> on the server. Expected URL: <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-[11px]">{sidecarUrl || 'http://localhost:3100'}</code>
                        </p>
                    </div>
                    <button onClick={() => { setRefreshing(true); load({ silent: true }); }}
                        disabled={refreshing}
                        className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg disabled:opacity-50 flex items-center gap-1.5">
                        {refreshing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Retry
                    </button>
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm font-bold text-red-700 flex items-center gap-2">
                    <AlertTriangle size={16} /> {error}
                </div>
            )}
            {msg && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-bold text-emerald-700 flex items-center gap-2">
                    <CheckCircle size={16} /> {msg}
                </div>
            )}

            {/* Active template panel */}
            <section className="bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-700/40 rounded-2xl p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-2">Currently Active</p>
                {activeId ? (
                    <div>
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    {activeMeta?.name || activeId}
                                </h2>
                                <p className="text-xs text-slate-500 font-mono mt-1">{activeId}</p>
                                {activeMeta?.fields && (
                                    <p className="text-xs font-bold text-emerald-700 mt-2">
                                        {activeMeta.fields.length} field{activeMeta.fields.length !== 1 ? 's' : ''} mapped
                                    </p>
                                )}
                            </div>
                            <button onClick={clear} disabled={saving}
                                className="px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 border border-red-200 rounded-lg disabled:opacity-50">
                                Clear selection
                            </button>
                        </div>
                        {activeMeta?.fields?.length > 0 && (
                            <details className="mt-4">
                                <summary className="text-[11px] font-bold text-slate-500 cursor-pointer hover:text-indigo-700">View mapped field labels</summary>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {activeMeta.fields.map(f => (
                                        <span key={f.id} className="px-2 py-0.5 text-[10px] font-bold uppercase bg-slate-100 text-slate-700 rounded">
                                            {f.label}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-3 italic">
                                    Labels must match the keys our backend sends. See <code className="font-mono">backend/services/offerLetterService.js</code> → <code className="font-mono">buildOfferLetterFields()</code>.
                                </p>
                            </details>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-6">
                        <FileText size={36} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-sm font-bold text-slate-500">No offer letter template selected</p>
                        <p className="text-xs text-slate-400 mt-1">Students will see an error when they try to download their offer letter.</p>
                    </div>
                )}
            </section>

            {/* Pick a template */}
            <section>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-black uppercase tracking-widest text-slate-500">Available Templates</h2>
                    {sidecarUrl && (
                        <a href={sidecarUrl} target="_blank" rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 flex items-center gap-1.5">
                            <ExternalLink size={12} /> Open Template Designer
                        </a>
                    )}
                </div>

                {templates.length === 0 ? (
                    <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                        <FileText size={36} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                            {sidecarUnreachable ? 'Unable to load templates.' : 'No templates uploaded yet.'}
                        </p>
                        {!sidecarUnreachable && sidecarUrl && (
                            <a href={sidecarUrl} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-indigo-700 hover:underline">
                                Open the designer to upload one <ExternalLink size={11} />
                            </a>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {templates.map(t => {
                            const isActive = t.id === activeId;
                            return (
                                <button key={t.id} onClick={() => !isActive && choose(t.id)}
                                    disabled={isActive || saving}
                                    className={`w-full px-5 py-4 rounded-2xl border-2 flex items-center gap-4 text-left transition-colors ${
                                        isActive
                                            ? 'border-emerald-400 bg-emerald-50/40 cursor-default'
                                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-400 hover:bg-indigo-50/30'
                                    } ${saving ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                        <FileText size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{t.name}</p>
                                            {isActive && <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded"><CheckCircle size={10} /> Active</span>}
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            {t.fields?.length || 0} field{(t.fields?.length || 0) !== 1 ? 's' : ''} mapped · uploaded {new Date(t.createdAt).toLocaleDateString('en-IN')}
                                        </p>
                                    </div>
                                    {!isActive && <ChevronRight size={18} className="text-slate-400" />}
                                </button>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Hint about labels */}
            <section className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Tip — Naming Your Fields</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                    When designing a template in the template-filling service, name each field with one of these labels and our backend will auto-fill it from the application:
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {[
                        'Student Name', 'Roll Number', 'College', 'Branch', 'Year of Study', 'CGPA',
                        'Email', 'Phone', 'Internship Title', 'Department', 'Field', 'Location',
                        'Duration', 'Internship Type', 'Internship Mode', 'Assigned Role',
                        'Stipend', 'Stipend Amount', 'Mentor Name', 'Mentor Email',
                        'Issue Date', 'Joining Date', 'End Date', 'Reference ID', 'Ref No', 'Year'
                    ].map(label => (
                        <span key={label} className="px-2 py-1 text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded font-mono">
                            {label}
                        </span>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default PrtiOfferLetterSetup;
