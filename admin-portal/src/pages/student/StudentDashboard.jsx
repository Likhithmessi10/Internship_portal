import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Link } from 'react-router-dom';
import { FileText, Briefcase, GraduationCap, MapPin, AlertCircle, CheckCircle, Clock, ShieldCheck, Zap, Award, BookOpen, User } from 'lucide-react';

const StudentDashboard = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/students/profile');
                setProfile(res.data.data);
            } catch (error) {
                console.log("No profile yet", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-900 rounded-3xl p-8 mb-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-500 opacity-10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        {profile?.photoUrl ? (
                            <img src={profile.photoUrl} alt="Profile" className="w-24 h-24 rounded-full border-4 border-white/20 shadow-xl object-cover" />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-white/10 border-4 border-white/20 flex items-center justify-center backdrop-blur-sm">
                                <span className="text-3xl font-bold">{profile?.fullName?.charAt(0) || user?.email?.charAt(0).toUpperCase()}</span>
                            </div>
                        )}
                        <div>
                            <h1 className="text-3xl font-black font-rajdhani mb-1 text-white flex items-center gap-3">
                                Welcome, {profile ? profile.fullName.split(' ')[0] : 'Student'}! 👋
                            </h1>
                            <p className="text-indigo-200 font-medium">Ready to charge up your career with APTRANSCO?</p>
                        </div>
                    </div>
                    <div>
                        {!profile ? (
                            <Link to="/student/profile/edit" className="bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold py-3 px-6 rounded-xl transition-all shadow-lg flex items-center gap-2">
                                <Zap className="w-5 h-5" /> Complete Your Profile
                            </Link>
                        ) : (
                            <Link to="/student/internships" className="bg-white hover:bg-gray-50 text-indigo-900 font-bold py-3 px-6 rounded-xl transition-all shadow-lg flex items-center gap-2">
                                <Briefcase className="w-5 h-5" /> Browse Internships
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {!profile && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8 flex items-start gap-4 shadow-sm">
                    <AlertCircle className="text-amber-500 w-6 h-6 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-amber-800 font-bold text-lg mb-1">Action Required: Profile Incomplete</h3>
                        <p className="text-amber-700 text-sm mb-4">You must complete your profile with your academic and personal details before you can apply for internships.</p>
                        <Link to="/student/profile/edit" className="btn-primary py-2 px-4 shadow-none inline-flex">Setup Profile Now</Link>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column (Activities & Tracking) */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* APTRANSCO Privileges */}
                    <div>
                        <h2 className="text-xl font-bold font-rajdhani mb-4 flex items-center gap-2 text-gray-800">
                            <ShieldCheck className="text-indigo-600" /> Member Privileges
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                <Award className="w-8 h-8 text-indigo-600 mb-3" />
                                <h3 className="font-bold text-indigo-900 text-sm mb-1">Govt. Certification</h3>
                                <p className="text-xs text-indigo-700/70 font-medium">Earn recognized certificates upon successful completion.</p>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                <Zap className="w-8 h-8 text-emerald-600 mb-3" />
                                <h3 className="font-bold text-emerald-900 text-sm mb-1">Live Grid Projects</h3>
                                <p className="text-xs text-emerald-700/70 font-medium">Work on real-world power transmission data.</p>
                            </div>
                            <div className="bg-gradient-to-br from-amber-50 to-white border border-amber-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                <BookOpen className="w-8 h-8 text-amber-600 mb-3" />
                                <h3 className="font-bold text-amber-900 text-sm mb-1">Expert Mentorship</h3>
                                <p className="text-xs text-amber-700/70 font-medium">Learn directly from senior APTRANSCO engineers.</p>
                            </div>
                        </div>
                    </div>

                    {/* Application Tracking */}
                    <div className="card border-0 shadow-lg shadow-gray-200/50">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold font-rajdhani flex items-center gap-2 text-gray-800">
                                <Clock className="text-indigo-600" /> Application Journey
                            </h2>
                        </div>

                        {!profile?.applications || profile.applications.length === 0 ? (
                            <div className="text-center py-10 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium text-sm">You haven't applied to any internships yet.</p>
                                <p className="text-gray-400 text-xs mt-1">Visit the internships tab to find opportunities.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {profile.applications.map(app => (
                                    <div key={app.id} className="p-5 border border-gray-100 rounded-xl hover:bg-indigo-50/30 transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-4 group">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="font-bold text-gray-900">{app.internship?.title || 'Internship Position'}</h4>
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider
                                                    ${app.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                                                        app.status === 'SHORTLISTED' ? 'bg-indigo-100 text-indigo-800' :
                                                            app.status === 'HIRED' ? 'bg-emerald-100 text-emerald-800' :
                                                                'bg-red-100 text-red-800'
                                                    }`}>
                                                    {app.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 font-medium flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5" /> {app.internship?.location || 'APTRANSCO'} • Applied on {new Date(app.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-sm font-bold text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform cursor-pointer">
                                            View Details <span className="text-lg">→</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column (Profile Summary) */}
                <div className="lg:col-span-1">
                    <div className="card sticky top-24 border-0 shadow-lg shadow-gray-200/50">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold font-rajdhani flex items-center gap-2 text-gray-800">
                                <User className="text-indigo-600" /> Profile Glance
                            </h2>
                            <Link to="/student/profile/edit" className="text-indigo-600 hover:text-indigo-800 text-sm font-bold">Edit</Link>
                        </div>

                        {profile ? (
                            <div className="space-y-6">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Roll Number</p>
                                    <p className="font-semibold text-gray-900 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-100 inline-block font-mono text-sm">{profile.rollNumber}</p>
                                </div>
                                <div className="border-t border-gray-100 pt-4">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Academic Setup</p>
                                    <p className="font-bold text-gray-900">{profile.collegeName}</p>
                                    <p className="text-sm text-gray-600 font-medium mt-1">{profile.branch} • Year {profile.yearOfStudy}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">CGPA</p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-full bg-gray-100 rounded-full h-2">
                                                <div className="bg-emerald-500 h-2 rounded-full" style={{width: `${(profile.cgpa / 10) * 100}%`}}></div>
                                            </div>
                                            <span className="font-bold text-gray-900 text-sm">{profile.cgpa}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Aadhaar</p>
                                        <p className="font-bold text-gray-900 text-sm">XXXX-{(profile.aadhar || profile.aadhaarNumber || '').slice(-4)}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <User className="w-8 h-8 text-gray-300" />
                                </div>
                                <p className="text-sm text-gray-500 font-medium">Construct your profile to track metrics here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
