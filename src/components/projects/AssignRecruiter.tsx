'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Loader2, UserPlus, Trash2 } from 'lucide-react';

interface Recruiter {
    id: string;
    name: string;
}

export default function AssignRecruiter({ projectId, onUpdate }: { projectId: string; onUpdate: () => void }) {
    const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
    const [selectedRecruiter, setSelectedRecruiter] = useState('');
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const fetchRecruiters = async () => {
            // Fetch all employees with role 'recruiter'
            const { data } = await supabase
                .from('employees')
                .select('id, name')
                .eq('role', 'recruiter');

            if (data) setRecruiters(data);
        };
        fetchRecruiters();
    }, [supabase]);

    const handleAssign = async () => {
        if (!selectedRecruiter) return;
        setLoading(true);

        try {
            const { error } = await supabase
                .from('project_recruiters')
                .insert({
                    project_id: projectId,
                    recruiter_id: selectedRecruiter
                });

            if (error) {
                if (error.code === '23505') { // Unique violation
                    alert('Recruiter already assigned');
                } else {
                    throw error;
                }
            } else {
                onUpdate();
                setSelectedRecruiter('');
            }
        } catch (error) {
            console.error('Error assigning:', error);
            alert('Failed to assign recruiter');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center space-x-2">
            <select
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                value={selectedRecruiter}
                onChange={(e) => setSelectedRecruiter(e.target.value)}
            >
                <option value="">Select Recruiter...</option>
                {recruiters.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                ))}
            </select>
            <button
                onClick={handleAssign}
                disabled={loading || !selectedRecruiter}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            </button>
        </div>
    );
}
