'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Loader2, X, FileText, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface ProjectLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    projectName: string;
    recruiterId: string;
    onSuccess?: () => void;
}

export default function ProjectLogModal({ isOpen, onClose, projectId, projectName, recruiterId, onSuccess }: ProjectLogModalProps) {
    const defaultDate = new Date().toISOString().split('T')[0];

    const [date, setDate] = useState(defaultDate);
    const [content, setContent] = useState('');
    const [isBlocker, setIsBlocker] = useState(false);
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('project_logs')
                .insert({
                    project_id: projectId,
                    recruiter_id: recruiterId,
                    log_date: date,
                    content: content,
                    blocker: isBlocker
                });

            if (error) throw error;

            toast.success('Daily log added!');
            if (onSuccess) onSuccess();
            onClose();
            setContent(''); // Reset content
            setIsBlocker(false);
        } catch (error: any) {
            console.error('Error adding log:', error);
            toast.error('Failed to add log');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">Add Project Log</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-indigo-50 p-3 rounded-md border border-indigo-100 mb-4">
                        <p className="text-sm text-indigo-800">
                            Project: <span className="font-semibold">{projectName}</span>
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Log Date
                        </label>
                        <input
                            type="date"
                            required
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Daily Update / Note
                        </label>
                        <textarea
                            required
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={4}
                            placeholder="e.g. Sent 3 CVs, waiting for client feedback..."
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                        />
                    </div>

                    <div className="flex items-center">
                        <input
                            id="blocker"
                            type="checkbox"
                            checked={isBlocker}
                            onChange={(e) => setIsBlocker(e.target.checked)}
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                        />
                        <label htmlFor="blocker" className="ml-2 block text-sm text-gray-900 flex items-center gap-1">
                            Mark as Blocker / Delay
                            <AlertTriangle className="h-3 w-3 text-red-500" />
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : null}
                            Save Log
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
