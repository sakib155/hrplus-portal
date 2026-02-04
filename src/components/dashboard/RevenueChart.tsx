'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

interface RevenueData {
    name: string;
    value: number;
    fill: string;
}

export default function RevenueChart() {
    const [data, setData] = useState<RevenueData[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const calculateRevenue = async () => {
            try {
                // 1. Fetch all projects with their revenue status
                const { data: projects, error } = await supabase
                    .from('projects')
                    .select(`
                        id, 
                        status, 
                        revenue_amount,
                        candidates (
                            id,
                            status
                        )
                    `);

                if (error) throw error;
                if (!projects) return;

                let realized = 0;
                let potential = 0;
                let lost = 0;

                projects.forEach((project: any) => {
                    const revenue = Number(project.revenue_amount) || 0;
                    const hasJoinedCandidate = project.candidates?.some((c: any) => c.status === 'Joined');

                    if (hasJoinedCandidate) {
                        realized += revenue;
                    } else if (project.status === 'Closed' || project.status === 'Cancelled') {
                        lost += revenue;
                    } else if (project.status === 'Active') {
                        potential += revenue; // Active projects represent potential revenue
                    }
                });

                setData([
                    { name: 'Realized Revenue', value: realized, fill: '#16a34a' }, // Green
                    { name: 'Potential Revenue', value: potential, fill: '#00359e' }, // Brand Blue
                    { name: 'Loss', value: lost, fill: '#dc2626' }, // Red
                ]);

            } catch (error) {
                console.error('Error calculating revenue:', error);
            } finally {
                setLoading(false);
            }
        };

        calculateRevenue();
    }, [supabase]);

    if (loading) return <div className="h-64 bg-gray-50 animate-pulse rounded-lg"></div>;

    const formatCurrency = (value: number) => `৳${value.toLocaleString()}`;

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Revenue Overview (BDT)</h3>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => `৳${value}`} />
                        <Tooltip
                            formatter={(value: any) => [formatCurrency(Number(value || 0)), 'Amount']}
                            cursor={{ fill: 'transparent' }}
                        />
                        <Bar
                            dataKey="value"
                            radius={[4, 4, 0, 0]}
                            barSize={60}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6 text-center border-t pt-4">
                {data.map((item) => (
                    <div key={item.name}>
                        <p className="text-sm text-gray-500">{item.name}</p>
                        <p className="text-lg font-bold" style={{ color: item.fill }}>
                            {formatCurrency(item.value)}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
