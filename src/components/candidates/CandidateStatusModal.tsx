'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { createClient } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

interface Candidate {
    id: string;
    name: string;
    status: string;
    email?: string;
    phone?: string;
    designation?: string;
    current_company?: string;
    cv_link: string;
    joining_letter_link?: string;
    admin_approved_joining?: boolean;
}

interface StatusFormValues {
    status: string;
    name: string;
    email?: string;
    phone?: string;
    designation?: string;
    current_company?: string;
    cv_link: string;
    joining_date?: string;
    joining_letter_link?: string;
    internal_result?: string;
    client_feedback_status?: string;
}

export default function CandidateStatusModal({ candidate, onClose, onUpdate }: { candidate: Candidate; onClose: () => void; onUpdate: () => void }) {
    const [loading, setLoading] = useState(false);
    const { isAdmin } = useAuth();
    const supabase = createClient();

    const { register, handleSubmit, watch, formState: { errors } } = useForm<StatusFormValues>({
        defaultValues: {
            status: candidate.status,
            name: candidate.name,
            email: candidate.email || '',
            phone: candidate.phone || '',
            designation: candidate.designation || '',
            current_company: candidate.current_company || '',
            cv_link: candidate.cv_link,
        }
    });

    const selectedStatus = watch('status');

    const onSubmit = async (data: StatusFormValues) => {
        setLoading(true);
        try {
            const updates: any = {
                status: data.status,
                name: data.name,
                email: data.email || null,
                phone: data.phone || null,
                designation: data.designation || null,
                current_company: data.current_company || null,
                cv_link: data.cv_link
            };

            if (data.status === 'Joined') {
                if (!data.joining_date || !data.joining_letter_link) {
                    throw new Error('Joining Date and Joining Letter Link are required for Joined status.');
                }
                updates.joining_date = data.joining_date;
                updates.joining_letter_link = data.joining_letter_link;
            }

            const { error } = await supabase
                .from('candidates')
                .update(updates)
                .eq('id', candidate.id);

            if (error) throw error;

            onUpdate();
            onClose();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAdminApprove = async () => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('candidates')
                .update({ admin_approved_joining: true })
                .eq('id', candidate.id);

            if (error) throw error;
            onUpdate();
            onClose();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const isLocked = candidate.admin_approved_joining && !isAdmin;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Edit Candidate: {candidate.name}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <span className="sr-only">Close</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {isLocked ? (
                    <div className="text-red-500 mb-4 font-medium p-3 bg-red-50 rounded">
                        This record is locked because the candidate has been approved as Joined. Only Admins can edit.
                    </div>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Status Section */}
                        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Current Status*</label>
                            <select {...register('status')} className="block w-full border-gray-300 rounded-md border p-2 bg-white">
                                <option value="Sourced">Sourced</option>
                                <option value="Shortlisted">Shortlisted</option>
                                <option value="Internal Pass">Internal Pass</option>
                                <option value="Submitted">Submitted</option>
                                <option value="Interview">Interview</option>
                                <option value="Offer">Offer</option>
                                <option value="Joined">Joined</option>
                                <option value="Not Joined">Not Joined</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                <input {...register('name')} className="mt-1 block w-full border-gray-300 rounded-md border p-2" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input {...register('email')} className="mt-1 block w-full border-gray-300 rounded-md border p-2" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Phone</label>
                                <input {...register('phone')} className="mt-1 block w-full border-gray-300 rounded-md border p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">CV Link</label>
                                <input {...register('cv_link')} className="mt-1 block w-full border-gray-300 rounded-md border p-2" required />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Designation</label>
                                <input {...register('designation')} className="mt-1 block w-full border-gray-300 rounded-md border p-2" placeholder="Start typing" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Current Company</label>
                                <input {...register('current_company')} className="mt-1 block w-full border-gray-300 rounded-md border p-2" placeholder="Start typing" />
                            </div>
                        </div>

                        {selectedStatus === 'Joined' && (
                            <div className="bg-green-50 p-4 rounded-md border border-green-200 space-y-4">
                                <h4 className="font-medium text-green-800">Joining Details</h4>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Joining Date</label>
                                    <input type="date" {...register('joining_date')} className="mt-1 block w-full border-gray-300 rounded-md border p-2" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Joining Letter Link (Drive)</label>
                                    <input type="url" {...register('joining_letter_link')} className="mt-1 block w-full border-gray-300 rounded-md border p-2" required />
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                Cancel
                            </button>
                            <button type="submit" disabled={loading} className="inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                                {loading && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                                Save Changes
                            </button>
                        </div>
                    </form>
                )}

                {/* Admin Approval Button */}
                {isAdmin && candidate.status === 'Joined' && !candidate.admin_approved_joining && (
                    <div className="mt-4 border-t pt-4">
                        <p className="text-sm text-yellow-600 mb-2">Candidate has joined but not approved.</p>
                        <button
                            onClick={handleAdminApprove}
                            disabled={loading}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-md font-bold"
                        >
                            Approve Joining (Lock Record)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
