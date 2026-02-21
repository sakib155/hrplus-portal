'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Loader2, CheckCircle, ChevronRight, User } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface PendingApproval {
    id: string;
    log_date: string;
    content: string;
    created_at: string;
    projects: {
        project_title: string;
    } | null;
    employees: {
        id: string;
        name: string;
    } | null;
}

export default function AdminTaskApprovals() {
    const [tasks, setTasks] = useState<PendingApproval[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchPendingTasks = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('project_logs')
                .select(`
                    id, log_date, content, created_at,
                    projects (project_title),
                    employees (id, name)
                `)
                .eq('type', 'Task')
                .eq('status', 'Completed')
                .order('log_date', { ascending: false });

            if (error) throw error;
            setTasks(data as any || []);
        } catch (error) {
            console.error('Error fetching pending tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingTasks();
    }, []);

    const handleApprove = async (id: string) => {
        try {
            const { error } = await supabase
                .from('project_logs')
                .update({ status: 'Approved' })
                .eq('id', id);

            if (error) throw error;
            toast.success('Task approved!');
            setTasks(prev => prev.filter(t => t.id !== id));
        } catch (error) {
            console.error('Error approving task:', error);
            toast.error('Failed to approve task');
        }
    };

    if (loading) return <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

    if (tasks.length === 0) return null; // Hide panel if nothing to approve

    return (
        <div className="bg-white rounded-lg shadow-sm border border-orange-200 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-orange-200 bg-orange-50 flex items-center justify-between">
                <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-orange-500 mr-2" />
                    <h3 className="text-lg font-bold text-orange-900">Task Approvals Required</h3>
                </div>
                <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {tasks.length} Pending
                </span>
            </div>

            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {tasks.map((task) => (
                    <div key={task.id} className="p-4 hover:bg-orange-50/30 transition flex items-center justify-between group">
                        <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="flex items-center text-sm font-bold text-gray-900">
                                    <User className="h-4 w-4 text-gray-400 mr-1" />
                                    {task.employees?.name || 'Unknown User'}
                                </span>
                                {task.projects && (
                                    <>
                                        <ChevronRight className="h-4 w-4 text-gray-400" />
                                        <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                            {task.projects.project_title}
                                        </span>
                                    </>
                                )}
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap ml-5 border-l-2 border-orange-200 pl-3 py-1">
                                {task.content}
                            </p>
                            <p className="text-xs text-gray-400 mt-2 flex items-center">
                                Completed on {format(new Date(task.log_date), 'MMM d, yyyy h:mm a')}
                            </p>
                        </div>
                        <div className="flex-shrink-0">
                            <button
                                onClick={() => handleApprove(task.id)}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                                Approve
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
