import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import { FileText, Briefcase, GraduationCap, MapPin, AlertCircle } from 'lucide-react';

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
                // If 404, profile not found, which is fine initially
                console.log("No profile yet", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) return <div className="text-center py-10">Loading...</div>;

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-secondary">Student Dashboard</h1>
                <Link to="/internships" className="btn-primary flex items-center gap-2">
                    <Briefcase size={20} />
                    Browse Internships
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1 md:col-span-2">
                    <div className="card mb-6">
                        <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <GraduationCap className="text-primary" />
                                Your Profile
                            </h2>
                            <Link to="/student/profile/edit" className="text-primary hover:underline font-medium text-sm">
                                {profile ? 'Edit Profile' : 'Complete Profile'}
                            </Link>
                        </div>

                        {profile ? (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted">Full Name</p>
                                    <p className="font-medium text-lg">{profile.fullName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted">College</p>
                                    <p className="font-medium truncate">{profile.collegeName} ({profile.collegeCategory})</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted">Branch & Year</p>
                                    <p className="font-medium">{profile.branch}, Year {profile.yearOfStudy}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted">CGPA</p>
                                    <p className="font-medium">{profile.cgpa}</p>
                                </div>
                                <div className="col-span-2 mt-2 pt-4 border-t border-gray-100">
                                    <p className="flex items-center gap-2 text-sm">
                                        <MapPin size={16} className="text-muted" />
                                        {profile.address}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-yellow-50 p-6 rounded-md flex items-start gap-4 border border-yellow-200">
                                <AlertCircle className="text-yellow-500 shrink-0 mt-1" />
                                <div>
                                    <h3 className="font-semibold text-yellow-800">Profile Incomplete</h3>
                                    <p className="text-yellow-700 text-sm mt-1">
                                        You need to complete your profile before you can apply to any internships.
                                        This includes your educational background and CGPA.
                                    </p>
                                    <Link to="/student/profile/edit" className="btn-primary inline-block mt-4 px-4 py-2 text-sm shadow-none">
                                        Complete Profile Now
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="col-span-1">
                    <div className="card">
                        <h2 className="text-xl font-semibold mb-4 border-b border-gray-100 pb-4 flex items-center gap-2">
                            <FileText className="text-primary" />
                            My Applications
                        </h2>

                        {!profile?.applications || profile.applications.length === 0 ? (
                            <p className="text-muted text-center py-6 text-sm">You haven't applied to any internships yet.</p>
                        ) : (
                            <div className="space-y-4">
                                {profile.applications.map(app => (
                                    <div key={app.id} className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-medium text-secondary">Internship ID: {app.internshipId.slice(0, 8)}</span>
                                            <span className={`text-xs px-2 py-1 rounded-full font-semibold
                                                ${app.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                    app.status === 'SHORTLISTED' ? 'bg-blue-100 text-blue-800' :
                                                        app.status === 'HIRED' ? 'bg-green-100 text-green-800' :
                                                            'bg-red-100 text-red-800'
                                                }`}>
                                                {app.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted">Applied: {new Date(app.createdAt).toLocaleDateString()}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
