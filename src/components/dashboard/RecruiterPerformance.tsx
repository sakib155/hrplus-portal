'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

interface RecruiterStats {
    id: string;
    name: string;
    project_count: number;
    candidate_count: number;
    joined_count: number;
}

export default function RecruiterPerformance() {
    const [stats, setStats] = useState<RecruiterStats[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // 1. Fetch all recruiters
                const { data: recruiters, error: rError } = await supabase
                    .from('employees')
                    .select('id, name')
                    .eq('role', 'recruiter');

                if (rError) throw rError;

                if (!recruiters || recruiters.length === 0) {
                    setStats([]);
                    return;
                }

                // 2. Fetch stats for each recruiter parallelly
                const statsPromises = recruiters.map(async (recruiter) => {
                    // Count Projects
                    const { count: projectCount } = await supabase
                        .from('project_recruiters')
                        .select('*', { count: 'exact', head: true })
                        .eq('recruiter_id', recruiter.id);

                    // Count Candidates
                    const { count: candidateCount } = await supabase
                        .from('candidates')
                        .select('*', { count: 'exact', head: true })
                        .eq('recruiter_id', recruiter.id);

                    // Count Joined
                    const { count: joinedCount } = await supabase
                        .from('candidates')
                        .select('*', { count: 'exact', head: true })
                        .eq('recruiter_id', recruiter.id)
                        .eq('status', 'Joined');

                    return {
                        id: recruiter.id,
                        name: recruiter.name,
                        project_count: projectCount || 0,
                        candidate_count: candidateCount || 0,
                        joined_count: joinedCount || 0,
                    };
                });

                const results = await Promise.all(statsPromises);
                setStats(results);

            } catch (error) {
                console.error('Error fetching performance:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [supabase]);

    if (loading) return <div className="flex justify-center p-4"><Loader2 className="animate-spin h-6 w-6 text-blue-600" /></div>;

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recruiter</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active Projects</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidates Sourced</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {stats.map((stat) => (
                        <tr key={stat.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                <Link href={`/admin/recruiters/${stat.id}`} className="hover:underline">
                                    {stat.name}
                                </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stat.project_count}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stat.candidate_count}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold">{stat.joined_count}</td>
                        </tr>
                    ))}
                    {stats.length === 0 && (
                        <tr>
                            <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                                No recruiters found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
