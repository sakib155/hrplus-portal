'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthProvider';
import { AlertCircle, Clock, Calendar, MessageSquare, Flame } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import LogFollowUpModal from '../marketing/LogFollowUpModal';
import LeadDetailModal from '../marketing/LeadDetailModal';

interface ActionLead {
    id: string;
    company_name: string;
    contact_person: string;
    status: string;
    follow_up_stage: string;
    last_followup_at: string;
    next_followup_date: string | null;
    contract_status: string; // Faked field for now, utilizing follow_up_stage='Contract Pending'
    employees?: { name: string };
    riskReason: string;
    riskColor: 'red' | 'yellow';
}

export default function SalesActionRequiredPanel({ readOnly = false }: { readOnly?: boolean }) {
    const { isSalesLead, user } = useAuth();
    const [leads, setLeads] = useState<ActionLead[]>([]);
    const [loading, setLoading] = useState(true);
    const [loggingLead, setLoggingLead] = useState<{ id: string, name: string } | null>(null);
    const [viewingLead, setViewingLead] = useState<string | null>(null);
    const supabase = createClient();

    const fetchActionLeads = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const fiveDaysAgo = new Date();
            fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
            const fiveDaysAgoStr = fiveDaysAgo.toISOString().split('T')[0];

            let query = supabase
                .from('leads')
                .select('id, company_name, contact_person, status, follow_up_stage, last_followup_at, next_followup_date, employees!lead_responsible_id(name)')
                .not('status', 'in', '("Converted","Lost")');

            if (!isSalesLead) {
                query = query.eq('lead_responsible_id', user.id);
            }

            const { data, error } = await query;
            if (error) throw error;

            const actionItems: ActionLead[] = [];

            (data || []).forEach(lead => {
                let riskReason = '';
                let riskColor: 'red' | 'yellow' | 'none' = 'none';

                // 1. Overdue Follow-Up (Red)
                if (lead.next_followup_date && lead.next_followup_date < today) {
                    riskReason = 'Overdue Follow-up';
                    riskColor = 'red';
                }
                // 2. Contract Pending (Yellow)
                else if (lead.follow_up_stage === 'Contract Pending') {
                    riskReason = 'Contract Pending';
                    riskColor = 'yellow';
                }
                // 3. Silent Lead > 5 Days (Red)
                else if (lead.last_followup_at && lead.last_followup_at < fiveDaysAgoStr && ['Pitched Lead', 'Requirement Discussion'].includes(lead.follow_up_stage)) {
                    riskReason = `Silent > 5 Days`;
                    riskColor = 'red';
                }

                if (riskColor !== 'none') {
                    // Fix type mapping for employees
                    const empName = Array.isArray(lead.employees) ? lead.employees[0]?.name : (lead.employees as any)?.name;
                    actionItems.push({
                        ...lead,
                        employees: { name: empName || 'Unknown' },
                        riskReason,
                        riskColor
                    } as ActionLead);
                }
            });

            // Re-sort: Red risks first, then yellow
            actionItems.sort((a, b) => {
                if (a.riskColor === 'red' && b.riskColor !== 'red') return -1;
                if (b.riskColor === 'red' && a.riskColor !== 'red') return 1;
                return new Date(a.last_followup_at || 0).getTime() - new Date(b.last_followup_at || 0).getTime();
            });

            setLeads(actionItems);
        } catch (error) {
            console.error('Error fetching action leads:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActionLeads();
    }, [user, isSalesLead]);

    if (!user) return null;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-red-100 overflow-hidden mb-6">
            <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center justify-between">
                <div className="flex items-center">
                    <Flame className="h-5 w-5 text-red-500 mr-2" />
                    <h3 className="text-lg font-bold text-red-900">Action Required</h3>
                </div>
                <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {leads.length} Risks
                </span>
            </div>

            {loading ? (
                <div className="p-8 text-center text-gray-500 animate-pulse">Scanning pipeline for risks...</div>
            ) : leads.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500 bg-gray-50">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-green-400 mb-2" />
                    Pipeline is clean. No overdue actions!
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alert</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Silence</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Action</th>
                                {isSalesLead && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>}
                                {!readOnly && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {leads.map(lead => {
                                const daysSilent = differenceInDays(new Date(), new Date(lead.last_followup_at || new Date()));
                                return (
                                    <tr key={lead.id} className={lead.riskColor === 'red' ? 'bg-red-50/30' : 'bg-yellow-50/30'}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${lead.riskColor === 'red' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                                }`}>
                                                {lead.riskColor === 'red' ? <AlertCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                                                {lead.riskReason}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-gray-900">{lead.company_name}</div>
                                            <div className="text-xs text-gray-500">{lead.contact_person}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {lead.follow_up_stage || lead.status}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <span className={daysSilent > 5 ? 'text-red-600' : 'text-gray-900'}>{daysSilent} days</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {lead.next_followup_date ? (
                                                <span className={lead.next_followup_date < new Date().toISOString().split('T')[0] ? 'text-red-600 font-bold' : 'text-gray-900'}>
                                                    {format(new Date(lead.next_followup_date), 'MMM d')}
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
                                                    className="text-blue-600 hover:text-blue-900 mr-4 font-bold"
                                                >
                                                    Log Action
                                                </button>
                                                <button
                                                    onClick={() => setViewingLead(lead.id)}
                                                    className="text-gray-600 hover:text-gray-900"
                                                >
                                                    View
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
                        fetchActionLeads();
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
// Helper unused icon to prevent linting
const CheckCircle2 = ({ className }: { className?: string }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
