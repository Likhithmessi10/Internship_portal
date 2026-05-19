import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api, { MEDIA_URL } from '../../utils/api';
import {
    User, Mail, Building2, Phone, Briefcase, MapPin,
    Lock, Eye, EyeOff, Camera, CheckCircle, AlertCircle,
    BookOpen, Save, KeyRound, Shield
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────

const getPhotoUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('data:') || url.startsWith('http')) return url;
    return `${MEDIA_URL}/${url.replace(/\\/g, '/')}`;
};

const ROLE_LABELS = {
    ADMIN:            'Super Administrator',
    CE_PRTI:          'Chief Engineer · PRTI',
    HOD:              'Head of Department',
    MENTOR:           'Mentor',
    COMMITTEE_MEMBER: 'Committee Member',
};

// ── Small feedback banner ─────────────────────────────────────────────────────
const Feedback = ({ ok, msg, onClose }) => {
    useEffect(() => {
        const t = setTimeout(onClose, 4000);
        return () => clearTimeout(t);
    }, [onClose]);

    if (!msg) return null;
    return (
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border ${ok
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300'
            : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'}`}>
            {ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
            {msg}
        </div>
    );
};

// ── Field ─────────────────────────────────────────────────────────────────────
const Field = ({ label, icon: Icon, children }) => (
    <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
            {label}
        </label>
        <div className="relative flex items-center">
            {Icon && (
                <div className="absolute left-3 text-slate-400">
                    <Icon size={15} />
                </div>
            )}
            {children}
        </div>
    </div>
);

const inputCls = (hasIcon = true) =>
    `w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100
     py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors
     ${hasIcon ? 'pl-9 pr-4' : 'px-4'}`;

// ── Main page ─────────────────────────────────────────────────────────────────
const Profile = () => {
    const { user, refreshUser } = useAuth();

    // Profile form
    const [name,          setName]          = useState(user?.name          || '');
    const [phone,         setPhone]         = useState(user?.phone         || '');
    const [designation,   setDesignation]   = useState(user?.designation   || '');
    const [mentorField,   setMentorField]   = useState(user?.mentorField   || '');
    const [mentorLocation,setMentorLocation]= useState(user?.mentorLocation|| '');
    const [profileFb,     setProfileFb]     = useState(null);
    const [profileSaving, setProfileSaving] = useState(false);

    // Password form
    const [curPw,   setCurPw]   = useState('');
    const [newPw,   setNewPw]   = useState('');
    const [confPw,  setConfPw]  = useState('');
    const [showPw,  setShowPw]  = useState(false);
    const [pwFb,    setPwFb]    = useState(null);
    const [pwSaving,setPwSaving]= useState(false);

    // Photo
    const fileRef = useRef(null);
    const [photoUploading, setPhotoUploading] = useState(false);

    const isMentor = user?.role === 'MENTOR';

    const handleProfileSave = async (e) => {
        e.preventDefault();
        setProfileSaving(true);
        setProfileFb(null);
        try {
            const payload = { name, phone, designation };
            if (isMentor) { payload.mentorField = mentorField; payload.mentorLocation = mentorLocation; }
            await api.put('/auth/update-profile', payload);
            await refreshUser();
            setProfileFb({ ok: true, msg: 'Profile updated successfully.' });
        } catch (err) {
            setProfileFb({ ok: false, msg: err.response?.data?.message || 'Failed to update profile.' });
        } finally {
            setProfileSaving(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (newPw !== confPw) return setPwFb({ ok: false, msg: 'New passwords do not match.' });
        if (newPw.length < 8)  return setPwFb({ ok: false, msg: 'Password must be at least 8 characters.' });
        setPwSaving(true);
        setPwFb(null);
        try {
            await api.put('/auth/reset-password', { currentPassword: curPw, newPassword: newPw });
            setPwFb({ ok: true, msg: 'Password changed successfully.' });
            setCurPw(''); setNewPw(''); setConfPw('');
        } catch (err) {
            const errs = err.response?.data?.errors;
            const msg  = errs?.length ? errs.join(' ') : (err.response?.data?.message || 'Failed to change password.');
            setPwFb({ ok: false, msg });
        } finally {
            setPwSaving(false);
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const fd = new FormData();
        fd.append('photo', file);
        setPhotoUploading(true);
        try {
            await api.put('/auth/update-profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            await refreshUser();
        } catch {
            setProfileFb({ ok: false, msg: 'Failed to upload photo.' });
        } finally {
            setPhotoUploading(false);
            e.target.value = '';
        }
    };

    const initials = (user?.name || user?.email || '?').charAt(0).toUpperCase();
    const photoUrl  = getPhotoUrl(user?.photoUrl);

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Account Settings</p>
                <h1 className="text-3xl font-extrabold text-primary tracking-tight">My Profile</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── Left: identity card ───────────────────────────────── */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col items-center gap-5">

                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center overflow-hidden">
                                {photoUrl
                                    ? <img src={photoUrl} alt={user?.name} className="w-full h-full object-cover" />
                                    : <span className="text-3xl font-black text-primary">{initials}</span>}
                            </div>
                            <button
                                onClick={() => fileRef.current?.click()}
                                disabled={photoUploading}
                                title="Change photo"
                                className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-lg shadow-md border-2 border-white dark:border-slate-900 flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-60">
                                {photoUploading
                                    ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : <Camera size={13} />}
                            </button>
                            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                        </div>

                        {/* Name + role */}
                        <div className="text-center">
                            <p className="text-base font-black text-slate-900 dark:text-white">{user?.name || 'No name set'}</p>
                            <p className="text-xs font-bold text-primary mt-0.5">{ROLE_LABELS[user?.role] || user?.role}</p>
                        </div>

                        {/* Details */}
                        <div className="w-full space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                            {[
                                { icon: Mail,      label: user?.email },
                                { icon: Phone,     label: user?.phone      || '—' },
                                user?.department && { icon: Building2, label: user.department },
                                user?.designation && { icon: Briefcase, label: user.designation },
                                user?.mentorLocation && { icon: MapPin, label: user.mentorLocation },
                                user?.mentorField && { icon: BookOpen, label: user.mentorField },
                            ].filter(Boolean).map(({ icon: Icon, label }, i) => (
                                <div key={i} className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                                    <Icon size={14} className="text-slate-400 shrink-0" />
                                    <span className="truncate font-medium" title={label}>{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Right: forms ─────────────────────────────────────── */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Profile form */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                <User size={17} className="text-primary" />
                            </div>
                            <div>
                                <h2 className="text-sm font-black text-slate-900 dark:text-white">Edit Profile</h2>
                                <p className="text-[11px] text-slate-400 font-medium">Update your name, contact, and details</p>
                            </div>
                        </div>

                        {profileFb && <div className="mb-4"><Feedback ok={profileFb.ok} msg={profileFb.msg} onClose={() => setProfileFb(null)} /></div>}

                        <form onSubmit={handleProfileSave} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="Full Name" icon={User}>
                                    <input value={name} onChange={e => setName(e.target.value)}
                                        placeholder="Your full name" className={inputCls()} />
                                </Field>
                                <Field label="Phone Number" icon={Phone}>
                                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                                        placeholder="10-digit mobile number" className={inputCls()} />
                                </Field>
                            </div>

                            <Field label="Designation" icon={Briefcase}>
                                <input value={designation} onChange={e => setDesignation(e.target.value)}
                                    placeholder="e.g. Assistant Engineer, HOD" className={inputCls()} />
                            </Field>

                            {isMentor && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field label="Mentor Field" icon={BookOpen}>
                                        <input value={mentorField} onChange={e => setMentorField(e.target.value)}
                                            placeholder="e.g. Grid, Transmission" className={inputCls()} />
                                    </Field>
                                    <Field label="Mentor Location" icon={MapPin}>
                                        <input value={mentorLocation} onChange={e => setMentorLocation(e.target.value)}
                                            placeholder="e.g. Vijayawada HQ" className={inputCls()} />
                                    </Field>
                                </div>
                            )}

                            <div className="pt-1">
                                <button type="submit" disabled={profileSaving}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm">
                                    {profileSaving
                                        ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        : <Save size={15} />}
                                    Save Profile
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Change password form */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                                <Shield size={17} className="text-amber-600" />
                            </div>
                            <div>
                                <h2 className="text-sm font-black text-slate-900 dark:text-white">Change Password</h2>
                                <p className="text-[11px] text-slate-400 font-medium">Minimum 8 characters required</p>
                            </div>
                        </div>

                        {pwFb && <div className="mb-4"><Feedback ok={pwFb.ok} msg={pwFb.msg} onClose={() => setPwFb(null)} /></div>}

                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <Field label="Current Password" icon={Lock}>
                                <input type={showPw ? 'text' : 'password'} value={curPw}
                                    onChange={e => setCurPw(e.target.value)}
                                    placeholder="Enter current password" required className={inputCls()} />
                            </Field>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="New Password" icon={KeyRound}>
                                    <input type={showPw ? 'text' : 'password'} value={newPw}
                                        onChange={e => setNewPw(e.target.value)}
                                        placeholder="8+ characters" required className={inputCls()} />
                                </Field>
                                <Field label="Confirm Password" icon={KeyRound}>
                                    <div className="relative w-full">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><KeyRound size={15} /></div>
                                        <input type={showPw ? 'text' : 'password'} value={confPw}
                                            onChange={e => setConfPw(e.target.value)}
                                            placeholder="Re-enter new password" required className={inputCls() + ' pr-10'} />
                                        <button type="button" onClick={() => setShowPw(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                </Field>
                            </div>

                            {/* Strength hint when typing */}
                            {newPw && (
                                <div className="flex items-center gap-2 flex-wrap">
                                    {[
                                        { label: '8+ chars',   ok: newPw.length >= 8 },
                                        { label: 'Uppercase',  ok: /[A-Z]/.test(newPw) },
                                        { label: 'Number',     ok: /\d/.test(newPw) },
                                        { label: 'Matches',    ok: newPw === confPw && confPw.length > 0 },
                                    ].map(({ label, ok }) => (
                                        <span key={label} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ok
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300'
                                            : 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
                                            {ok ? '✓' : '·'} {label}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="pt-1">
                                <button type="submit" disabled={pwSaving}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white text-sm font-bold rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50 shadow-sm">
                                    {pwSaving
                                        ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        : <Lock size={15} />}
                                    Update Password
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
