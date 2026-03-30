import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import api from '../../../utils/api';
import {
    BarChart2, Download, Filter,
    PieChart, Layers, Calendar, ChevronRight,
    ArrowUpRight, Database, TrendingUp,
    X, FileSpreadsheet, Clock, CheckCircle, XCircle, Users, Building
} from 'lucide-react';

const PrtiReports = () => {
    const [stats, setStats] = useState({
        totalInternships: 0,
        totalApplications: 0,
        hiredPercentage: 0
    });
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        internshipId: '',
        status: 'All',
        tier: 'All'
    });
    const [internships, setInternships] = useState([]);
    const [allApplications, setAllApplications] = useState([]);
    const [colleges, setColleges] = useState([]);
    const [departments, setDepartments] = useState([]);

    // Timeline Report State
    const [showTimelineModal, setShowTimelineModal] = useState(false);
    const [timelineFilters, setTimelineFilters] = useState({
        startDate: '',
        endDate: '',
        status: 'All',
        college: 'All',
        department: 'All',
        internshipId: 'All'
    });
    const [timelineLoading, setTimelineLoading] = useState(false);
    const [timelineStats, setTimelineStats] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await api.get('/admin/internships');
                const all = res.data.data || [];
                setInternships(all);

                const totalApps = all.reduce((acc, i) => acc + (i.applicationsCount || 0), 0);
                const totalHired = all.reduce((acc, i) => acc + (i.hiredCount || 0), 0);

                setStats({
                    totalInternships: all.length,
                    totalApplications: totalApps,
                    hiredPercentage: totalApps > 0 ? Math.round((totalHired / totalApps) * 100) : 0
                });
            } catch (err) {
                console.error('Failed to fetch reports data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Fetch all applications for timeline report
    const fetchAllApplications = async () => {
        try {
            setTimelineLoading(true);
            const responses = await Promise.all(
                internships.map(internship =>
                    api.get(`/admin/internships/${internship.id}/applications`)
                )
            );
            const allApps = responses.flatMap(res => res.data.data || []);
            setAllApplications(allApps);

            // Extract unique colleges and departments
            const uniqueColleges = [...new Set(allApps.map(app =>
                app.student?.collegeName || app.student?.institution_name || 'Unknown'
            ).filter(Boolean))];
            const uniqueDepartments = [...new Set(allApps.map(app =>
                app.student?.branch || app.student?.department || app.student?.domain || 'Unknown'
            ).filter(Boolean))];

            setColleges(uniqueColleges);
            setDepartments(uniqueDepartments);
        } catch (err) {
            console.error('Failed to fetch applications', err);
        } finally {
            setTimelineLoading(false);
        }
    };

    // Calculate timeline stats based on filters
    const calculateTimelineStats = () => {
        let filtered = allApplications;

        // Date filter
        if (timelineFilters.startDate) {
            filtered = filtered.filter(app => new Date(app.createdAt) >= new Date(timelineFilters.startDate));
        }
        if (timelineFilters.endDate) {
            const endDate = new Date(timelineFilters.endDate);
            endDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(app => new Date(app.createdAt) <= endDate);
        }

        // Status filter
        if (timelineFilters.status !== 'All') {
            filtered = filtered.filter(app => app.status === timelineFilters.status);
        }

        // College filter
        if (timelineFilters.college !== 'All') {
            filtered = filtered.filter(app =>
                (app.student?.collegeName || app.student?.institution_name) === timelineFilters.college
            );
        }

        // Department filter
        if (timelineFilters.department !== 'All') {
            filtered = filtered.filter(app =>
                (app.student?.branch || app.student?.department || app.student?.domain) === timelineFilters.department
            );
        }

        // Internship filter
        if (timelineFilters.internshipId !== 'All') {
            filtered = filtered.filter(app => app.internshipId === timelineFilters.internshipId);
        }

        // Calculate stats
        const statusCounts = filtered.reduce((acc, app) => {
            acc[app.status] = (acc[app.status] || 0) + 1;
            return acc;
        }, {});

        const collegeCounts = filtered.reduce((acc, app) => {
            const college = app.student?.collegeName || app.student?.institution_name || 'Unknown';
            acc[college] = (acc[college] || 0) + 1;
            return acc;
        }, {});

        const departmentCounts = filtered.reduce((acc, app) => {
            const dept = app.student?.branch || app.student?.department || app.student?.domain || 'Unknown';
            acc[dept] = (acc[dept] || 0) + 1;
            return acc;
        }, {});

        setTimelineStats({
            total: filtered.length,
            statusCounts,
            collegeCounts,
            departmentCounts,
            filteredData: filtered
        });
    };

    // Handle Timeline Report Open
    const handleTimelineReportClick = async () => {
        setShowTimelineModal(true);
        if (allApplications.length === 0) {
            await fetchAllApplications();
        }
    };

    // Handle Timeline Filter Change
    const handleTimelineFilterChange = (key, value) => {
        setTimelineFilters(prev => ({ ...prev, [key]: value }));
    };

    // Apply Timeline Filters
    const handleApplyTimelineFilters = () => {
        calculateTimelineStats();
    };

    // Export Timeline Report to Excel
    const handleTimelineExport = () => {
        if (!timelineStats || timelineStats.filteredData.length === 0) {
            alert('No data to export. Please apply filters first.');
            return;
        }

        const data = timelineStats.filteredData;

        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();

        // Main Data Sheet
        const headers = ['S.No', 'Tracking ID', 'Name', 'Email', 'Phone', 'College', 'Department', 'Year', 'CGPA', 'Status', 'Applied Date', 'SOP', 'Preferred Location', 'Assigned Role'];
        const worksheetData = [headers];

        data.forEach((app, idx) => {
            const s = app.student;
            worksheetData.push([
                idx + 1,
                app.trackingId || '',
                s?.fullName || s?.name || s?.user?.name || '',
                s?.user?.email || s?.email || '',
                s?.phone || '',
                s?.collegeName || s?.institution_name || '',
                s?.branch || s?.department || s?.domain || '',
                s?.yearOfStudy || '',
                s?.cgpa || '',
                app.status || '',
                app.createdAt ? new Date(app.createdAt).toLocaleDateString('en-IN') : '',
                app.sop ? 'Yes' : 'No',
                app.preferredLocation || '',
                app.assignedRole || ''
            ]);
        });

        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

        // Set column widths
        worksheet['!cols'] = [
            { wch: 6 }, { wch: 22 }, { wch: 30 }, { wch: 30 }, { wch: 15 },
            { wch: 40 }, { wch: 20 }, { wch: 8 }, { wch: 8 }, { wch: 20 },
            { wch: 15 }, { wch: 8 }, { wch: 25 }, { wch: 25 }
        ];

        // Style header row
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const address = XLSX.utils.encode_col(C) + "1";
            if (!worksheet[address]) continue;
            worksheet[address].s = {
                font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
                fill: { fgColor: { rgb: "003087" } },
                alignment: { horizontal: "center", vertical: "center" }
            };
        }

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications');

        // Summary Sheet
        const summaryData = [
            ['Timeline Report Summary'],
            ['Generated On', new Date().toLocaleString('en-IN')],
            [],
            ['Date Range', timelineFilters.startDate ? `${new Date(timelineFilters.startDate).toLocaleDateString('en-IN')}` : 'All Time', timelineFilters.endDate ? `to ${new Date(timelineFilters.endDate).toLocaleDateString('en-IN')}` : ''],
            [],
            ['Total Applications', timelineStats.total],
            [],
            ['Status Breakdown']
        ];

        Object.entries(timelineStats.statusCounts).forEach(([status, count]) => {
            summaryData.push([`  ${status}`, count]);
        });

        summaryData.push([], ['College-wise Breakdown']);
        Object.entries(timelineStats.collegeCounts).slice(0, 20).forEach(([college, count]) => {
            summaryData.push([`  ${college}`, count]);
        });

        summaryData.push([], ['Department-wise Breakdown']);
        Object.entries(timelineStats.departmentCounts).forEach(([dept, count]) => {
            summaryData.push([`  ${dept}`, count]);
        });

        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        summarySheet['!cols'] = [{ wch: 40 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `Timeline_Report_${timestamp}.xlsx`;

        // Download
        XLSX.writeFile(workbook, filename);
    };

    const handleAdvancedExport = async () => {
        try {
            if (!filters.internshipId) {
                alert('Please select an internship program first');
                return;
            }

            const res = await api.get(`/admin/internships/${filters.internshipId}/applications`);
            const data = res.data.data || [];

            const headers = ['Name', 'Email', 'College', 'Department', 'Status', 'Applied Date'];
            const csvContent = [
                headers.join(','),
                ...data.map(app =>
                    [
                        app.student?.fullName || app.student?.name || app.student?.user?.name || '',
                        app.student?.user?.email || app.student?.email || '',
                        app.student?.collegeName || app.student?.college || app.student?.institution_name || '',
                        app.student?.branch || app.student?.department || app.student?.domain || '',
                        app.status || '',
                        app.createdAt ? new Date(app.createdAt).toLocaleDateString() : ''
                    ].map(field => `"${field}"`).join(',')
                )
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `applications-report-${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
        } catch (err) {
            console.error('Failed to export data', err);
            alert('Failed to export data. Please try again.');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        </div>
    );

    return (
        <div className="space-y-10">
            <header className="flex justify-between items-end">
                <div>
                    <span className="text-[10px] font-bold tracking-[0.2em] text-outline uppercase mb-1 block">Analytics Dashboard</span>
                    <h2 className="text-4xl font-extrabold text-primary tracking-tight">Institutional Reports</h2>
                </div>
            </header>

            {/* Quick Metrics */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/10 shadow-sm group">
                    <div className="w-12 h-12 rounded-2xl bg-primary-container/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                        <Layers size={24} />
                    </div>
                    <span className="text-[10px] font-black tracking-widest uppercase text-outline block mb-1">Cycle Aggregation</span>
                    <h2 className="text-4xl font-black text-primary tracking-tighter">{stats.totalInternships} Active Programs</h2>
                    <p className="text-[10px] font-medium text-outline mt-2 leading-relaxed italic">Across all specialized institutional departments</p>
                </div>
                <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/10 shadow-sm group">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
                        <BarChart2 size={24} />
                    </div>
                    <span className="text-[10px] font-black tracking-widest uppercase text-outline block mb-1">Global Applicants</span>
                    <h2 className="text-4xl font-black text-primary tracking-tighter">{stats.totalApplications.toLocaleString()} Total Talent Pool</h2>
                    <p className="text-[10px] font-medium text-outline mt-2 leading-relaxed italic">Cumulative applications received for 2024 academic year</p>
                </div>
                <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/10 shadow-sm group">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                        <PieChart size={24} />
                    </div>
                    <span className="text-[10px] font-black tracking-widest uppercase text-outline block mb-1">Success Yield</span>
                    <h2 className="text-4xl font-black text-primary tracking-tighter">{stats.hiredPercentage}% Selection Rate</h2>
                    <p className="text-[10px] font-medium text-outline mt-2 leading-relaxed italic">Merit-based conversion from initial application pool</p>
                </div>
            </section>

            {/* Dynamic Export Generator */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <section className="lg:col-span-2 space-y-8">
                    <div className="bg-surface-container-low p-10 rounded-4xl border border-outline-variant/20 shadow-premium relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-3xl font-black text-primary tracking-tight mb-4">Export Engine</h3>
                            <p className="text-xs font-medium text-outline mb-10 max-w-lg leading-relaxed italic border-l-4 border-primary/20 pl-4 uppercase tracking-[0.05em]">Generate dynamic institutional reports with synchronized student data, role assignments, and recruitment timelines.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1 italic">Target Program</label>
                                    <select
                                        className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-4 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/10 shadow-subtle appearance-none cursor-pointer group"
                                        value={filters.internshipId}
                                        onChange={(e) => setFilters({ ...filters, internshipId: e.target.value })}
                                    >
                                        <option value="">--Select Program--</option>
                                        {internships.map(i => <option key={i.id} value={i.id}>{i?.title || 'Untitled'}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1 italic">Talent Tier</label>
                                    <select
                                        className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-4 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/10 shadow-subtle appearance-none cursor-pointer"
                                        value={filters.tier}
                                        onChange={(e) => setFilters({ ...filters, tier: e.target.value })}
                                    >
                                        <option value="All">All Categories</option>
                                        <option value="IIT">IIT Tier</option>
                                        <option value="NIT">NIT Tier</option>
                                        <option value="IIIT">IIIT Tier</option>
                                        <option value="STATE">State Govt</option>
                                        <option value="PRIVATE">Private University</option>
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1 italic">Recruitment Status</label>
                                    <select
                                        className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-4 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/10 shadow-subtle appearance-none cursor-pointer"
                                        value={filters.status}
                                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                    >
                                        <option value="All">All Stages</option>
                                        <option value="HIRED">Successfully Hired</option>
                                        <option value="PENDING">Under Review</option>
                                        <option value="SHORTLISTED">Interview Phase</option>
                                        <option value="REJECTED">Archived</option>
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <button
                                        onClick={handleAdvancedExport}
                                        className="w-full bg-primary text-white py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-primary-container shadow-premium transition-all flex items-center justify-center gap-3"
                                    >
                                        <Download size={18} /> Download Data <ArrowUpRight size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
                    </div>
                </section>

                <aside className="space-y-8">
                    <div className="bg-surface-container-lowest p-8 rounded-4xl border border-outline-variant/10 shadow-sm relative overflow-hidden group">
                        <div className="relative z-10">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-outline mb-8 border-b border-outline-variant/10 pb-4 italic">Standard Reports</h4>
                            <div className="space-y-6">
                                <button
                                    onClick={handleTimelineReportClick}
                                    className="w-full flex items-center justify-between group/link"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary group-hover/link:bg-primary group-hover/link:text-white transition-all shadow-sm">
                                            <Calendar size={18} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs font-black text-primary uppercase tracking-widest">Timeline Report</p>
                                            <p className="text-[9px] font-bold text-outline opacity-60">Date range & multi-filter export</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-outline group-hover/link:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Timeline Report Modal */}
            {showTimelineModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/20 shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-8 border-b border-outline-variant/10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                    <FileSpreadsheet size={24} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-primary tracking-tight">Timeline Report Generator</h3>
                                    <p className="text-[10px] font-medium text-outline uppercase tracking-widest">Advanced filtering and Excel export</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowTimelineModal(false)}
                                className="p-2 hover:bg-surface-container-high rounded-xl transition-colors text-outline"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            {/* Date Range Filter */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <Clock size={18} className="text-primary" />
                                    <h4 className="text-sm font-black text-primary uppercase tracking-widest">Date Range Selection</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1 italic">Start Date</label>
                                        <input
                                            type="date"
                                            value={timelineFilters.startDate}
                                            onChange={(e) => handleTimelineFilterChange('startDate', e.target.value)}
                                            className="w-full bg-white dark:bg-slate-900 border border-outline-variant/20 rounded-xl px-4 py-3 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1 italic">End Date</label>
                                        <input
                                            type="date"
                                            value={timelineFilters.endDate}
                                            onChange={(e) => handleTimelineFilterChange('endDate', e.target.value)}
                                            className="w-full bg-white dark:bg-slate-900 border border-outline-variant/20 rounded-xl px-4 py-3 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Status Filter */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <CheckCircle size={18} className="text-primary" />
                                    <h4 className="text-sm font-black text-primary uppercase tracking-widest">Application Status</h4>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {['All', 'SUBMITTED', 'HOD_REVIEW', 'COMMITTEE_EVALUATION', 'CA_APPROVED', 'HIRED', 'ONGOING', 'COMPLETED', 'REJECTED'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => handleTimelineFilterChange('status', status)}
                                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${timelineFilters.status === status
                                                    ? 'bg-primary text-white shadow-md'
                                                    : 'bg-surface-container-low text-outline hover:bg-surface-container-high'
                                                }`}
                                        >
                                            {status === 'All' ? 'All Statuses' : status.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* College & Department Filters */}
                            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1 italic flex items-center gap-2">
                                        <Building size={14} /> Filter by College
                                    </label>
                                    <select
                                        value={timelineFilters.college}
                                        onChange={(e) => handleTimelineFilterChange('college', e.target.value)}
                                        className="w-full bg-white dark:bg-slate-900 border border-outline-variant/20 rounded-xl px-4 py-3 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/20 focus:border-transparent appearance-none"
                                    >
                                        <option value="All">All Colleges</option>
                                        {colleges.map(college => (
                                            <option key={college} value={college}>{college}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1 italic flex items-center gap-2">
                                        <Users size={14} /> Filter by Department
                                    </label>
                                    <select
                                        value={timelineFilters.department}
                                        onChange={(e) => handleTimelineFilterChange('department', e.target.value)}
                                        className="w-full bg-white dark:bg-slate-900 border border-outline-variant/20 rounded-xl px-4 py-3 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/20 focus:border-transparent appearance-none"
                                    >
                                        <option value="All">All Departments</option>
                                        {departments.map(dept => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1 italic flex items-center gap-2">
                                        <Layers size={14} /> Filter by Program
                                    </label>
                                    <select
                                        value={timelineFilters.internshipId}
                                        onChange={(e) => handleTimelineFilterChange('internshipId', e.target.value)}
                                        className="w-full bg-white dark:bg-slate-900 border border-outline-variant/20 rounded-xl px-4 py-3 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/20 focus:border-transparent appearance-none"
                                    >
                                        <option value="All">All Programs</option>
                                        {internships.map(i => (
                                            <option key={i.id} value={i.id}>{i?.title || 'Untitled'}</option>
                                        ))}
                                    </select>
                                </div>
                            </section>

                            {/* Action Buttons */}
                            <section className="flex gap-4 pt-4">
                                <button
                                    onClick={handleApplyTimelineFilters}
                                    disabled={timelineLoading}
                                    className="flex-1 bg-primary text-white py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-primary-container shadow-premium transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    <Filter size={18} /> {timelineLoading ? 'Loading...' : 'Apply Filters'}
                                </button>
                                <button
                                    onClick={handleTimelineExport}
                                    disabled={!timelineStats}
                                    className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-emerald-700 shadow-premium transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FileSpreadsheet size={18} /> Export to Excel
                                </button>
                            </section>

                            {/* Preview Stats */}
                            {timelineStats && (
                                <section className="border-t border-outline-variant/10 pt-8 space-y-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <TrendingUp size={18} className="text-primary" />
                                        <h4 className="text-sm font-black text-primary uppercase tracking-widest">Preview Statistics</h4>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-surface-container-low p-4 rounded-2xl">
                                            <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Total Applications</p>
                                            <p className="text-2xl font-black text-primary">{timelineStats.total}</p>
                                        </div>
                                        <div className="bg-emerald-50 p-4 rounded-2xl">
                                            <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Hired</p>
                                            <p className="text-2xl font-black text-emerald-600">{timelineStats.statusCounts.HIRED || 0}</p>
                                        </div>
                                        <div className="bg-amber-50 p-4 rounded-2xl">
                                            <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest">Pending</p>
                                            <p className="text-2xl font-black text-amber-600">{(timelineStats.statusCounts.SUBMITTED || 0) + (timelineStats.statusCounts.HOD_REVIEW || 0)}</p>
                                        </div>
                                        <div className="bg-red-50 p-4 rounded-2xl">
                                            <p className="text-[9px] font-bold text-red-600 uppercase tracking-widest">Rejected</p>
                                            <p className="text-2xl font-black text-red-600">{timelineStats.statusCounts.REJECTED || 0}</p>
                                        </div>
                                    </div>

                                    {/* College-wise breakdown */}
                                    <div className="bg-surface-container-low p-6 rounded-2xl">
                                        <h5 className="text-[10px] font-black text-outline uppercase tracking-widest mb-4">College-wise Distribution (Top 10)</h5>
                                        <div className="space-y-2">
                                            {Object.entries(timelineStats.collegeCounts)
                                                .sort((a, b) => b[1] - a[1])
                                                .slice(0, 10)
                                                .map(([college, count], idx) => (
                                                    <div key={college} className="flex items-center justify-between py-2 border-b border-outline-variant/10 last:border-0">
                                                        <span className="text-xs font-bold text-primary">{idx + 1}. {college}</span>
                                                        <span className="text-xs font-black text-outline bg-surface-container-high px-3 py-1 rounded-lg">{count}</span>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>

                                    {/* Department-wise breakdown */}
                                    <div className="bg-surface-container-low p-6 rounded-2xl">
                                        <h5 className="text-[10px] font-black text-outline uppercase tracking-widest mb-4">Department-wise Distribution</h5>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {Object.entries(timelineStats.departmentCounts)
                                                .sort((a, b) => b[1] - a[1])
                                                .map(([dept, count]) => (
                                                    <div key={dept} className="bg-white dark:bg-slate-900 p-3 rounded-xl">
                                                        <p className="text-[9px] font-bold text-outline uppercase tracking-wider truncate">{dept}</p>
                                                        <p className="text-lg font-black text-primary">{count}</p>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PrtiReports;
