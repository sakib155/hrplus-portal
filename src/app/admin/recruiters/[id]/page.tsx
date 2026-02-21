'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Loader2, ArrowLeft, Mail, Briefcase, UserCheck } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import RecruiterTaskLog from '@/components/dashboard/RecruiterTaskLog';

interface RecruiterDetails {
    id: string;
    name: string;
    email?: string; // Need to join with auth or just store email in employees tables? 
    // Note: 'employees' table doesn't have email column in schema, but we can verify.
    // Actually, schema.sql shows employees table only has ID, Name, Role.
    // We might not get email easily unless we added it or kept it in sync.
    // For now, we will show what we have.
    joined_at: string;
}

interface ProjectAssignment {
    project_id: string;
    project_title: string;
    client_name: string;
    assigned_at: string;
    status: string;
}

export default function RecruiterProfilePage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const supabase = createClient();

    const [recruiter, setRecruiter] = useState<RecruiterDetails | null>(null);
    const [assignments, setAssignments] = useState<ProjectAssignment[]>([]);
    const [stats, setStats] = useState({
        sourced: 0,
        joined: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                // 1. Fetch Recruiter Basic Info
                const { data: empData, error: empError } = await supabase
                    .from('employees')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (empError) throw empError;
                setRecruiter({
                    id: empData.id,
                    name: empData.name,
                    joined_at: empData.created_at
                });

                // 2. Fetch Assignments
                const { data: assignData, error: assignError } = await supabase
                    .from('project_recruiters')
                    .select(`
                        assigned_at,
                        projects (
                            id,
                            project_title,
                            client_name,
                            status
                        )
                    `)
                    .eq('recruiter_id', id);

                if (assignData) {
                    const formatted = assignData.map((item: any) => ({
                        project_id: item.projects.id,
                        project_title: item.projects.project_title,
                        client_name: item.projects.client_name,
                        status: item.projects.status,
                        assigned_at: item.assigned_at
                    }));
                    setAssignments(formatted);
                }

                // 3. Fetch Candidate Stats
                const { count: sourcedCount } = await supabase
                    .from('candidates')
                    .select('*', { count: 'exact', head: true })
                    .eq('recruiter_id', id);

                const { count: joinedCount } = await supabase
                    .from('candidates')
                    .select('*', { count: 'exact', head: true })
                    .eq('recruiter_id', id)
                    .eq('status', 'Joined');

                setStats({
                    sourced: sourcedCount || 0,
                    joined: joinedCount || 0
                });

            } catch (error) {
                console.error('Error details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, supabase]);

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>;
    if (!recruiter) return <div className="p-8 text-center">Recruiter not found</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <button onClick={() => router.back()} className="flex items-center text-gray-500 hover:text-gray-700 mb-4 transition">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </button>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl">
                        {recruiter.name.charAt(0)}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{recruiter.name}</h1>
                        <p className="text-gray-500 text-sm">Recruiter • Joined {new Date(recruiter.joined_at).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-full"><Briefcase className="h-6 w-6" /></div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Active Projects</p>
                        <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-full"><UserCheck className="h-6 w-6" /></div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Candidates Sourced</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.sourced}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-3 bg-green-100 text-green-600 rounded-full"><UserCheck className="h-6 w-6" /></div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Successful Hires</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.joined}</p>
                    </div>
                </div>
            </div>

            {/* Assigned Tasks */}
            <RecruiterTaskLog recruiterId={id} />

            {/* Assigned Projects Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Assigned Projects</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned Date</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {assignments.map((assignment) => (
                                <tr key={assignment.project_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                        <Link href={`/projects/${assignment.project_id}`}>
                                            {assignment.project_title}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {assignment.client_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${assignment.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {assignment.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(assignment.assigned_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                            {assignments.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                                        No projects assigned yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
