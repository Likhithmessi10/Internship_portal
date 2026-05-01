import React, { useState } from 'react';
import { ArrowLeft, Users, ClipboardList, FileText, Calendar } from 'lucide-react';
import InternsTab from './tabs/InternsTab';
import TasksTab from './tabs/TasksTab';
import SubmissionsTab from './tabs/SubmissionsTab';
import AttendanceTab from './tabs/AttendanceTab';

const tabs = [
    { key: 'interns', label: 'Interns', icon: Users },
    { key: 'tasks', label: 'Tasks', icon: ClipboardList },
    { key: 'submissions', label: 'Submissions', icon: FileText },
    { key: 'attendance', label: 'Attendance', icon: Calendar },
];

const InternshipDetailView = ({ internship, onBack }) => {
    const [activeTab, setActiveTab] = useState('interns');

    return (
        <div className="space-y-6">
            {/* Back Button + Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
                >
                    <ArrowLeft size={18} className="text-slate-600 dark:text-slate-400" />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{internship.title}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {internship.department} • {internship.internCount} intern{internship.internCount !== 1 ? 's' : ''} • {internship.status}
                    </p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-1.5 inline-flex gap-1 shadow-sm">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                isActive
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                        >
                            <Icon size={16} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm min-h-[400px]">
                {activeTab === 'interns' && <InternsTab internshipId={internship.id} />}
                {activeTab === 'tasks' && <TasksTab internshipId={internship.id} />}
                {activeTab === 'submissions' && <SubmissionsTab internshipId={internship.id} />}
                {activeTab === 'attendance' && <AttendanceTab internshipId={internship.id} />}
            </div>
        </div>
    );
};

export default InternshipDetailView;
