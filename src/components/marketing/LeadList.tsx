import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Edit, Trash2, Phone, Mail, MapPin, Calendar, ExternalLink, Eye, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import LeadDetailModal from './LeadDetailModal';

import AddLeadModal from './AddLeadModal';

interface Lead {
    id: string;
    company_name: string;
    contact_person: string;
    phone: string;
    email: string;
    status: string;
    priority: string;
    next_followup_date: string;
    lead_responsible_id: string;
    lead_owner_id: string;
    created_at: string;
}

// ... interfaces ...

export default function LeadList() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
    const [editingLead, setEditingLead] = useState<Lead | null>(null);
    const supabase = createClient();

    useEffect(() => {
        fetchLeads();
    }, []);


    const fetchLeads = async () => {
        // ... (existing fetch logic) ...
        try {
            const { data, error } = await supabase
                .from('leads')
                .select(`
                    *,
                    employees!lead_responsible_id (name)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLeads(data as any || []);
        } catch (error: any) {
            console.error('Error fetching leads:', error.message || error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this lead? This action cannot be undone.')) return;

        try {
            const { error } = await supabase
                .from('leads')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success('Lead deleted successfully');
            fetchLeads(); // Refresh list
        } catch (error: any) {
            console.error('Error deleting lead:', error);
            toast.error('Failed to delete lead: ' + (error.message || 'Unknown error'));
        }
    };

    // ... getStatusColor ...
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Converted': return 'bg-green-100 text-green-800';
            case 'Requirement Received': return 'bg-blue-100 text-blue-800';
            case 'Contacted': return 'bg-yellow-100 text-yellow-800';
            case 'Lost': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) return <div className="p-4 text-center">Loading leads...</div>;

    return (
        <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manager</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Follow-up</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {leads.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                    No leads found. Add one to get started!
                                </td>
                            </tr>
                        ) : (
                            leads.map((lead) => (
                                <tr key={lead.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{lead.company_name}</div>
                                        {lead.priority && (
                                            <span className={`text-xs font-semibold ${lead.priority === 'High' ? 'text-red-600' :
                                                    lead.priority === 'Medium' ? 'text-yellow-600' :
                                                        'text-green-600'
                                                }`}>
                                                {lead.priority} Priority
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{lead.contact_person}</div>
                                        <div className="text-xs text-gray-500 flex flex-col gap-0.5 mt-1">
                                            {lead.phone && <span className="flex items-center"><Phone className="h-3 w-3 mr-1" />{lead.phone}</span>}
                                            {lead.email && <span className="flex items-center"><Mail className="h-3 w-3 mr-1" />{lead.email}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(lead.status)}`}>
                                            {lead.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {(lead as any).employees?.name || 'Unassigned'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {lead.next_followup_date ? (
                                            <div className="flex items-center text-orange-600">
                                                <Calendar className="h-3 w-3 mr-1" />
                                                {format(new Date(lead.next_followup_date), 'MMM d, yyyy')}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => setSelectedLeadId(lead.id)}
                                            className="text-blue-600 hover:text-blue-900 mr-3 inline-flex items-center"
                                            title="View Details & Log Activity"
                                        >
                                            <MessageSquare className="h-4 w-4 mr-1" />
                                            Log
                                        </button>
                                        <button
                                            onClick={() => setEditingLead(lead)}
                                            className="text-gray-400 hover:text-gray-600 mr-3"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>


                                        // ...

                                        <button
                                            onClick={() => handleDelete(lead.id)}
                                            className="text-red-400 hover:text-red-600"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <LeadDetailModal
                isOpen={!!selectedLeadId}
                leadId={selectedLeadId}
                onClose={() => setSelectedLeadId(null)}
            />

            {editingLead && (
                <AddLeadModal
                    isOpen={!!editingLead}
                    onClose={() => setEditingLead(null)}
                    onSuccess={() => {
                        fetchLeads();
                        setEditingLead(null);
                    }}
                    initialData={editingLead}
                />
            )}
        </div>
    );
}
