'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Loader2, Calendar, AlertTriangle, User } from 'lucide-react';
import { format } from 'date-fns';

interface Log {
    id: string;
    log_date: string;
    content: string;
    blocker: boolean;
    type?: 'Log' | 'Task';
    status?: 'Pending' | 'Completed' | 'Approved';
    created_at: string;
    projects: {
        project_title: string;
    };
    employees: {
        id: string;
        name: string;
    };
}

interface Recruiter {
    id: string;
    name: string;
}

export default function AdminActivityLog() {
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);
    const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
    const [selectedRecruiter, setSelectedRecruiter] = useState<string>('all');
    const supabase = createClient();

    useEffect(() => {
        fetchRecruiters();
        fetchLogs();
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [selectedRecruiter]);

    const fetchRecruiters = async () => {
        const { data } = await supabase
            .from('employees')
            .select('id, name')
            .in('role', ['recruiter', 'team lead'])
            .order('name');

        if (data) setRecruiters(data);
    };

    const fetchLogs = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('project_logs')
                .select(`
                    *,
                    projects (project_title),
                    employees (id, name)
                `);

            if (selectedRecruiter !== 'all') {
                query = query.eq('recruiter_id', selectedRecruiter);
            }

            const { data, error } = await query
                .order('log_date', { ascending: false })
                .limit(50);

            console.log('Fetched logs:', data?.length);

            if (error) throw error;
            setLogs(data as any || []);
        } catch (error) {
            console.error('Error fetching activity logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const approveTask = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row click if added later
        try {
            const { error } = await supabase
                .from('project_logs')
                .update({ status: 'Approved' })
                .eq('id', id);

            if (error) throw error;
            setLogs(prev => prev.map(l => l.id === id ? { ...l, status: 'Approved' } : l));
        } catch (error) {
            console.error('Error approving task:', error);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center flex-wrap gap-4">
                <h3 className="text-lg font-medium text-gray-900">Activity & Task Log</h3>

                <select
                    value={selectedRecruiter}
                    onChange={(e) => setSelectedRecruiter(e.target.value)}
                    className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                    <option value="all">All Recruiters</option>
                    {recruiters.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                </select>
            </div>

            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="animate-spin text-blue-600" />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                        No activity logs found.
                    </div>
                ) : (
                    logs.map((log) => (
                        <div key={log.id} className={`p-6 transition ${log.type === 'Task' ? 'bg-blue-50/30' : 'hover:bg-gray-50'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <span className="flex items-center text-sm font-medium text-gray-900">
                                        <User className="h-4 w-4 text-gray-400 mr-1" />
                                        {log.employees?.name || 'Unknown'}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        on <span className="font-medium text-gray-700">{log.projects?.project_title}</span>
                                    </span>
                                    <span className="flex items-center text-xs text-gray-400">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        {format(new Date(log.log_date), 'MMM d, yyyy')}
                                    </span>
                                    {log.type === 'Task' && (
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${log.status === 'Approved' ? 'bg-green-100 text-green-800 border-green-200' :
                                            log.status === 'Completed' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                                'bg-blue-100 text-blue-800 border-blue-200'
                                            }`}>
                                            Task: {log.status}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {log.blocker && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            <AlertTriangle className="w-3 h-3 mr-1" />
                                            Blocker
                                        </span>
                                    )}
                                    {log.type === 'Task' && log.status === 'Completed' && (
                                        <button
                                            onClick={(e) => approveTask(log.id, e)}
                                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 shadow-sm"
                                        >
                                            Approve
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap pl-5 border-l-2 border-gray-200 ml-1">
                                {log.content}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
