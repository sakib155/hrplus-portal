'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useParams } from 'next/navigation';
import AssignRecruiter from '@/components/projects/AssignRecruiter';
import AddCandidateForm from '@/components/candidates/AddCandidateForm';
import CandidateList from '@/components/candidates/CandidateList';
import { format } from 'date-fns';
import { useAuth } from '@/components/AuthProvider';
import EditProjectModal from '@/components/projects/EditProjectModal';

interface ProjectDetails {
    id: string;
    project_title: string;
    client_name: string;
    position_title: string;
    status: string;
    openings: number;
    created_at: string;
    start_date: string;
    notes: string;
}

interface AssignedRecruiter {
    recruiter_id: string;
    assigned_at: string;
    employees: {
        name: string;
        email: string;
    };
}

export default function ProjectDetailsPage() {
    const params = useParams();
    const id = params.id as string;
    const [project, setProject] = useState<ProjectDetails | null>(null);
    const [recruiters, setRecruiters] = useState<AssignedRecruiter[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddCandidate, setShowAddCandidate] = useState(false);
    const [refreshCandidatesKey, setRefreshCandidatesKey] = useState(0);
    const { isAdmin } = useAuth();
    const supabase = createClient();

    const fetchCandidates = () => {
        setRefreshCandidatesKey(prev => prev + 1);
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        // Fetch project details
        const { data: projectData } = await supabase
            .from('projects')
            .select('*')
            .eq('id', id)
            .single();

        if (projectData) setProject(projectData);

        // Fetch assigned recruiters
        const { data: recruiterData } = await supabase
            .from('project_recruiters')
            .select('recruiter_id, assigned_at, employees(name, email)')
            .eq('project_id', id);

        if (recruiterData) {
            // @ts-ignore
            setRecruiters(recruiterData);
        }

        setLoading(false);
    }, [id, supabase]);

    useEffect(() => {
        if (id) fetchData();
    }, [id, fetchData]);

    if (loading) return <div className="p-8 text-center">Loading details...</div>;
    if (!project) return <div className="p-8 text-center text-red-500">Project not found.</div>;

    return (
        <div className="space-y-8">

            {/* Header */}
            <div className="bg-white shadow rounded-lg p-6 border border-gray-100">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center space-x-4">
                            <h1 className="text-2xl font-bold text-gray-900">{project.project_title}</h1>
                            {isAdmin && <EditProjectModal project={project} onUpdate={fetchData} />}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Client: {project.client_name}</p>
                    </div>
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full 
            ${project.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {project.status}
                    </span>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <span className="block text-gray-500">Openings</span>
                        <span className="font-medium text-gray-900">{project.openings}</span>
                    </div>
                    <div>
                        <span className="block text-gray-500">Start Date</span>
                        <span className="font-medium text-gray-900">{format(new Date(project.start_date || project.created_at), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="col-span-2">
                        <span className="block text-gray-500">Notes</span>
                        <span className="font-medium text-gray-900">{project.notes || 'No notes'}</span>
                    </div>
                </div>
            </div>

            {/* Recruiters Section (Admin Only) */}
            <div className="bg-white shadow rounded-lg p-6 border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Assigned Recruiters</h2>
                    {isAdmin && <div className="max-w-xs"><AssignRecruiter projectId={id} onUpdate={fetchData} /></div>}
                </div>

                {recruiters.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                        {recruiters.map((r) => (
                            <li key={r.recruiter_id} className="py-3 flex justify-between items-center">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-blue-100 rounded-full h-8 w-8 flex items-center justify-center text-blue-800 text-xs font-bold">
                                        {r.employees?.name?.[0] || 'R'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{r.employees?.name}</p>
                                        <p className="text-xs text-gray-500">{r.employees?.email}</p>
                                    </div>
                                </div>
                                {isAdmin && (
                                    <button className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-500">No recruiters assigned yet.</p>
                )}
            </div>

            {/* Candidates Section */}
            <div className="bg-white shadow rounded-lg p-6 border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Candidate Pipeline</h2>
                    <button
                        onClick={() => setShowAddCandidate(!showAddCandidate)}
                        className="text-sm text-blue-600 font-medium hover:text-blue-900"
                    >
                        {showAddCandidate ? 'Cancel' : 'Add Candidate'}
                    </button>
                </div>

                {showAddCandidate && (
                    <div className="mb-6 bg-gray-50 p-4 rounded-md border border-gray-200">
                        <AddCandidateForm projectId={id} onSuccess={() => {
                            setShowAddCandidate(false);
                            fetchCandidates();
                        }} />
                    </div>
                )}

                <CandidateList projectId={id} key={refreshCandidatesKey} />
            </div>
        </div>
    );
}
