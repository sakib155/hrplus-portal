'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { differenceInDays, format } from 'date-fns';
import { AlertCircle, Clock, CheckCircle2, AlertTriangle, Calendar } from 'lucide-react';
import UpdateFollowUpModal from './UpdateFollowUpModal';

export interface FollowUpItem {
    id: string;
    type: 'Lead' | 'Project';
    clientName: string;
    position: string;
    stage: string;
    lastResponseDate: string;
    nextFollowupDate: string | null;
    ownerName: string;
    blockReason: string | null;
    priority: string | null;
}

export default function FollowUpTracker({ selectedMonth }: { selectedMonth?: string }) {
    const [items, setItems] = useState<FollowUpItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<FollowUpItem | null>(null);
    const supabase = createClient();

    useEffect(() => {
        fetchTrackerData();
    }, [selectedMonth]);

    const fetchTrackerData = async () => {
        setLoading(true);
        try {
            // Build queries
            let leadsQuery = supabase
                .from('leads')
                .select(`
                    id, company_name, follow_up_stage, last_response_date, 
                    next_followup_date, block_reason, priority,
                    employees!lead_responsible_id (name)
                `)
                .in('status', ['Not Contacted', 'Contacted', 'Requirement Received']);

            let projectsQuery = supabase
                .from('projects')
                .select(`
                    id, client_name, position_title, follow_up_stage, 
                    last_response_date, next_followup_date, block_reason,
                    created_by, employees!created_by (name)
                `)
                .eq('status', 'Active');

            if (selectedMonth) {
                const startOfMonth = `${selectedMonth}-01`;
                const dateObj = new Date(startOfMonth);
                const endOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0).toISOString().split('T')[0];

                leadsQuery = leadsQuery.gte('created_at', startOfMonth).lte('created_at', endOfMonth);
                projectsQuery = projectsQuery.gte('created_at', startOfMonth).lte('created_at', endOfMonth);
            }

            const [{ data: leadsData }, { data: projectsData }] = await Promise.all([
                leadsQuery,
                projectsQuery
            ]);

            const formattedLeads: FollowUpItem[] = (leadsData || []).map(lead => ({
                id: lead.id,
                type: 'Lead',
                clientName: lead.company_name,
                position: 'N/A (Lead Stage)',
                stage: lead.follow_up_stage || 'Pitched Lead',
                lastResponseDate: lead.last_response_date || new Date().toISOString(),
                nextFollowupDate: lead.next_followup_date,
                ownerName: (lead as any).employees?.name || 'Unassigned',
                blockReason: lead.block_reason,
                priority: lead.priority
            }));

            const formattedProjects: FollowUpItem[] = (projectsData || []).map(proj => ({
                id: proj.id,
                type: 'Project',
                clientName: proj.client_name,
                position: proj.position_title,
                stage: proj.follow_up_stage || 'Waiting for JD',
                lastResponseDate: proj.last_response_date || new Date().toISOString(),
                nextFollowupDate: proj.next_followup_date,
                // In a real app, you might join project_recruiters here. Using creator for now.
                ownerName: (proj as any).employees?.name || 'Unassigned',
                blockReason: proj.block_reason,
                priority: 'Medium' // Projects inherently medium/high priority
            }));

            const combined = [...formattedLeads, ...formattedProjects].sort((a, b) => {
                // Sort by oldest response date first (most urgent)
                return new Date(a.lastResponseDate).getTime() - new Date(b.lastResponseDate).getTime();
            });

            setItems(combined);
        } catch (error) {
            console.error('Error fetching tracker data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (lastResponse: string, nextFollowup: string | null) => {
        const daysSinceResponse = differenceInDays(new Date(), new Date(lastResponse));

        if (daysSinceResponse > 14) return 'bg-gray-100 border-l-4 border-gray-400'; // Dormant
        if (daysSinceResponse > 7 || (nextFollowup && new Date(nextFollowup) < new Date())) {
            return 'bg-red-50 border-l-4 border-red-500'; // Stuck/Missed Action
        }
        if (daysSinceResponse >= 3) return 'bg-yellow-50 border-l-4 border-yellow-400'; // Waiting Client
        return 'bg-green-50 border-l-4 border-green-500'; // Active/Recent
    };

    const getStatusBadge = (lastResponse: string, nextFollowup: string | null) => {
        const daysSinceResponse = differenceInDays(new Date(), new Date(lastResponse));

        if (daysSinceResponse > 14) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"><Clock className="w-3 h-3 mr-1" /> Dormant</span>;
        if (daysSinceResponse > 7 || (nextFollowup && new Date(nextFollowup) < new Date())) {
            return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" /> Action Needed</span>;
        }
        if (daysSinceResponse >= 3) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" /> Follow Up</span>;
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" /> On Track</span>;
    };

    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading tracker data...</div>;

    return (
        <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Master Follow-Up Tracker</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Unified view of all pending client actions across Sales and Recruitment.
                    </p>
                </div>
                <div className="flex space-x-4 text-sm">
                    <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div> Active</span>
                    <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></div> Waiting Client (&gt;3d)</span>
                    <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div> Stuck (&gt;7d)</span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type / Client</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stage</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Silence (Days)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Action</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {items.length === 0 ? (
                            <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No items currently tracked.</td></tr>
                        ) : (
                            items.map((item) => {
                                const daysSilent = differenceInDays(new Date(), new Date(item.lastResponseDate));
                                return (
                                    <tr key={item.id + item.type} className={`${getStatusColor(item.lastResponseDate, item.nextFollowupDate)} hover:bg-opacity-50 transition-colors`}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded mr-3 ${item.type === 'Lead' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                                    {item.type}
                                                </span>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{item.clientName}</div>
                                                    <div className="text-sm text-gray-500">{item.position}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-medium text-gray-900">{item.stage}</span>
                                            {item.blockReason && <div className="text-xs text-red-600 mt-1 truncate max-w-[150px]" title={item.blockReason}>Blocked: {item.blockReason}</div>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(item.lastResponseDate, item.nextFollowupDate)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            {daysSilent} days
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.nextFollowupDate ? (
                                                <div className="flex items-center">
                                                    <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                                                    <span className={new Date(item.nextFollowupDate) < new Date() ? 'text-red-600 font-bold' : ''}>
                                                        {format(new Date(item.nextFollowupDate), 'MMM d, yyyy')}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">Not scheduled</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.ownerName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => setSelectedItem(item)}
                                                className="text-indigo-600 hover:text-indigo-900"
                                            >
                                                Update
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <UpdateFollowUpModal
                isOpen={!!selectedItem}
                item={selectedItem}
                onClose={() => setSelectedItem(null)}
                onSuccess={() => {
                    setSelectedItem(null);
                    fetchTrackerData();
                }}
            />
        </div>
    );
}
