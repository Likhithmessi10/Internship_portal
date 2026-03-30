import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../utils/api';
import { Users, Video, Calendar, Clock, Link as LinkIcon, Mail } from 'lucide-react';

const MentorMeetings = () => {
    const { user } = useAuth();
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMeetings = async () => {
            try {
                // Get committees where this mentor is a member
                const committeesRes = await api.get('/admin/committees');
                const allCommittees = committeesRes.data.data || [];
                const mentorCommittees = allCommittees.filter(c => c.mentorId === user.id);

                setMeetings(mentorCommittees.map(committee => ({
                    id: committee.id,
                    title: `Committee Meeting - ${committee.internship?.title || 'Internship'}`,
                    date: committee.interviewDate,
                    link: committee.meetLink,
                    interns: committee.interns || [],
                    members: committee.membersData || {}
                })));
            } catch (err) {
                console.error('Failed to fetch meetings', err);
            } finally {
                setLoading(false);
            }
        };
        fetchMeetings();
    }, [user.id]);

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Meetings</h1>
                    <p className="text-slate-500 dark:text-gray-400 mt-1">Committee meetings and schedules</p>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" />
                </div>
            ) : meetings.length === 0 ? (
                <div className="admin-card p-16 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/8 flex items-center justify-center mx-auto mb-6">
                        <Video size={40} className="text-slate-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">No Meetings Scheduled</h3>
                    <p className="text-slate-500 dark:text-gray-400">There are no committee meetings scheduled at this time.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {meetings.map(meeting => (
                        <div key={meeting.id} className="admin-card">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-blue-500/10 border border-indigo-100 dark:border-blue-500/20 flex items-center justify-center">
                                        <Video size={24} className="text-indigo-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{meeting.title}</h3>
                                        <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">Committee Evaluation</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 mb-6">
                                {meeting.date && (
                                    <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-gray-400">
                                        <Calendar size={16} />
                                        <span>{new Date(meeting.date).toLocaleDateString()}</span>
                                    </div>
                                )}
                                {meeting.link && (
                                    <div className="flex items-center gap-3 text-sm text-blue-400">
                                        <LinkIcon size={16} />
                                        <a href={meeting.link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                            Join Meeting
                                        </a>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-gray-400">
                                    <Users size={16} />
                                    <span>{meeting.interns?.length || 0} Interns</span>
                                </div>
                            </div>

                            {meeting.link && (
                                <a
                                    href={meeting.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                                >
                                    <Video size={18} /> Join Now
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MentorMeetings;
