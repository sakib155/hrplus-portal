'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { X, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AssignTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    preSelectedRecruiterId?: string;
}

interface Recruiter {
    id: string;
    name: string;
}

export default function AssignTaskModal({ isOpen, onClose, preSelectedRecruiterId }: AssignTaskModalProps) {
    const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
    const [selectedRecruiter, setSelectedRecruiter] = useState(preSelectedRecruiterId || '');
    const [content, setContent] = useState('');
    const [type, setType] = useState<'Task' | 'Info' | 'Alert'>('Task');
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState<{ id: string, project_title: string }[]>([]);
    const [selectedProject, setSelectedProject] = useState('');
    const supabase = createClient();

    useEffect(() => {
        const fetchRecruiters = async () => {
            const { data } = await supabase
                .from('employees')
                .select('id, name')
                .in('role', ['recruiter', 'team lead'])
                .order('name');

            if (data) setRecruiters(data);
        };

        const fetchProjects = async () => {
            const { data } = await supabase.from('projects').select('id, project_title').eq('status', 'Active').order('project_title');
            if (data) setProjects(data);
        };

        if (isOpen) {
            fetchRecruiters();
            fetchProjects();
            if (preSelectedRecruiterId) setSelectedRecruiter(preSelectedRecruiterId);
        }
    }, [isOpen, preSelectedRecruiterId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRecruiter || !content) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('notifications')
                .insert({
                    recipient_id: selectedRecruiter,
                    sender_id: (await supabase.auth.getUser()).data.user?.id,
                    type,
                    content,
                    link: '/dashboard',
                    is_read: false
                });

            if (error) throw error;

            // If Project is selected, create a Task Log
            if (selectedProject) {
                const { error: logError } = await supabase
                    .from('project_logs')
                    .insert({
                        project_id: selectedProject,
                        recruiter_id: selectedRecruiter,
                        content: `Admin Task: ${content}`,
                        type: 'Task',
                        status: 'Pending',
                        log_date: new Date().toISOString()
                    });

                if (logError) console.error('Error creating task log:', logError);
            }

            toast.success('Task sent successfully');
            setContent('');
            onClose();
        } catch (error) {
            console.error('Error sending task:', error);
            toast.error('Failed to assign task');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-medium text-gray-900">Assign Task / Send Message</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Recipient
                        </label>
                        <select
                            value={selectedRecruiter}
                            onChange={(e) => setSelectedRecruiter(e.target.value)}
                            required
                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                        >
                            <option value="">Select a Recruiter...</option>
                            {recruiters.map((r) => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type
                        </label>
                        <div className="flex space-x-4">
                            {['Task', 'Info', 'Alert'].map((t) => (
                                <label key={t} className="flex items-center">
                                    <input
                                        type="radio"
                                        name="type"
                                        value={t}
                                        checked={type === t}
                                        onChange={(e) => setType(e.target.value as any)}
                                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">{t}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Related Project (Optional)
                        </label>
                        <select
                            value={selectedProject}
                            onChange={(e) => setSelectedProject(e.target.value)}
                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                        >
                            <option value="">None - General Message</option>
                            {projects.map((p) => (
                                <option key={p.id} value={p.id}>{p.project_title}</option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                            Selecting a project will create a formal task in the Activity Log.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Message / Task Details
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            required
                            rows={4}
                            className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Describe the task or message..."
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                            Send
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
