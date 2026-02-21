'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';

export default function AdminKPIs({ selectedMonth }: { selectedMonth?: string }) {
    const [stats, setStats] = useState({
        activeProjects: 0,
        totalJoined: 0,
        pendingOffers: 0,
        delayedProjects: 0,
        awaitingConversion: 0
    });
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                let startOfMonth: string | undefined;
                let endOfMonth: string | undefined;

                if (selectedMonth) {
                    startOfMonth = `${selectedMonth}-01`;
                    const dateObj = new Date(startOfMonth);
                    endOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0).toISOString().split('T')[0];
                }

                // 1. Active Projects
                let activeProjectsQuery = supabase
                    .from('projects')
                    .select('id', { count: 'exact', head: true })
                    .eq('status', 'Active');

                // 2. Total Joined
                let joinedQuery = supabase
                    .from('candidates')
                    .select('id', { count: 'exact', head: true })
                    .eq('status', 'Joined');

                // 3. Pending Offers (Status = 'Offer')
                let offerQuery = supabase
                    .from('candidates')
                    .select('id', { count: 'exact', head: true })
                    .eq('status', 'Offer');

                // 4. Delayed Projects (Active AND target_close_date < today)
                const today = new Date().toISOString().split('T')[0];
                let delayedQuery = supabase
                    .from('projects')
                    .select('id', { count: 'exact', head: true })
                    .eq('status', 'Active')
                    .lt('target_close_date', today);

                // 5. Leads Awaiting Conversion
                let awaitingQuery = supabase
                    .from('leads')
                    .select('id', { count: 'exact', head: true })
                    .in('status', ['Requirement Received', 'Converted']);

                if (startOfMonth && endOfMonth) {
                    activeProjectsQuery = activeProjectsQuery.gte('created_at', startOfMonth).lte('created_at', endOfMonth);
                    joinedQuery = joinedQuery.gte('created_at', startOfMonth).lte('created_at', endOfMonth);
                    offerQuery = offerQuery.gte('created_at', startOfMonth).lte('created_at', endOfMonth);
                    delayedQuery = delayedQuery.gte('created_at', startOfMonth).lte('created_at', endOfMonth);
                    awaitingQuery = awaitingQuery.gte('created_at', startOfMonth).lte('created_at', endOfMonth);
                }

                const [
                    { count: activeCount },
                    { count: joinedCount },
                    { count: offerCount },
                    { count: delayedCount },
                    { count: awaitingCount }
                ] = await Promise.all([
                    activeProjectsQuery,
                    joinedQuery,
                    offerQuery,
                    delayedQuery,
                    awaitingQuery
                ]);

                setStats({
                    activeProjects: activeCount || 0,
                    totalJoined: joinedCount || 0,
                    pendingOffers: offerCount || 0,
                    delayedProjects: delayedCount || 0,
                    awaitingConversion: awaitingCount || 0
                });
            } catch (error) {
                console.error('Error fetching admin KPIs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [supabase, selectedMonth]);

    if (loading) {
        return <div className="grid grid-cols-1 md:grid-cols-5 gap-4 animate-pulse">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>)}
        </div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            <div className="bg-white p-6 rounded-lg shadow-sm border border-indigo-100">
                <p className="text-sm font-medium text-indigo-600">Leads to Convert</p>
                <p className="text-2xl font-semibold text-indigo-700 mt-2">{stats.awaitingConversion}</p>
            </div>
        </div>
    );
}
