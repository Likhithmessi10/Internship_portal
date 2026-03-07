import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Calendar, MapPin, Users, Building, Search } from 'lucide-react';

const InternshipList = () => {
    const [internships, setInternships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchInternships = async () => {
            try {
                const res = await api.get('/internships');
                setInternships(res.data.data);
            } catch (error) {
                console.error("Failed to fetch internships", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInternships();
    }, []);

    const filtered = internships.filter(i =>
        i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="text-center py-10 text-muted">Loading internships...</div>;

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-secondary">Available Internships</h1>
                    <p className="text-muted mt-1">Discover opportunities across various departments at APTRANSCO.</p>
                </div>

                <div className="relative w-full md:w-72">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={18} className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by title or dept..."
                        className="input-field pl-10"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="card text-center py-12">
                    <p className="text-muted text-lg">No internships found matching your search.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map(internship => (
                        <div key={internship.id} className="card hover:shadow-lg transition-shadow border-t-4 border-t-primary flex flex-col h-full">
                            <div className="flex-grow">
                                <div className="text-xs font-bold tracking-wider text-primary uppercase mb-2">
                                    {internship.department}
                                </div>
                                <h2 className="text-xl font-bold text-secondary mb-3 line-clamp-2">
                                    {internship.title}
                                </h2>
                                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                                    {internship.description}
                                </p>

                                <div className="space-y-2 mb-6">
                                    <div className="flex items-center text-sm text-gray-500 gap-2">
                                        <MapPin size={16} className="text-muted" /> {internship.location}
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500 gap-2">
                                        <Calendar size={16} className="text-muted" /> {internship.duration}
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500 gap-2">
                                        <Users size={16} className="text-muted" /> {internship.openingsCount} Openings
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto pt-4 border-t border-gray-100">
                                <Link
                                    to={`/internships/${internship.id}/apply`}
                                    className="block text-center bg-primary hover:bg-blue-800 text-white font-medium py-2 px-4 rounded transition-colors w-full"
                                >
                                    Apply Now
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default InternshipList;
