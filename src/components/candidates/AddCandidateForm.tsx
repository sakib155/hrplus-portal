'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { logSystemTask } from '@/lib/taskLogger';

const candidateSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    phone: z.string().optional(),
    cv_link: z.string().url('Must be a valid URL'),
    source: z.string().min(1, 'Source is required'),
    designation: z.string().optional(),
    current_company: z.string().optional(),
});

type CandidateFormValues = z.infer<typeof candidateSchema>;

interface Project {
    id: string;
    project_title: string;
}

export default function AddCandidateForm({ projectId, onSuccess }: { projectId?: string; onSuccess: () => void }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>(projectId || '');
    const { user } = useAuth();
    const supabase = createClient();

    const { register, handleSubmit, formState: { errors }, reset } = useForm<CandidateFormValues>({
        resolver: zodResolver(candidateSchema),
    });

    // Fetch projects if projectId is not provided
    useState(() => {
        const fetchProjects = async () => {
            if (!projectId) {
                const { data, error } = await supabase
                    .from('projects')
                    .select('id, project_title')
                    .eq('status', 'Active')
                    .order('created_at', { ascending: false });

                if (!error && data) {
                    setProjects(data);
                }
            }
        };
        fetchProjects();
    });

    const onSubmit = async (data: CandidateFormValues) => {
        if (!user) return;
        if (!selectedProjectId) {
            setError('Please select a project');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error: insertError } = await supabase
                .from('candidates')
                .insert({
                    project_id: selectedProjectId,
                    recruiter_id: user.id,
                    name: data.name,
                    email: data.email || null,
                    phone: data.phone || null,
                    cv_link: data.cv_link,
                    source: data.source,
                    designation: data.designation || null,
                    current_company: data.current_company || null,
                    status: 'Sourced'
                });

            if (insertError) throw insertError;

            // Log Task
            await logSystemTask(selectedProjectId, user.id, 'CANDIDATE_ADDED', `Added candidate ${data.name}`);

            reset();
            onSuccess();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to add candidate');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && <div className="text-red-500 text-sm">{error}</div>}

            {!projectId && (
                <div>
                    <label className="block text-sm font-medium text-gray-700">Select Project</label>
                    <select
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        required
                    >
                        <option value="">-- Select Project --</option>
                        {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.project_title}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input {...register('name')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
                {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Current Designation</label>
                    <input {...register('designation')} placeholder="e.g. Head of Sales" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Current Company</label>
                    <input {...register('current_company')} placeholder="e.g. Google" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input {...register('email')} type="email" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
                    {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input {...register('phone')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">CV Link (Drive)</label>
                <input {...register('cv_link')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" placeholder="https://drive.google.com..." />
                {errors.cv_link && <p className="text-red-500 text-xs">{errors.cv_link.message}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Source</label>
                <select {...register('source')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2">
                    <option value="">Select Source</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="BDJobs">BDJobs</option>
                    <option value="Referral">Referral</option>
                    <option value="Other">Other</option>
                </select>
                {errors.source && <p className="text-red-500 text-xs">{errors.source.message}</p>}
            </div>

            <div className="flex justify-end pt-2">
                <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                    {loading && <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />}
                    Add Candidate
                </button>
            </div>
        </form>
    );
}
