'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';

export default function AdminKPIs() {
    const [stats, setStats] = useState({
        activeProjects: 0,
        totalJoined: 0,
        pendingOffers: 0,
        delayedProjects: 0
    });
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // 1. Active Projects
                // 1. Active Projects
                const { data: activeProjectsData } = await supabase
                    .from('projects')
                    .select('id')
                    .eq('status', 'Active');
                const activeCount = activeProjectsData?.length || 0;

                // 2. Total Joined
                const { count: joinedCount } = await supabase
                    .from('candidates')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'Joined');

                // 3. Pending Offers (Status = 'Offer')
                const { count: offerCount } = await supabase
                    .from('candidates')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'Offer');

                // 4. Delayed Projects (Active AND target_close_date < today)
                const today = new Date().toISOString().split('T')[0];
                const { count: delayedCount } = await supabase
                    .from('projects')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'Active')
                    .lt('target_close_date', today);

                setStats({
                    activeProjects: activeCount || 0,
                    totalJoined: joinedCount || 0,
                    pendingOffers: offerCount || 0,
                    delayedProjects: delayedCount || 0
                });
            } catch (error) {
                console.error('Error fetching admin KPIs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [supabase]);

    if (loading) {
        return <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>)}
        </div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <p className="text-sm font-medium text-gray-500">Active Projects</p>
                <p className="text-2xl font-semibold text-gray-900 mt-2">{stats.activeProjects}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <p className="text-sm font-medium text-gray-500">Total Joined</p>
                <p className="text-2xl font-semibold text-green-600 mt-2">{stats.totalJoined}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <p className="text-sm font-medium text-gray-500">Pending Offers</p>
                <p className="text-2xl font-semibold text-yellow-600 mt-2">{stats.pendingOffers}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <p className="text-sm font-medium text-gray-500">Delayed Projects</p>
                <p className="text-2xl font-semibold text-red-600 mt-2">{stats.delayedProjects}</p>
            </div>
        </div>
    );
}
