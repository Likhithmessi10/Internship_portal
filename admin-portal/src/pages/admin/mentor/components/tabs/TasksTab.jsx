import React, { useState, useEffect } from 'react';
import api from '../../../../../utils/api';
import {
    Send, Calendar, ClipboardList, Users, Check, Plus, X, ChevronDown
} from 'lucide-react';

const TasksTab = ({ internshipId }) => {
    const [tasks, setTasks] = useState([]);
    const [interns, setInterns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [assignMode, setAssignMode] = useState('all'); // 'all' or 'selected'
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [formData, setFormData] = useState({ title: '', description: '', deadline: '' });

    const fetchTasks = async () => {
        try {
            const res = await api.get(`/mentor/tasks?internshipId=${internshipId}`);
            setTasks(res.data.data);
        } catch (err) {
            console.error('Failed to fetch tasks:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchInterns = async () => {
        try {
            const res = await api.get(`/mentor/internships/${internshipId}/interns?limit=100`);
            setInterns(res.data.data);
        } catch (err) {
            console.error('Failed to fetch interns for selection:', err);
        }
    };

    useEffect(() => {
        fetchTasks();
        fetchInterns();
    }, [internshipId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                internshipId,
                title: formData.title,
                description: formData.description,
                deadline: formData.deadline || undefined,
                studentIds: assignMode === 'selected' ? selectedStudents : undefined
            };
            await api.post('/mentor/tasks', payload);
            setFormData({ title: '', description: '', deadline: '' });
            setShowForm(false);
            setSelectedStudents([]);
            setAssignMode('all');
            fetchTasks();
        } catch (err) {
            console.error('Failed to create task:', err);
            alert(err.response?.data?.message || 'Failed to create task');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleStudent = (studentId) => {
        setSelectedStudents(prev =>
            prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
        );
    };

    // Group tasks by title to show bulk assignment counts
    const groupedTasks = tasks.reduce((acc, task) => {
        const key = `${task.title}_${task.createdAt.slice(0, 16)}`;
        if (!acc[key]) {
            acc[key] = { ...task, assignedCount: 1, students: [task.student?.fullName] };
        } else {
            acc[key].assignedCount++;
            acc[key].students.push(task.student?.fullName);
        }
        return acc;
    }, {});

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">{tasks.length} task(s) assigned</p>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/20"
                >
                    {showForm ? <X size={14} /> : <Plus size={14} />}
                    {showForm ? 'Cancel' : 'New Task'}
                </button>
            </div>

            {/* Create Task Form */}
            {showForm && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-lg animate-in slide-in-from-top duration-200">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <ClipboardList size={16} className="text-indigo-500" /> Create New Task
                    </h4>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">Title</label>
                            <input
                                required
                                type="text"
                                placeholder="e.g., Network Configuration Analysis"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">Description</label>
                            <textarea
                                required
                                rows="3"
                                placeholder="Describe the task objectives and expected outcomes..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">Deadline (Optional)</label>
                            <div className="relative">
                                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="date"
                                    value={formData.deadline}
                                    onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                                    className="w-full p-3 pl-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                            </div>
                        </div>

                        {/* Assign Mode */}
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">Assign To</label>
                            <div className="flex gap-3 mb-3">
                                <button
                                    type="button"
                                    onClick={() => { setAssignMode('all'); setSelectedStudents([]); }}
                                    className={`flex-1 py-3 rounded-xl border-2 text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                        assignMode === 'all'
                                            ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-300'
                                    }`}
                                >
                                    <Users size={14} /> All Interns
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAssignMode('selected')}
                                    className={`flex-1 py-3 rounded-xl border-2 text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                        assignMode === 'selected'
                                            ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-300'
                                    }`}
                                >
                                    <Check size={14} /> Select Interns
                                </button>
                            </div>

                            {assignMode === 'selected' && (
                                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 max-h-40 overflow-y-auto space-y-1">
                                    {interns.map(intern => (
                                        <label
                                            key={intern.studentId}
                                            className="flex items-center gap-3 p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedStudents.includes(intern.studentId)}
                                                onChange={() => toggleStudent(intern.studentId)}
                                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{intern.student.fullName}</span>
                                            <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">{intern.student.collegeName}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={submitting || (assignMode === 'selected' && selectedStudents.length === 0)}
                            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 text-sm"
                        >
                            {submitting ? (
                                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                            ) : (
                                <>
                                    <Send size={16} />
                                    Assign Task {assignMode === 'all' ? `to All (${interns.length})` : `to ${selectedStudents.length} Selected`}
                                </>
                            )}
                        </button>
                    </form>
                </div>
            )}

            {/* Tasks List */}
            {tasks.length === 0 ? (
                <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center mx-auto mb-4">
                        <ClipboardList size={32} className="text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Tasks Yet</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Create your first task to get started.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {tasks.map(task => (
                        <div key={task.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:shadow-md transition-all">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{task.title}</h4>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            task.status === 'COMPLETED' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                            : task.status === 'PENDING' ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                            : 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                        }`}>
                                            {task.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{task.description}</p>
                                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 dark:text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Users size={11} /> {task.student?.fullName || 'N/A'}
                                        </span>
                                        {task.dueDate && (
                                            <span className="flex items-center gap-1">
                                                <Calendar size={11} /> {new Date(task.dueDate).toLocaleDateString()}
                                            </span>
                                        )}
                                        <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {task.submissions?.length > 0 ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-bold">
                                            <Check size={12} /> Submitted
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-lg text-[10px] font-bold">
                                            Pending
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TasksTab;
