'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Loader2, Plus, Calendar, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/components/AuthProvider';
import ProjectLogModal from './ProjectLogModal';

interface ProjectLog {
    id: string;
    log_date: string;
    content: string;
    blocker: boolean;
    created_at: string;
    recruiter_id: string;
    employees: {
        name: string;
    };
}

export default function ProjectActivityLog({ projectId, projectName }: { projectId: string; projectName: string }) {
    const [logs, setLogs] = useState<ProjectLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const { user } = useAuth();
    const supabase = createClient();

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('project_logs')
                .select(`
                    *,
                    employees (name)
                `)
                .eq('project_id', projectId)
                .order('log_date', { ascending: false });

            if (error) throw error;
            setLogs(data as any || []);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (projectId) {
            fetchLogs();
        }
    }, [projectId]);

    return (
        <div className="bg-white shadow rounded-lg p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-gray-900">Activity & Logs</h2>
                <button
                    onClick={() => setIsLogModalOpen(true)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <Plus className="h-4 w-4 mr-1" />
                    Log Activity
                </button>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-6">
                        <Loader2 className="animate-spin text-indigo-600 h-6 w-6" />
                    </div>
                ) : logs.length === 0 ? (
                    <p className="text-center text-gray-500 py-6 bg-gray-50 rounded-lg border border-gray-100">
                        No activity logged yet. Add a log to keep the team updated!
                    </p>
                ) : (
                    logs.map((log) => (
                        <div key={log.id} className={`border rounded-lg p-4 ${log.blocker ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-900">
                                        {format(new Date(log.log_date), 'MMM d, yyyy')}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        by {log.employees?.name || 'Unknown'}
                                    </span>
                                </div>
                                {log.blocker && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                        Blocker
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{log.content}</p>
                        </div>
                    ))
                )}
            </div>

            {isLogModalOpen && user && (
                <ProjectLogModal
                    isOpen={isLogModalOpen}
                    onClose={() => setIsLogModalOpen(false)}
                    projectId={projectId}
                    projectName={projectName}
                    recruiterId={user.id}
                    onSuccess={fetchLogs}
                />
            )}
        </div>
    );
}
