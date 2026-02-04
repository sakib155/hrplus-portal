'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@/lib/supabaseClient';
import { Loader2, X, Edit2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const projectSchema = z.object({
    client_name: z.string().min(1, 'Client name is required'),
    position_title: z.string().min(1, 'Position title is required'),
    openings: z.coerce.number().min(1, 'Must have at least 1 opening'),
    revenue_amount: z.coerce.number().min(0, 'Revenue must be 0 or more').optional(),
    target_close_date: z.string().optional(),
    notes: z.string().optional(),
    status: z.enum(['Active', 'On Hold', 'Closed', 'Cancelled']),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface EditProjectModalProps {
    project: any;
    onUpdate: () => void;
}

export default function EditProjectModal({ project, onUpdate }: EditProjectModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const { register, handleSubmit, formState: { errors }, reset } = useForm<ProjectFormValues>({
        resolver: zodResolver(projectSchema) as any,
        defaultValues: {
            client_name: project.client_name,
            position_title: project.position_title,
            openings: project.openings,
            revenue_amount: project.revenue_amount || 0,
            target_close_date: project.target_close_date || '',
            notes: project.notes || '',
            status: project.status,
        }
    });

    const onSubmit = async (data: ProjectFormValues) => {
        setLoading(true);
        setError(null);

        try {
            const projectTitle = `${data.client_name} – ${data.position_title}`;

            const { error: updateError } = await supabase
                .from('projects')
                .update({
                    client_name: data.client_name,
                    position_title: data.position_title,
                    project_title: projectTitle,
                    openings: data.openings,
                    revenue_amount: data.revenue_amount || 0,
                    target_close_date: data.target_close_date || null,
                    notes: data.notes,
                    status: data.status,
                })
                .eq('id', project.id);

            if (updateError) throw updateError;

            setIsOpen(false);
            onUpdate();
            router.refresh();

        } catch (err: any) {
            setError(err.message || 'Failed to update project');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                <Edit2 className="-ml-0.5 mr-2 h-4 w-4 text-gray-500" />
                Edit Project
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                aria-hidden="true"
                onClick={() => setIsOpen(false)}
            ></div>

            {/* Modal Panel */}
            <div className="relative bg-white rounded-lg text-left shadow-xl transform transition-all sm:max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">Edit Project</h3>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-500">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Status</label>
                            <select
                                {...register('status')}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                            >
                                <option value="Active">Active</option>
                                <option value="On Hold">On Hold</option>
                                <option value="Closed">Closed</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Client Name</label>
                                <input
                                    {...register('client_name')}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                />
                                {errors.client_name && <p className="text-red-500 text-xs mt-1">{errors.client_name.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Position Title</label>
                                <input
                                    {...register('position_title')}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                />
                                {errors.position_title && <p className="text-red-500 text-xs mt-1">{errors.position_title.message}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Openings</label>
                                <input
                                    type="number"
                                    {...register('openings')}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Revenue (৳)</label>
                                <div className="relative mt-1 rounded-md shadow-sm">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <span className="text-gray-500 sm:text-sm">৳</span>
                                    </div>
                                    <input
                                        type="number"
                                        {...register('revenue_amount')}
                                        className="block w-full rounded-md border-gray-300 pl-7 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Target Close Date</label>
                            <input
                                type="date"
                                {...register('target_close_date')}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Notes</label>
                            <textarea
                                {...register('notes')}
                                rows={3}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                            />
                        </div>

                        <div className="mt-5 sm:mt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm disabled:opacity-50"
                            >
                                {loading && <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
