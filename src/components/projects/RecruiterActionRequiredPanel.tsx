'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthProvider';
import { AlertCircle, Clock, Calendar, FileUser, Flame } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import ProjectLogModal from './ProjectLogModal';

interface ActionProject {
    id: string;
    client_name: string;
    position_title: string;
    status: string;
    follow_up_stage: string;
    last_activity_at: string;
    cv_count: number;
    employees?: { name: string };
    riskReason: string;
    riskColor: 'red' | 'yellow';
}

export default function RecruiterActionRequiredPanel({ readOnly = false }: { readOnly?: boolean }) {
    const { isRecruitmentLead, user } = useAuth();
    const [projects, setProjects] = useState<ActionProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [logProject, setLogProject] = useState<{ id: string, title: string } | null>(null);
    const supabase = createClient();

    const fetchActionProjects = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
            const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];

            let query = supabase
                .from('projects')
                .select(`
                    id, client_name, position_title, status, follow_up_stage, last_activity_at, cv_count,
                    project_recruiters(recruiter_id),
                    employees!created_by(name)
                `)
                .eq('status', 'Active');

            const { data, error } = await query;
            if (error) throw error;

            const actionItems: ActionProject[] = [];

            (data || []).forEach(project => {
                // If not lead, only show assigned projects
                const isAssigned = project.project_recruiters?.some((pr: any) => pr.recruiter_id === user.id);
                if (!isRecruitmentLead && !isAssigned) return;

                let riskReason = '';
                let riskColor: 'red' | 'yellow' | 'none' = 'none';

                // 1. Missing CVs (Red - Top Priority)
                if (project.cv_count === 0 && project.follow_up_stage === 'Sourcing') {
                    riskReason = 'No CVs Sourced';
                    riskColor = 'red';
                }
                // 2. Silent > 3 Days (Red)
                else if (project.last_activity_at && project.last_activity_at < threeDaysAgoStr) {
                    riskReason = `Silent > 3 Days`;
                    riskColor = 'red';
                }
                // 3. Feedback Pending (Yellow)
                else if (project.follow_up_stage === 'Interviewing' || project.follow_up_stage === 'Client Review') {
                    // Just highlighting stages that typically bottleneck
                    riskReason = 'Pending Feedback';
                    riskColor = 'yellow';
                }

                if (riskColor !== 'none') {
                    actionItems.push({
                        id: project.id,
                        client_name: project.client_name,
                        position_title: project.position_title,
                        status: project.status,
                        follow_up_stage: project.follow_up_stage,
                        last_activity_at: project.last_activity_at || new Date().toISOString(),
                        cv_count: project.cv_count || 0,
                        employees: { name: (project.employees as any)?.name || 'Unknown' },
                        riskReason,
                        riskColor
                    });
                }
            });

            // Re-sort: Red risks first (specifically No CVs), then yellow
            actionItems.sort((a, b) => {
                if (a.riskReason === 'No CVs Sourced' && b.riskReason !== 'No CVs Sourced') return -1;
                if (b.riskReason === 'No CVs Sourced' && a.riskReason !== 'No CVs Sourced') return 1;
                if (a.riskColor === 'red' && b.riskColor !== 'red') return -1;
                if (b.riskColor === 'red' && a.riskColor !== 'red') return 1;
                return new Date(a.last_activity_at).getTime() - new Date(b.last_activity_at).getTime();
            });

            setProjects(actionItems);
        } catch (error) {
            console.error('Error fetching action projects:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActionProjects();
    }, [user, isRecruitmentLead]);

    if (!user) return null;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-red-100 overflow-hidden mb-6">
            <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center justify-between">
                <div className="flex items-center">
                    <Flame className="h-5 w-5 text-red-500 mr-2" />
                    <h3 className="text-lg font-bold text-red-900">Action Required (CV Pipeline)</h3>
                </div>
                <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {projects.length} Risks
                </span>
            </div>

            {loading ? (
                <div className="p-8 text-center text-gray-500 animate-pulse">Scanning CV pipeline for risks...</div>
            ) : projects.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500 bg-gray-50">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-green-400 mb-2" />
                    Pipeline is flowing. No stalled projects found!
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alert</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CVs Target</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Silence</th>
                                {!readOnly && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {projects.map(project => {
                                const daysSilent = Math.max(0, differenceInDays(new Date(), new Date(project.last_activity_at)));
                                return (
                                    <tr key={project.id} className={project.riskColor === 'red' ? 'bg-red-50/30' : 'bg-yellow-50/30'}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${project.riskColor === 'red' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                                }`}>
                                                {project.riskReason === 'No CVs Sourced' ? <FileUser className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                                                {project.riskReason}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-gray-900">{project.position_title}</div>
                                            <div className="text-xs text-gray-500">{project.client_name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`text-xl font-bold ${project.cv_count === 0 ? 'text-red-500' : 'text-gray-900'}`}>
                                                {project.cv_count}
                                            </span>
                                            <span className="text-xs text-gray-400 ml-1">CVs</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {project.follow_up_stage}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <span className={daysSilent >= 3 ? 'text-red-600' : 'text-gray-900'}>{daysSilent} days</span>
                                        </td>
                                        {!readOnly && (
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => setLogProject({ id: project.id, title: project.position_title })}
                                                    className="text-blue-600 hover:text-blue-900 font-bold bg-blue-50 px-2 py-1 rounded"
                                                >
                                                    Update Flow
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {logProject && user && (
                <ProjectLogModal
                    isOpen={!!logProject}
                    onClose={() => setLogProject(null)}
                    projectId={logProject.id}
                    projectName={logProject.title}
                    recruiterId={user.id}
                    onSuccess={() => {
                        fetchActionProjects();
                    }}
                />
            )}
        </div>
    );
}

// Helper unused icon
const CheckCircle2 = ({ className }: { className?: string }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
