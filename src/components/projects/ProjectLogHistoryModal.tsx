'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Loader2, X, AlertTriangle, Calendar } from 'lucide-react';
import { format } from 'date-fns';

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

interface ProjectLogHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    projectName: string;
}

export default function ProjectLogHistoryModal({ isOpen, onClose, projectId, projectName }: ProjectLogHistoryModalProps) {
    const [logs, setLogs] = useState<ProjectLog[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (isOpen && projectId) {
            fetchLogs();
        }
    }, [isOpen, projectId]);

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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[80vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Project Logs</h3>
                        <p className="text-sm text-gray-500">{projectName}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="animate-spin text-blue-600" />
                        </div>
                    ) : logs.length === 0 ? (
                        <p className="text-center text-gray-500 py-10">No logs found for this project.</p>
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
            </div>
        </div>
    );
}
