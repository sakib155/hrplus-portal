'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { X, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

export interface FollowUpItem {
    id: string;
    type: 'Lead' | 'Project';
    clientName: string;
    position: string;
    stage: string;
    lastResponseDate: string;
    nextFollowupDate: string | null;
    ownerName: string;
    blockReason: string | null;
    priority: string | null;
}

interface UpdateFollowUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: FollowUpItem | null;
    onSuccess: () => void;
}

interface UpdateFormValues {
    follow_up_stage: string;
    next_followup_date: string;
    block_reason: string;
    update_response_date: boolean;
}

const LEAD_STAGES = ['Pitched Lead', 'Requirement Discussion', 'Contract Pending'];
const PROJECT_STAGES = ['Waiting for JD', 'Waiting for CV', 'Waiting for Feedback', 'Active Sourcing', 'Offer Pending'];

export default function UpdateFollowUpModal({ isOpen, onClose, item, onSuccess }: UpdateFollowUpModalProps) {
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const { register, handleSubmit, reset, formState: { errors } } = useForm<UpdateFormValues>({
        defaultValues: {
            follow_up_stage: item?.stage || '',
            next_followup_date: item?.nextFollowupDate ? item.nextFollowupDate.split('T')[0] : '',
            block_reason: item?.blockReason || '',
            update_response_date: true
        }
    });

    // Reset when item changes
    useEffect(() => {
        if (item) {
            reset({
                follow_up_stage: item.stage,
                next_followup_date: item.nextFollowupDate ? item.nextFollowupDate.split('T')[0] : '',
                block_reason: item.blockReason || '',
                update_response_date: false
            });
        }
    }, [item, reset]);

    if (!isOpen || !item) return null;

    const stages = item.type === 'Lead' ? LEAD_STAGES : PROJECT_STAGES;

    const onSubmit = async (data: UpdateFormValues) => {
        setLoading(true);
        try {
            const table = item.type === 'Lead' ? 'leads' : 'projects';

            const updatePayload: any = {
                follow_up_stage: data.follow_up_stage,
                block_reason: data.block_reason || null,
                next_followup_date: data.next_followup_date || null
            };

            if (data.update_response_date) {
                updatePayload.last_response_date = new Date().toISOString().split('T')[0];
            }

            const { error } = await supabase
                .from(table)
                .update(updatePayload)
                .eq('id', item.id);

            if (error) throw error;
            onSuccess();
        } catch (error) {
            console.error('Error updating follow up:', error);
            alert('Failed to update. Please check console for details.');
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

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 relative">
                        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-500">
                            <X className="h-6 w-6" />
                        </button>

                        <div className="mb-4">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Update Status: {item.clientName}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                {item.type === 'Project' ? `Project: ${item.position}` : 'Lead Stage Overview'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Current Stage</label>
                                <select
                                    {...register('follow_up_stage')}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                >
                                    {stages.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Next Follow-Up Date</label>
                                <input
                                    type="date"
                                    {...register('next_followup_date')}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Block Reason / Remarks</label>
                                <textarea
                                    {...register('block_reason')}
                                    rows={2}
                                    placeholder="Why is it stuck? Or any notes?"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                ></textarea>
                            </div>

                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                    <input
                                        id="update_response_date"
                                        type="checkbox"
                                        {...register('update_response_date')}
                                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label htmlFor="update_response_date" className="font-medium text-gray-700">Reset Silence Timer</label>
                                    <p className="text-gray-500">Checking this will mark today as the last response date, making the tracker turn green.</p>
                                </div>
                            </div>

                            <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                >
                                    {loading && <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />}
                                    Save Update
                                </button>
                                <button
                                    type="button"
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
