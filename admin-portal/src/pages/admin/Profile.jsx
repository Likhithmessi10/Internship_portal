import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api, { MEDIA_URL } from '../../utils/api';
import { User, Mail, Shield, Building, Lock, Eye, EyeOff, Save, KeyRound, Camera, Upload } from 'lucide-react';
import WarningCard from '../../components/ui/WarningCard';

const Profile = () => {
    const { user, login: refreshUser } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const fileInputRef = useRef(null);

    const getMediaUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('data:')) return url;
        if (url.startsWith('http')) return url;
        return `${MEDIA_URL}/${url.replace(/\\/g, '/')}`;
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            return setFeedback({ type: 'warning', text: 'New passwords do not match' });
        }
        
        setLoading(true);
        try {
            await api.put('/auth/reset-password', { currentPassword, newPassword });
            setFeedback({ type: 'success', text: 'Password updated successfully!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to update password' });
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            return setFeedback({ type: 'error', text: 'Please upload an image file' });
        }

        const formData = new FormData();
        formData.append('photo', file);

        setUploading(true);
        try {
            const res = await api.put('/auth/update-profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            // Update auth context with new user data
            if (res.data.success) {
                // We need to update the local user object in context
                // If AuthContext doesn't expose a way to update the user without re-logging,
                // we might need to add it. For now, we'll assume it handles it or we'll refresh tokens.
                setFeedback({ type: 'success', text: 'Profile photo updated!' });
                window.location.reload(); // Quick fix to refresh user data from token/session
            }
        } catch (err) {
            setFeedback({ type: 'error', text: 'Failed to upload photo' });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {feedback && <WarningCard 
                message={feedback.text} 
                onClose={() => setFeedback(null)} 
                duration={5000}
            />}

            <div className="flex justify-between items-end">
                <div>
                    <span className="text-[10px] font-black tracking-[0.2em] text-outline uppercase mb-1 block opacity-60">Identity & Security</span>
                    <h2 className="text-3xl font-black text-primary tracking-tight">Personal Workspace</h2>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* User Info Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-outline-variant/10 shadow-xl shadow-primary/5 text-center relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-primary/0 scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
                        
                        <div className="relative w-32 h-32 mx-auto mb-6 group/avatar">
                            <div className="w-full h-full rounded-full bg-primary/10 border-4 border-primary/20 flex items-center justify-center overflow-hidden transition-transform duration-500 group-hover:scale-105">
                                {user?.photoUrl ? (
                                    <img src={getMediaUrl(user.photoUrl)} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-4xl font-black text-primary uppercase">{user?.name?.charAt(0) || user?.email?.charAt(0)}</span>
                                )}
                            </div>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="absolute bottom-0 right-0 w-10 h-10 bg-primary text-white rounded-xl shadow-lg border-2 border-white dark:border-slate-900 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                            >
                                {uploading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <Camera size={18} />
                                )}
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*"
                                onChange={handlePhotoUpload}
                            />
                        </div>
                        
                        <h3 className="text-xl font-black text-primary mb-1 tracking-tight">{user?.name || 'Authorized User'}</h3>
                        <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-6">{user?.role?.replace('_', ' ')}</p>
                        
                        <div className="space-y-3 pt-6 border-t border-outline-variant/10">
                            <div className="flex items-center gap-3 text-left p-3 rounded-xl hover:bg-primary/5 transition-colors">
                                <Mail size={16} className="text-primary/60" />
                                <div className="min-w-0">
                                    <p className="text-[9px] font-black text-outline uppercase tracking-tight">Email Address</p>
                                    <p className="text-xs font-bold text-primary truncate">{user?.email}</p>
                                </div>
                            </div>
                            
                            {user?.department && (
                                <div className="flex items-center gap-3 text-left p-3 rounded-xl hover:bg-primary/5 transition-colors">
                                    <Building size={16} className="text-primary/60" />
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-black text-outline uppercase tracking-tight">Department</p>
                                        <p className="text-xs font-bold text-primary truncate">{user?.department}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Security/Password Form */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 border border-outline-variant/10 shadow-xl shadow-primary/5 relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                <Shield size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-primary tracking-tight">Authentication Security</h3>
                                <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Update your system credentials</p>
                            </div>
                        </div>

                        <form onSubmit={handleResetPassword} className="space-y-6">
                            <div className="space-y-4">
                                <div className="relative">
                                    <label className="text-[10px] font-black text-outline uppercase tracking-[0.15em] ml-1 mb-2 block">Current Password</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-outline/40 group-focus-within:text-primary transition-colors">
                                            <Lock size={16} />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl pl-12 pr-12 py-4 text-xs font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                            placeholder="Enter existing password"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                    <div className="relative">
                                        <label className="text-[10px] font-black text-outline uppercase tracking-[0.15em] ml-1 mb-2 block">New Password</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-outline/40 group-focus-within:text-primary transition-colors">
                                                <KeyRound size={16} />
                                            </div>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl pl-12 py-4 text-xs font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                placeholder="8+ characters"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <label className="text-[10px] font-black text-outline uppercase tracking-[0.15em] ml-1 mb-2 block">Confirm Password</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-outline/40 group-focus-within:text-primary transition-colors">
                                                <KeyRound size={16} />
                                            </div>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl pl-12 pr-12 py-4 text-xs font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                placeholder="Re-type new password"
                                                required
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-outline/40 hover:text-primary transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-8 disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Commit Password Change
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
