'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import CreateProjectForm from '@/components/projects/CreateProjectForm';
import { Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface Project {
    id: string;
    client_name: string;
    position_title: string;
    project_title: string;
    openings: number;
    status: string;
    created_at: string;
}

export default function AdminProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const supabase = createClient();

    const fetchProjects = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setProjects(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-900 hover:bg-blue-800"
                >
                    {showCreate ? <><X className="mr-2 h-4 w-4" /> Cancel</> : <><Plus className="mr-2 h-4 w-4" /> New Project</>}
                </button>
            </div>

            {showCreate && (
                <div className="mb-6">
                    <CreateProjectForm onSuccess={() => {
                        setShowCreate(false);
                        fetchProjects();
                    }} />
                </div>
            )}

            {loading ? (
                <div className="text-center py-10 text-gray-500">Loading projects...</div>
            ) : (
                <div className="bg-white shadow overflow-hidden rounded-lg border border-gray-100">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {projects.map((project) => (
                                <tr key={project.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-900">
                                        <Link href={`/projects/${project.id}`}>{project.project_title}</Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.client_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${project.status === 'Active' ? 'bg-green-100 text-green-800' :
                                                project.status === 'Closed' ? 'bg-gray-100 text-gray-800' :
                                                    'bg-yellow-100 text-yellow-800'}`}>
                                            {project.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {format(new Date(project.created_at), 'MMM d, yyyy')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link href={`/projects/${project.id}`} className="text-blue-600 hover:text-blue-900">View</Link>
                                    </td>
                                </tr>
                            ))}
                            {projects.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">No projects found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
