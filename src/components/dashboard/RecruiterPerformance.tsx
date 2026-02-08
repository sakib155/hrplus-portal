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
                // Fetch all data in parallel
                const [recruitersResponse, projectsResponse, candidatesResponse] = await Promise.all([
                    supabase
                        .from('employees')
                        .select('id, name')
                        .in('role', ['recruiter', 'admin', 'lead']),
                    supabase
                        .from('project_recruiters')
                        .select('recruiter_id'),
                    supabase
                        .from('candidates')
                        .select('recruiter_id, status')
                ]);

                if (recruitersResponse.error) throw recruitersResponse.error;
                if (projectsResponse.error) throw projectsResponse.error;
                if (candidatesResponse.error) throw candidatesResponse.error;

                const recruiters = recruitersResponse.data || [];
                const projects = projectsResponse.data || [];
                const candidates = candidatesResponse.data || [];

                // Aggregate stats in memory
                const statsMap = new Map<string, RecruiterStats>();

                // Initialize map
                recruiters.forEach(r => {
                    statsMap.set(r.id, {
                        id: r.id,
                        name: r.name,
                        project_count: 0,
                        candidate_count: 0,
                        joined_count: 0
                    });
                });

                // Count Projects
                projects.forEach((p: any) => {
                    const rec = statsMap.get(p.recruiter_id);
                    if (rec) {
                        rec.project_count++;
                    }
                });

                // Count Candidates & Joined
                candidates.forEach((c: any) => {
                    const rec = statsMap.get(c.recruiter_id);
                    if (rec) {
                        rec.candidate_count++;
                        if (c.status === 'Joined') {
                            rec.joined_count++;
                        }
                    }
                });

                setStats(Array.from(statsMap.values()));

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
