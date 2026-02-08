'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Loader2, X, Calendar, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface FollowUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    candidateId: string;
    candidateName: string;
    recruiterId: string;
    onSuccess?: () => void;
}

export default function FollowUpModal({ isOpen, onClose, candidateId, candidateName, recruiterId, onSuccess }: FollowUpModalProps) {
    // Default to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultDate = tomorrow.toISOString().split('T')[0];

    const [date, setDate] = useState(defaultDate);
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('candidate_followups')
                .insert({
                    candidate_id: candidateId,
                    recruiter_id: recruiterId,
                    scheduled_date: date,
                    note: note,
                    status: 'Pending'
                });

            if (error) throw error;

            toast.success('Follow-up scheduled!');
            if (onSuccess) onSuccess();
            onClose();
            setNote(''); // Reset note
        } catch (error: any) {
            console.error('Error scheduling follow-up:', error);
            toast.error('Failed to schedule follow-up');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">Schedule Follow-up</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-blue-50 p-3 rounded-md border border-blue-100 mb-4">
                        <p className="text-sm text-blue-800">
                            Candidate: <span className="font-semibold">{candidateName}</span>
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Follow-up Date
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Calendar className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="date"
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Note / Action
                        </label>
                        <div className="relative">
                            <div className="absolute top-3 left-3 pointer-events-none">
                                <MessageSquare className="h-5 w-5 text-gray-400" />
                            </div>
                            <textarea
                                required
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                rows={3}
                                placeholder="e.g. Call for interview feedback..."
                                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : null}
                            Schedule
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
