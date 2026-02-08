'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Loader2, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface TaskLog {
    id: string;
    log_date: string;
    content: string;
    status: 'Pending' | 'Completed' | 'Approved';
    projects: {
        project_title: string;
    };
}

interface RecruiterTaskLogProps {
    recruiterId?: string;
}

export default function RecruiterTaskLog({ recruiterId }: RecruiterTaskLogProps) {
    const [tasks, setTasks] = useState<TaskLog[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchTasks = async () => {
        try {
            let targetId = recruiterId;

            if (!targetId) {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                targetId = user.id;
            }

            const { data, error } = await supabase
                .from('project_logs')
                .select(`
                    id, log_date, content, status,
                    projects (project_title)
                `)
                .eq('recruiter_id', targetId)
                .eq('type', 'Task')
                .in('status', ['Pending', 'Completed']) // Don't show Approved
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTasks(data as any || []);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [recruiterId]);

    const markAsDone = async (id: string) => {
        try {
            const { error } = await supabase
                .from('project_logs')
                .update({ status: 'Completed' })
                .eq('id', id);

            if (error) throw error;

            setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'Completed' } : t));
            toast.success('Task marked as done! Waiting for Admin approval.');
        } catch (error) {
            toast.error('Failed to update task');
        }
    };

    if (loading) return <div className="animate-pulse h-20 bg-gray-100 rounded-lg"></div>;
    if (tasks.length === 0) return null; // Don't show if no tasks

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-600" />
                Assigned Tasks
            </h3>
            <div className="space-y-4">
                {tasks.map((task) => (
                    <div key={task.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                                    {task.projects?.project_title}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {format(new Date(task.log_date), 'MMM d')}
                                </span>
                            </div>
                            <p className="text-sm text-gray-800">{task.content}</p>
                        </div>

                        {task.status === 'Pending' ? (
                            !recruiterId && (
                                <button
                                    onClick={() => markAsDone(task.id)}
                                    className="flex-shrink-0 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 shadow-sm"
                                >
                                    <CheckCircle className="h-3 w-3 mr-1.5" />
                                    Mark Done
                                </button>
                            )
                        ) : (
                            <div className="flex-shrink-0 flex items-center text-xs font-medium text-orange-600 bg-orange-50 px-3 py-1.5 rounded-md border border-orange-100">
                                <Clock className="h-3 w-3 mr-1.5" />
                                Waiting Approval
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
