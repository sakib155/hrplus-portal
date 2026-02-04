'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const projectSchema = z.object({
    client_name: z.string().min(1, 'Client name is required'),
    position_title: z.string().min(1, 'Position title is required'),
    openings: z.coerce.number().min(1, 'Must have at least 1 opening'),
    revenue_amount: z.coerce.number().min(0, 'Revenue must be 0 or more').optional(),
    target_close_date: z.string().optional(),
    notes: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export default function CreateProjectForm({ onSuccess }: { onSuccess?: () => void }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const { register, handleSubmit, formState: { errors }, reset } = useForm<ProjectFormValues>({
        resolver: zodResolver(projectSchema) as any,
        defaultValues: {
            openings: 1,
            revenue_amount: 0,
        }
    });

    const onSubmit = async (data: ProjectFormValues) => {
        setLoading(true);
        setError(null);

        try {
            // Get current user (creator)
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const projectTitle = `${data.client_name} – ${data.position_title}`;

            const { error: insertError } = await supabase
                .from('projects')
                .insert({
                    client_name: data.client_name,
                    position_title: data.position_title,
                    project_title: projectTitle,
                    openings: data.openings,
                    revenue_amount: data.revenue_amount || 0,
                    target_close_date: data.target_close_date || null,
                    notes: data.notes,
                    created_by: user.id
                });

            if (insertError) throw insertError;

            reset();
            router.refresh(); // Refresh server data if any
            if (onSuccess) onSuccess();

        } catch (err: any) {
            setError(err.message || 'Failed to create project');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Create New Project</h3>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Client Name</label>
                    <input
                        {...register('client_name')}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                        placeholder="e.g. OpenAI"
                    />
                    {errors.client_name && <p className="text-red-500 text-xs mt-1">{errors.client_name.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Position Title</label>
                    <input
                        {...register('position_title')}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                        placeholder="e.g. AI Engineer"
                    />
                    {errors.position_title && <p className="text-red-500 text-xs mt-1">{errors.position_title.message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Number of Openings</label>
                    <input
                        type="number"
                        {...register('openings')}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                    />
                    {errors.openings && <p className="text-red-500 text-xs mt-1">{errors.openings.message}</p>}
                </div>


                <div>
                    <label className="block text-sm font-medium text-gray-700">Revenue (Estimated, BDT)</label>
                    <div className="relative mt-1 rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span className="text-gray-500 sm:text-sm">৳</span>
                        </div>
                        <input
                            type="number"
                            {...register('revenue_amount')}
                            className="block w-full rounded-md border-gray-300 pl-7 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                            placeholder="0.00"
                        />
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
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Notes (Internal)</label>
                <textarea
                    {...register('notes')}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                />
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                    {loading && <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />}
                    Create Project
                </button>
            </div>
        </form >
    );
}
