'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthProvider';
import { FileSignature, Clock, Calendar } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import LogFollowUpModal from '../marketing/LogFollowUpModal';
import LeadDetailModal from '../marketing/LeadDetailModal';

// Using same ActionLead interface for simplicity
interface ContractLead {
    id: string;
    company_name: string;
    contact_person: string;
    last_followup_at: string;
    next_followup_date: string | null;
    employees?: { name: string };
}

export default function ContractTrackerPanel({ readOnly = false }: { readOnly?: boolean }) {
    const { isSalesLead, user } = useAuth();
    const [leads, setLeads] = useState<ContractLead[]>([]);
    const [loading, setLoading] = useState(true);
    const [loggingLead, setLoggingLead] = useState<{ id: string, name: string } | null>(null);
    const [viewingLead, setViewingLead] = useState<string | null>(null);
    const supabase = createClient();

    const fetchContractLeads = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Find leads where we are waiting on a contract
            let query = supabase
                .from('leads')
                .select('id, company_name, contact_person, follow_up_stage, last_followup_at, next_followup_date, employees!lead_responsible_id(name)')
                .in('status', ['Requirement Received', 'Contacted']) // Typical statuses where a contract might be out
                .eq('follow_up_stage', 'Contract Pending');

            if (!isSalesLead) {
                query = query.eq('lead_responsible_id', user.id);
            }

            const { data, error } = await query;
            if (error) throw error;

            const contractItems = (data || []).map(lead => ({
                id: lead.id,
                company_name: lead.company_name,
                contact_person: lead.contact_person,
                last_followup_at: lead.last_followup_at || new Date().toISOString(),
                next_followup_date: lead.next_followup_date,
                employees: { name: Array.isArray(lead.employees) ? lead.employees[0]?.name : (lead.employees as any)?.name || 'Unknown' }
            }));

            // Sort by oldest last_followup_at first (longest waiting)
            contractItems.sort((a, b) => new Date(a.last_followup_at).getTime() - new Date(b.last_followup_at).getTime());

            setLeads(contractItems);
        } catch (error) {
            console.error('Error fetching contract leads:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContractLeads();
    }, [user, isSalesLead]);

    if (!user) return null;

    if (!loading && leads.length === 0) {
        return null; // Don't show the panel if there are no pending contracts to save space
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-yellow-200 overflow-hidden mb-6">
            <div className="bg-yellow-50 px-6 py-4 border-b border-yellow-200 flex items-center justify-between">
                <div className="flex items-center">
                    <FileSignature className="h-5 w-5 text-yellow-600 mr-2" />
                    <h3 className="text-lg font-bold text-yellow-900">Contract Pending Tracker</h3>
                </div>
                <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {leads.length} Pending
                </span>
            </div>

            {loading ? (
                <div className="p-8 text-center text-gray-500 animate-pulse">Loading pending contracts...</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-yellow-50/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Pending</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Follow-up</th>
                                {isSalesLead && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>}
                                {!readOnly && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {leads.map(lead => {
                                const daysPending = differenceInDays(new Date(), new Date(lead.last_followup_at));
                                const isOverdue = lead.next_followup_date && new Date(lead.next_followup_date) < new Date(new Date().setHours(0, 0, 0, 0));

                                return (
                                    <tr key={lead.id} className="hover:bg-yellow-50/30">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-gray-900">{lead.company_name}</div>
                                            <div className="text-xs text-gray-500">{lead.contact_person}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <span className="flex items-center text-yellow-700">
                                                <Clock className="w-3 h-3 mr-1" />
                                                {daysPending} days
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {lead.next_followup_date ? (
                                                <span className={`flex items-center ${isOverdue ? 'text-red-600 font-bold' : 'text-gray-900'}`}>
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    {format(new Date(lead.next_followup_date), 'MMM d, yyyy')}
                                                </span>
                                            ) : <span className="text-gray-400">Not set</span>}
                                        </td>
                                        {isSalesLead && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {lead.employees?.name}
                                            </td>
                                        )}
                                        {!readOnly && (
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => setLoggingLead({ id: lead.id, name: lead.company_name })}
                                                    className="text-yellow-700 hover:text-yellow-900 mr-4 font-bold bg-yellow-50 px-2 py-1 rounded border border-yellow-200"
                                                >
                                                    Push Client
                                                </button>
                                                <button
                                                    onClick={() => setViewingLead(lead.id)}
                                                    className="text-gray-500 hover:text-gray-700 underline text-xs"
                                                >
                                                    Details
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

            {loggingLead && (
                <LogFollowUpModal
                    isOpen={!!loggingLead}
                    onClose={() => setLoggingLead(null)}
                    leadId={loggingLead.id}
                    companyName={loggingLead.name}
                    onSuccess={() => {
                        fetchContractLeads();
                        setLoggingLead(null);
                    }}
                />
            )}

            <LeadDetailModal
                isOpen={!!viewingLead}
                leadId={viewingLead}
                onClose={() => setViewingLead(null)}
            />
        </div>
    );
}
