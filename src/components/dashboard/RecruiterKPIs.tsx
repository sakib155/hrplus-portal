'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthProvider';

export default function RecruiterKPIs() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        assignedProjects: 0,
        candidatesSubmitted: 0,
        joined: 0
    });
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchStats = async () => {
            if (!user?.id) return;

            try {
                // 1. Assigned Projects
                const { count: projectCount } = await supabase
                    .from('project_recruiters')
                    .select('*', { count: 'exact', head: true })
                    .eq('recruiter_id', user.id);

                // 2. Candidates Submitted (All candidates added by this recruiter)
                const { count: candidateCount } = await supabase
                    .from('candidates')
                    .select('*', { count: 'exact', head: true })
                    .eq('recruiter_id', user.id);

                // 3. Joined
                const { count: joinedCount } = await supabase
                    .from('candidates')
                    .select('*', { count: 'exact', head: true })
                    .eq('recruiter_id', user.id)
                    .eq('status', 'Joined');

                setStats({
                    assignedProjects: projectCount || 0,
                    candidatesSubmitted: candidateCount || 0,
                    joined: joinedCount || 0
                });
            } catch (error) {
                console.error('Error fetching recruiter KPIs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user, supabase]);

    if (loading) {
        return <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>)}
        </div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <p className="text-sm font-medium text-gray-500">Assigned Projects</p>
                <p className="text-2xl font-semibold text-gray-900 mt-2">{stats.assignedProjects}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <p className="text-sm font-medium text-gray-500">Candidates Submitted</p>
                <p className="text-2xl font-semibold text-blue-600 mt-2">{stats.candidatesSubmitted}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <p className="text-sm font-medium text-gray-500">Joined</p>
                <p className="text-2xl font-semibold text-green-600 mt-2">{stats.joined}</p>
            </div>
        </div>
    );
}
