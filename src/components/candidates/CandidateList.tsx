'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import { ExternalLink, Edit2, Lock, Clock } from 'lucide-react';
import CandidateStatusModal from './CandidateStatusModal';
import FollowUpModal from '../followups/FollowUpModal';

interface Candidate {
    id: string;
    name: string;
    source: string;
    status: string;
    cv_link: string;
    created_at: string;
    recruiter_id: string;
    joining_letter_link?: string;
    admin_approved_joining?: boolean;
}

export default function CandidateList({ projectId }: { projectId: string }) {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
    const [followUpCandidate, setFollowUpCandidate] = useState<Candidate | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) setCurrentUserId(user.id);
        });
    }, [supabase]);

    const fetchCandidates = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('candidates')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (data) setCandidates(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchCandidates();
    }, [projectId]);

    if (loading) return <div className="text-center py-4 text-gray-500">Loading pipeline...</div>;

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CV</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {candidates.map((c) => (
                        <tr key={c.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                 ${c.status === 'Joined' ? 'bg-green-100 text-green-800' :
                                        c.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                            'bg-blue-100 text-blue-800'}`}>
                                    {c.status}
                                </span>
                                {c.admin_approved_joining && <Lock className="inline-block h-3 w-3 ml-1 text-gray-400" />}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.source}</td>
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
                    {candidates.length === 0 && (
                        <tr>
                            <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No candidates found.</td>
                        </tr>
                    )}
                </tbody>
            </table>


            {selectedCandidate && (
                <CandidateStatusModal
                    candidate={selectedCandidate}
                    projectId={projectId}
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
                    recruiterId={followUpCandidate.recruiter_id || currentUserId || ''}
                />
            )}
        </div>
    );
}
