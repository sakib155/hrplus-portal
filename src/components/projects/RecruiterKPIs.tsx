'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthProvider';

export default function RecruiterKPIs() {
    const { isRecruitmentLead, user } = useAuth();
    const [stats, setStats] = useState({
        activeProjects: 0,
        cvsSubmitted: 0, // In a real system, we'd query an interactions table for "today", but we'll use total cv_count for now
        interviews: 0,   // Approximated by candidates in Interview status
        placements: 0    // Approximated by candidates in Joined status
    });
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (!user) return;

        const fetchStats = async () => {
            try {
                // 1. Active Projects
                let activeProjectsQuery = supabase.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'Active');
                if (!isRecruitmentLead) {
                    // For a normal recruiter, we should only count projects they are assigned to.
                    // To do this simply with Supabase without a complex join in JS, we fetch the IDs they are assigned to first.
                    const { data: assignments } = await supabase.from('project_recruiters').select('project_id').eq('recruiter_id', user.id);
                    const projectIds = assignments?.map(a => a.project_id) || [];
                    if (projectIds.length > 0) {
                        activeProjectsQuery = activeProjectsQuery.in('id', projectIds);
                    } else {
                        // If not assigned to anything, count is 0
                        setStats(s => ({ ...s, activeProjects: 0 }));
                        activeProjectsQuery = null as any;
                    }
                }

                let activeProjects = 0;
                if (activeProjectsQuery) {
                    const { count } = await activeProjectsQuery;
                    activeProjects = count || 0;
                }

                // 2. CVs Submitted (Total across assigned active projects for now)
                let cvsQuery = supabase.from('projects').select('cv_count').eq('status', 'Active');
                if (!isRecruitmentLead) {
                    const { data: assignments } = await supabase.from('project_recruiters').select('project_id').eq('recruiter_id', user.id);
                    const projectIds = assignments?.map(a => a.project_id) || [];
                    if (projectIds.length > 0) {
                        cvsQuery = cvsQuery.in('id', projectIds);
                    } else {
                        cvsQuery = null as any;
                    }
                }

                let totalCvs = 0;
                if (cvsQuery) {
                    const { data: projectsData } = await cvsQuery;
                    totalCvs = (projectsData || []).reduce((sum, p) => sum + (p.cv_count || 0), 0);
                }

                // 3 & 4. Interviews and Placements (from Candidates table)
                // Assuming candidates are linked to projects, we'd ideally filter by recruiter assigned.
                // For simplicity in this layered approach, we'll fetch all if Lead, or just count globally for now if we don't have a direct recruiter-candidate link.
                // Assuming candidate table exists and has 'status'
                const { count: interviews } = await supabase.from('candidates').select('id', { count: 'exact', head: true }).in('status', ['Interview 1', 'Interview 2', 'Client Review']);
                const { count: placements } = await supabase.from('candidates').select('id', { count: 'exact', head: true }).eq('status', 'Joined');


                setStats({
                    activeProjects,
                    cvsSubmitted: totalCvs,
                    interviews: interviews || 0,
                    placements: placements || 0
                });
            } catch (error) {
                console.error('Error fetching recruiter KPIs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [supabase, user, isRecruitmentLead]);

    if (loading) {
        return <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse mb-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-lg"></div>)}
        </div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <p className="text-sm font-medium text-gray-500">Active Projects</p>
                <p className="text-2xl font-semibold text-gray-900 mt-2">{stats.activeProjects}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-indigo-100">
                <p className="text-sm font-medium text-indigo-600">CV Pipeline (Total)</p>
                <p className="text-2xl font-semibold text-indigo-700 mt-2">{stats.cvsSubmitted}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-yellow-100">
                <p className="text-sm font-medium text-yellow-600">Active Interviews</p>
                <p className="text-2xl font-semibold text-yellow-700 mt-2">{stats.interviews}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-green-100">
                <p className="text-sm font-medium text-green-600">Successful Placements</p>
                <p className="text-2xl font-semibold text-green-700 mt-2">{stats.placements}</p>
            </div>
        </div>
    );
}
