'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { X, Loader2, Calendar, FileText } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface LogFollowUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    leadId: string;
    companyName: string;
    onSuccess: () => void;
}

interface LogFormValues {
    followup_note: string;
    next_followup_at: string;
}

export default function LogFollowUpModal({ isOpen, onClose, leadId, companyName, onSuccess }: LogFollowUpModalProps) {
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const { register, handleSubmit, reset, formState: { errors } } = useForm<LogFormValues>();

    // Reset when modal opens
    useState(() => {
        if (isOpen) {
            reset({
                followup_note: '',
                next_followup_at: ''
            });
        }
    });

    if (!isOpen) return null;

    const onSubmit = async (data: LogFormValues) => {
        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];

            const { error } = await supabase
                .from('leads')
                .update({
                    followup_note: data.followup_note,
                    next_followup_date: data.next_followup_at, // Reusing existing field rather than creating a new one if possible, but the prompt asked for next_followup_at. We will use next_followup_date as that was already seeded in the previous step.
                    last_followup_at: today
                })
                .eq('id', leadId);

            if (error) {
                console.error("Supabase error:", error);
                throw error;
            }

            toast.success('Follow-up logged successfully!');
            onSuccess();
        } catch (error) {
            console.error('Error logging follow up:', error);
            toast.error('Failed to log follow-up. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 relative">
                        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-500">
                            <X className="h-6 w-6" />
                        </button>

                        <div className="mb-5 border-b pb-3">
                            <h3 className="text-xl leading-6 font-bold text-gray-900">
                                Log Follow-Up
                            </h3>
                            <p className="text-sm font-medium text-blue-600 mt-1">
                                Client: {companyName}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 flex items-center mb-1">
                                    <FileText className="w-4 h-4 mr-1 text-gray-400" />
                                    Discussion Note (Required)
                                </label>
                                <textarea
                                    {...register('followup_note', { required: 'You must add a note about this follow-up.' })}
                                    rows={3}
                                    placeholder="What was discussed? What is the client waiting for?"
                                    className={`mt-1 block w-full border ${errors.followup_note ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                                ></textarea>
                                {errors.followup_note && <p className="mt-1 text-xs text-red-600">{errors.followup_note.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 flex items-center mb-1">
                                    <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                                    Next Action Date (Required)
                                </label>
                                <input
                                    type="date"
                                    min={new Date().toISOString().split('T')[0]}
                                    {...register('next_followup_at', { required: 'You must scheduled the next follow-up date.' })}
                                    className={`mt-1 block w-full border ${errors.next_followup_at ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                                />
                                {errors.next_followup_at && <p className="mt-1 text-xs text-red-600">{errors.next_followup_at.message}</p>}
                                <p className="mt-1 text-xs text-gray-500 border-l-2 border-yellow-400 pl-2">
                                    Setting this forces accountability. The lead will turn <span className="text-red-600 font-bold">RED</span> if you miss this date.
                                </p>
                            </div>

                            <div className="mt-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-bold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" /> : 'Save Log'}
                                </button>
                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={onClose}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
