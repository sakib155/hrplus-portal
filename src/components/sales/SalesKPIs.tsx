'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthProvider';

export default function SalesKPIs() {
    const { isSalesLead, user } = useAuth();
    const [stats, setStats] = useState({
        totalLeads: 0,
        convertedLeads: 0,
        activeProjects: 0,
        estimatedRevenue: 0
    });
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (!user) return;

        const fetchStats = async () => {
            try {
                // 1. Total Leads
                let leadsQuery = supabase.from('leads').select('*', { count: 'exact', head: true });
                if (!isSalesLead) {
                    leadsQuery = leadsQuery.eq('lead_responsible_id', user.id);
                }
                const { count: totalLeads } = await leadsQuery;

                // 2. Converted Leads
                let convertedQuery = supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'Converted');
                if (!isSalesLead) {
                    convertedQuery = convertedQuery.eq('lead_responsible_id', user.id);
                }
                const { count: convertedLeads } = await convertedQuery;

                // 3. Active Projects from these leads (and revenue)
                // We use an inner join to only get projects linked to leads this user is responsible for
                let projectsQuery = supabase.from('projects')
                    .select('id, revenue_amount, status, lead_id, leads!inner(lead_responsible_id)')
                    .eq('status', 'Active')
                    .not('lead_id', 'is', null);

                if (!isSalesLead) {
                    projectsQuery = projectsQuery.eq('leads.lead_responsible_id', user.id);
                }

                const { data: projects } = await projectsQuery;

                const activeProjects = projects?.length || 0;
                const estimatedRevenue = projects?.reduce((sum, p) => sum + (Number(p.revenue_amount) || 0), 0) || 0;

                setStats({
                    totalLeads: totalLeads || 0,
                    convertedLeads: convertedLeads || 0,
                    activeProjects,
                    estimatedRevenue
                });
            } catch (error) {
                console.error('Error fetching sales KPIs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [supabase, user, isSalesLead]);

    if (loading) {
        return <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-lg"></div>)}
        </div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <p className="text-sm font-medium text-gray-500">Total Leads</p>
                <p className="text-2xl font-semibold text-gray-900 mt-2">{stats.totalLeads}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <p className="text-sm font-medium text-gray-500">Converted Leads</p>
                <p className="text-2xl font-semibold text-green-600 mt-2">{stats.convertedLeads}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-indigo-100">
                <p className="text-sm font-medium text-indigo-600">Generated Projects</p>
                <p className="text-2xl font-semibold text-indigo-700 mt-2">{stats.activeProjects}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-green-100">
                <p className="text-sm font-medium text-green-600">Pipeline Revenue</p>
                <p className="text-2xl font-semibold text-green-700 mt-2">
                    ৳{stats.estimatedRevenue.toLocaleString()}
                </p>
            </div>
        </div>
    );
}
