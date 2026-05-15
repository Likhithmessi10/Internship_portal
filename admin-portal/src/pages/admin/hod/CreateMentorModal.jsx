import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../../../utils/api';
import { UserPlus, X, Send, Mail, User, Phone, Briefcase, MapPin, BookOpen } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const DEFAULT_PASSWORD = 'password123';
const locName = l => (typeof l === 'string' ? l : (l?.name || ''));

const Field = ({ label, required, children }) => (
    <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-outline dark:text-slate-500 ml-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
    </div>
);

const inputCls = "w-full p-3 pl-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all";
const selectCls = "w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none";

const CreateMentorModal = ({ onClose }) => {
    const { user } = useAuth();
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState('');
    const [deptFields, setDeptFields] = useState([]); // [{id, fieldName, locations}]

    const [form, setForm] = useState({
        name:        '',
        email:       '',
        phone:       '',
        designation: '',
        mentorField: '',
        mentorLocation: '',
    });

    // Fetch fields for HOD's department from the dept master
    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get('/admin/dept-master?all=false');
                const depts = res.data.data || [];
                const myDept = depts.find(d =>
                    d.code?.toLowerCase() === user?.department?.toLowerCase() ||
                    d.name?.toLowerCase() === user?.department?.toLowerCase()
                );
                if (myDept?.fields) setDeptFields(myDept.fields);
            } catch { /* silent — field dropdown is optional */ }
        };
        load();
    }, [user?.department]);

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const selectedField = deptFields.find(f => f.fieldName === form.mentorField);
    const locations     = Array.isArray(selectedField?.locations) ? selectedField.locations : [];

    const handleFieldChange = (fieldName) => {
        set('mentorField', fieldName);
        set('mentorLocation', ''); // reset location when field changes
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email) { setError('Name and email are required.'); return; }
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/admin/register', {
                name:           form.name.trim(),
                email:          form.email.trim().toLowerCase(),
                phone:          form.phone.trim() || undefined,
                designation:    form.designation.trim() || undefined,
                mentorField:    form.mentorField || undefined,
                mentorLocation: form.mentorLocation || undefined,
                password:       DEFAULT_PASSWORD,
                role:           'MENTOR',
                department:     user.department,
            });
            onClose(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create mentor.');
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => onClose(false)} />
            <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-white/20 z-10 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-7 py-5 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-t-3xl text-white">
                    <div>
                        <h3 className="text-lg font-black flex items-center gap-2"><UserPlus size={20} /> Create Mentor</h3>
                        <p className="text-[10px] text-white/80 font-bold uppercase tracking-widest mt-0.5">{user?.department} Department</p>
                    </div>
                    <button onClick={() => onClose(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors"><X size={18} /></button>
                </div>

                <form onSubmit={handleSubmit} className="px-7 py-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm font-semibold">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        {/* Full Name */}
                        <Field label="Full Name" required>
                            <div className="relative">
                                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="text" required placeholder="Dr. A. Sharma"
                                    value={form.name} onChange={e => set('name', e.target.value)}
                                    className={inputCls} />
                            </div>
                        </Field>

                        {/* Phone */}
                        <Field label="Phone Number">
                            <div className="relative">
                                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="tel" placeholder="9876543210"
                                    value={form.phone} onChange={e => set('phone', e.target.value)}
                                    className={inputCls} />
                            </div>
                        </Field>
                    </div>

                    {/* Email */}
                    <Field label="Email Address" required>
                        <div className="relative">
                            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="email" required placeholder="mentor@aptransco.gov.in"
                                value={form.email} onChange={e => set('email', e.target.value)}
                                className={inputCls} />
                        </div>
                    </Field>

                    {/* Designation */}
                    <Field label="Designation">
                        <div className="relative">
                            <Briefcase size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder="e.g. Assistant Engineer"
                                value={form.designation} onChange={e => set('designation', e.target.value)}
                                className={inputCls} />
                        </div>
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Field */}
                        <Field label="Internship Field">
                            <div className="relative">
                                <BookOpen size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <select value={form.mentorField} onChange={e => handleFieldChange(e.target.value)}
                                    className={selectCls + ' pl-10'}>
                                    <option value="">— Select Field —</option>
                                    {deptFields.map(f => (
                                        <option key={f.id} value={f.fieldName}>{f.fieldName}</option>
                                    ))}
                                </select>
                            </div>
                        </Field>

                        {/* Location */}
                        <Field label="Location">
                            <div className="relative">
                                <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
                                <input
                                    type="text"
                                    list="mentor-locations"
                                    value={form.mentorLocation}
                                    onChange={e => set('mentorLocation', e.target.value)}
                                    placeholder="e.g. Vijayawada HQ"
                                    className={inputCls}
                                />
                                {locations.length > 0 && (
                                    <datalist id="mentor-locations">
                                        {locations.map(l => { const n = locName(l); return <option key={n} value={n} />; })}
                                    </datalist>
                                )}
                            </div>
                        </Field>
                    </div>

                    {/* Default password info */}
                    <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
                        <span className="text-amber-600 text-lg mt-0.5">🔑</span>
                        <div>
                            <p className="text-[11px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">Default Password</p>
                            <p className="text-xs font-mono font-bold text-amber-800 dark:text-amber-300 mt-0.5">{DEFAULT_PASSWORD}</p>
                            <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-0.5">The mentor can change this after their first login.</p>
                        </div>
                    </div>

                    <button type="submit" disabled={loading}
                        className="w-full py-3.5 bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                        {loading ? 'Creating…' : <><Send size={16} /> Create Mentor Account</>}
                    </button>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default CreateMentorModal;
