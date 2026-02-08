'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import { ExternalLink, Edit2, Lock, UserPlus, X, Clock } from 'lucide-react';
import CandidateStatusModal from './CandidateStatusModal';
import AddCandidateForm from './AddCandidateForm';
import { useAuth } from '@/components/AuthProvider';
import FollowUpModal from '../followups/FollowUpModal';

interface Candidate {
    id: string;
    name: string;
    source: string;
    status: string;
    cv_link: string;
    created_at: string;
    recruiter_id: string;
    admin_approved_joining?: boolean;
    project_title?: string;
    designation?: string;
    current_company?: string;
}

export default function GlobalCandidateList() {
    const { user } = useAuth();
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
    const [followUpCandidate, setFollowUpCandidate] = useState<Candidate | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const supabase = createClient();

    const fetchCandidates = async () => {
        setLoading(true);
        try {
            // Fetch candidates with project title
            // RLS will automatically filter:
            // - Admins see all
            // - Recruiters see only their own
            const { data, error } = await supabase
                .from('candidates')
                .select('*, projects(project_title)')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const formatted = data.map((c: any) => ({
                    ...c,
                    project_title: c.projects?.project_title
                }));
                setCandidates(formatted);
            }
        } catch (error) {
            console.error('Error fetching global candidates:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchCandidates();
    }, [user]);

    const [searchTerm, setSearchTerm] = useState('');
    const [sourceFilter, setSourceFilter] = useState('');

    const filteredCandidates = candidates.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.project_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.current_company?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSource = sourceFilter ? c.source === sourceFilter : true;
        return matchesSearch && matchesSource;
    });

    if (loading) return <div className="text-center py-4 text-gray-500">Loading candidates...</div>;

    const sources = ['LinkedIn', 'BDJobs', 'Referral', 'Other'];

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div className="flex items-center space-x-4">
                    <h2 className="text-lg font-bold text-gray-900">All Candidates</h2>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition text-sm"
                    >
                        <UserPlus className="h-4 w-4" />
                        <span>Add Candidate</span>
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <input
                        type="text"
                        placeholder="Search name, role, company..."
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={sourceFilter}
                        onChange={(e) => setSourceFilter(e.target.value)}
                    >
                        <option value="">All Sources</option>
                        {sources.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CV</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredCandidates.map((c) => (
                            <tr key={c.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {c.name}
                                    <span className="block text-xs text-gray-500">{c.source}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {c.designation || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {c.current_company || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                                    {c.project_title || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                     ${c.status === 'Joined' ? 'bg-green-100 text-green-800' :
                                            c.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                                'bg-blue-100 text-blue-800'}`}>
                                        {c.status}
                                    </span>
                                    {c.admin_approved_joining && <Lock className="inline-block h-3 w-3 ml-1 text-gray-400" />}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(new Date(c.created_at), 'MMM d')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-900">
                                    <a href={c.cv_link} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                        Link <ExternalLink className="ml-1 h-3 w-3" />
                                    </a>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => setFollowUpCandidate(c)}
                                        className="text-blue-600 hover:text-blue-900 mr-3"
                                        title="Schedule Follow-up"
                                    >
                                        <Clock className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => setSelectedCandidate(c)}
                                        className="text-indigo-600 hover:text-indigo-900"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredCandidates.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">No candidates found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {selectedCandidate && (
                    <CandidateStatusModal
                        candidate={selectedCandidate}
                        onClose={() => setSelectedCandidate(null)}
                        onUpdate={fetchCandidates}
                    />
                )}

                {followUpCandidate && (
                    <FollowUpModal
                        isOpen={!!followUpCandidate}
                        onClose={() => setFollowUpCandidate(null)}
                        candidateId={followUpCandidate.id}
                        candidateName={followUpCandidate.name}
                        recruiterId={followUpCandidate.recruiter_id || user?.id || ''}
                    />
                )}

                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-900">Add New Candidate</h3>
                                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <AddCandidateForm
                                onSuccess={() => {
                                    setIsAddModalOpen(false);
                                    fetchCandidates();
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
