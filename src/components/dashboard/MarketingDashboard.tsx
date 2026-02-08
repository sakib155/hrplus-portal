'use client';

import { useState, useEffect } from 'react';
import LeadList from '../marketing/LeadList';
import AddLeadModal from '../marketing/AddLeadModal';
import { Plus, BarChart3 } from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';

export default function MarketingDashboard() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [stats, setStats] = useState({
        totalLeads: 0
    });
    const supabase = createClient();

    useEffect(() => {
        fetchStats();
    }, [isAddModalOpen]); // Refresh when modal closes (new lead potentially added)

    const fetchStats = async () => {
        const { count, error } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true });

        if (!error) {
            setStats(prev => ({ ...prev, totalLeads: count || 0 }));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Marketing Dashboard</h1>
                    <p className="text-gray-600 text-sm">Manage leads, campaigns, and pipeline.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Lead
                </button>
            </div>

            {/* Quick Stats Placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Leads</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalLeads}</p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-blue-500 opacity-20" />
                    </div>
                </div>
                {/* Add more stats later */}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Lead Tracker</h3>
                <LeadList key={isAddModalOpen ? 'refresh' : 'list'} />
                {/* Simple key reset to refresh list on modal close, though ideally LeadList should expose a refresh method or use context */}
            </div>

            <AddLeadModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={() => window.location.reload()} // Simple reload for now to refresh list
            />
        </div>
    );
}
