'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import { FileText, History } from 'lucide-react';
import ProjectLogModal from '../projects/ProjectLogModal';
import ProjectLogHistoryModal from '../projects/ProjectLogHistoryModal';

interface Project {
    id: string;
    project_title: string;
    client_name: string;
    status: string;
    assigned_at: string;
    cv_count: number;
    last_activity_at: string;
    follow_up_stage: string;
}

export default function RecruiterProjectList({ readOnly = false }: { readOnly?: boolean }) {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [logProject, setLogProject] = useState<{ id: string, title: string } | null>(null);
    const [viewHistoryProject, setViewHistoryProject] = useState<{ id: string, title: string } | null>(null);
    const supabase = createClient();

    useEffect(() => {
        const fetchProjects = async () => {
            if (!user?.id) return;

            try {
                // 1. First fetch the assignments (IDs)
                // This checks if the user has access to the 'project_recruiters' table
                const { data: assignments, error: assignError } = await supabase
                    .from('project_recruiters')
                    .select('project_id, assigned_at')
                    .eq('recruiter_id', user.id);

                if (assignError) {
                    console.error('Error fetching assignments:', assignError);
                    throw assignError;
                }

                if (!assignments || assignments.length === 0) {
                    setProjects([]);
                    return;
                }

                console.log('Found assignments:', assignments);

                // 2. Then fetch the actual project details
                const projectIds = assignments.map(a => a.project_id);
                const { data: projectsData, error: projectsError } = await supabase
                    .from('projects')
                    .select('id, project_title, client_name, status, cv_count, last_activity_at, follow_up_stage')
                    .in('id', projectIds);

                if (projectsError) {
                    console.error('Error fetching project details:', projectsError);
                    throw projectsError;
                }

                // 3. Merge data
                const merged = projectsData?.map(p => {
                    const assignment = assignments.find(a => a.project_id === p.id);
                    return {
                        id: p.id,
                        project_title: p.project_title,
                        client_name: p.client_name,
                        status: p.status,
                        cv_count: p.cv_count || 0,
                        last_activity_at: p.last_activity_at || new Date().toISOString(),
                        follow_up_stage: p.follow_up_stage || 'Not Started',
                        assigned_at: assignment?.assigned_at || new Date().toISOString()
                    };
                }) || [];

                setProjects(merged);

            } catch (error) {
                console.error('Error in RecruiterProjectList:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, [user, supabase]);

    if (loading) return <div className="p-4 text-center">Loading projects...</div>;

    if (projects.length === 0) {
        return (
            <div className="text-center py-6 text-gray-500">
                <p>No projects assigned yet.</p>
                <p className="text-sm mt-1">Ask your admin to assign you to a project.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CVs</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Silence</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {projects.map((project) => {
                        // Calculate Alert Colors
                        let rowClass = "hover:bg-gray-50 transition"; // Default Green-ish / Normal
                        const daysSilent = Math.max(0, Math.floor((new Date().getTime() - new Date(project.last_activity_at).getTime()) / (1000 * 3600 * 24)));

                        if (project.status === 'Active') {
                            if (project.cv_count === 0 || daysSilent > 5) {
                                rowClass = "bg-red-50/40 hover:bg-red-50 transition border-l-4 border-l-red-500";
                            } else if (daysSilent >= 3) {
                                rowClass = "bg-yellow-50/40 hover:bg-yellow-50 transition border-l-4 border-l-yellow-400";
                            } else {
                                rowClass = "bg-green-50/20 hover:bg-green-50 transition border-l-4 border-l-green-400";
                            }
                        }

                        return (
                            <tr key={project.id} className={rowClass}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                    <Link href={`/projects/${project.id}`} className="hover:text-blue-600 hover:underline">
                                        {project.project_title}
                                    </Link>
                                    {project.status !== 'Active' && (
                                        <span className={`ml-2 px-2 inline-flex text-[10px] leading-4 font-semibold rounded-full bg-gray-100 text-gray-800`}>
                                            {project.status}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.client_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`text-base font-bold ${project.cv_count === 0 && project.status === 'Active' ? 'text-red-500' : 'text-gray-900'}`}>
                                        {project.cv_count}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {project.follow_up_stage}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={daysSilent > 3 && project.status === 'Active' ? 'text-red-600 font-medium' : 'text-gray-500'}>
                                        {daysSilent} days
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => setViewHistoryProject({ id: project.id, title: project.project_title })}
                                            className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
                                            title="View History"
                                        >
                                            <History className="h-4 w-4" />
                                        </button>
                                        {!readOnly && (
                                            <button
                                                onClick={() => setLogProject({ id: project.id, title: project.project_title })}
                                                className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1 font-bold bg-indigo-50 px-2 py-1 rounded"
                                                title="Log Action / CV Upload"
                                            >
                                                <FileText className="h-4 w-4 mr-1" />
                                                Log
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {
                logProject && user && (
                    <ProjectLogModal
                        isOpen={!!logProject}
                        onClose={() => setLogProject(null)}
                        projectId={logProject.id}
                        projectName={logProject.title}
                        recruiterId={user.id}
                    />
                )
            }

            {
                viewHistoryProject && (
                    <ProjectLogHistoryModal
                        isOpen={!!viewHistoryProject}
                        onClose={() => setViewHistoryProject(null)}
                        projectId={viewHistoryProject.id}
                        projectName={viewHistoryProject.title}
                    />
                )
            }
        </div >
    );
}
