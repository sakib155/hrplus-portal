'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Loader2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface FollowUp {
    id: string;
    candidate_id: string;
    note: string;
    scheduled_date: string;
    status: 'Pending' | 'Done';
    candidates: {
        name: string;
        project_id: string;
    };
    employees?: {
        name: string;
    };
}

export default function FollowUpList() {
    const [followUps, setFollowUps] = useState<FollowUp[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const today = new Date().toISOString().split('T')[0];

    const fetchFollowUps = async () => {
        try {
            const { data, error } = await supabase
                .from('candidate_followups')
                .select(`
                    id,
                    candidate_id,
                    note,
                    scheduled_date,
                    status,
                    candidates (
                        name,
                        project_id
                    ),
                    employees (
                        name
                    )
                `)
                .eq('status', 'Pending')
                .order('scheduled_date', { ascending: true });

            if (error) throw error;
            setFollowUps(data as any || []);
        } catch (error) {
            console.error('Error fetching follow-ups:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFollowUps();
    }, []);

    const markAsDone = async (id: string) => {
        try {
            const { error } = await supabase
                .from('candidate_followups')
                .update({ status: 'Done' })
                .eq('id', id);

            if (error) throw error;

            toast.success('Follow-up completed!');
            // Optimistic update or refetch
            setFollowUps(prev => prev.filter(f => f.id !== id));
        } catch (error) {
            console.error('Error updating follow-up:', error);
            toast.error('Failed to update status');
        }
    };

    if (loading) return <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

    if (followUps.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">All caught up!</h3>
                <p className="mt-1 text-sm text-gray-500">No pending follow-ups for today.</p>
            </div>
        );
    }

    // Separate into overdue and upcoming/today
    const overdue = followUps.filter(f => f.scheduled_date < today);
    const pending = followUps.filter(f => f.scheduled_date >= today);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gray-500" />
                    Pending Follow-ups
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        {followUps.length}
                    </span>
                </h3>
            </div>

            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {/* Overdue Section */}
                {overdue.length > 0 && (
                    <div className="bg-red-50 px-6 py-2 text-xs font-semibold text-red-700 uppercase tracking-wider">
                        Overdue
                    </div>
                )}
                {overdue.map(followUp => (
                    <FollowUpItem key={followUp.id} followUp={followUp} onDone={markAsDone} isOverdue={true} />
                ))}

                {/* Upcoming Section */}
                {pending.length > 0 && overdue.length > 0 && (
                    <div className="bg-gray-50 px-6 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        upcoming
                    </div>
                )}
                {pending.map(followUp => (
                    <FollowUpItem key={followUp.id} followUp={followUp} onDone={markAsDone} />
                ))}
            </div>
        </div>
    );
}

function FollowUpItem({ followUp, onDone, isOverdue }: { followUp: FollowUp, onDone: (id: string) => void, isOverdue?: boolean }) {
    return (
        <div className="px-6 py-4 hover:bg-gray-50 transition flex items-start justify-between group">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                        {followUp.candidates?.name || 'Unknown Candidate'}
                    </p>
                    {isOverdue && <AlertCircle className="h-4 w-4 text-red-500" />}
                </div>

                <p className="text-sm text-gray-500 mt-1">{followUp.note}</p>
                <div className="flex items-center gap-2 mt-1">
                    <p className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                        Due: {followUp.scheduled_date}
                    </p>
                    {followUp.employees && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            to: {followUp.employees.name}
                        </span>
                    )}
                </div>
            </div>
            <div className="ml-4 flex-shrink-0">
                <button
                    onClick={() => onDone(followUp.id)}
                    className="text-gray-400 hover:text-green-600 transition p-1 rounded-full hover:bg-green-50"
                    title="Mark as Done"
                >
                    <CheckCircle className="h-6 w-6" />
                </button>
            </div>
        </div>
    );
}
