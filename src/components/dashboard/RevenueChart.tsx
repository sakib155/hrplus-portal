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
import { startOfYear, endOfYear, eachMonthOfInterval, format, isWithinInterval, subMonths, eachWeekOfInterval } from 'date-fns';

// Revenue Chart Component - Visualizes Realized vs Potential Revenue
interface RevenueData {
    name: string;
    realized: number;
    potential: number;
    lost: number;
    sortDate?: Date;
}

export default function RevenueChart() {
    const [data, setData] = useState<RevenueData[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        start: format(startOfYear(new Date()), 'yyyy-MM-dd'),
        end: format(endOfYear(new Date()), 'yyyy-MM-dd')
    });
    const supabase = createClient();

    useEffect(() => {
        const calculateRevenue = async () => {
            setLoading(true);
            try {
                // 1. Fetch all projects with their revenue status
                const { data: projects, error } = await supabase
                    .from('projects')
                    .select(`
                        id, 
                        status, 
                        revenue_amount,
                        created_at,
                        candidates (
                            id,
                            status
                        )
                    `);

                if (error) throw error;
                if (!projects) return;

                // Date Range Logic
                let startDate = new Date(dateRange.start);
                let endDate = new Date(dateRange.end);

                // Adjust to start/end of day to be inclusive
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);

                // Determine grouping: > 90 days = Month, <= 90 days = Week
                const diffInDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
                const groupBy = diffInDays > 90 ? 'month' : 'week';

                // Initialize Map
                const dataMap = new Map<string, { name: string; realized: number; potential: number; lost: number; sortDate: Date }>();

                // Pre-fill map to show empty periods
                if (groupBy === 'month') {
                    const months = eachMonthOfInterval({ start: startDate, end: endDate });
                    months.forEach(month => {
                        const key = format(month, 'MMM yyyy');
                        dataMap.set(key, { name: format(month, 'MMM'), realized: 0, potential: 0, lost: 0, sortDate: month });
                    });
                } else {
                    const weeks = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 });
                    weeks.forEach(week => {
                        const key = format(week, 'yyyy-Iw'); // ISO week
                        const label = `W${format(week, 'w')} ${format(week, 'MMM')}`;
                        dataMap.set(key, { name: label, realized: 0, potential: 0, lost: 0, sortDate: week });
                    });
                }

                projects.forEach((project: any) => {
                    const projectDate = new Date(project.created_at);

                    if (!isWithinInterval(projectDate, { start: startDate, end: endDate })) {
                        return;
                    }

                    const revenue = Number(project.revenue_amount) || 0;
                    const hasJoinedCandidate = project.candidates?.some((c: any) => c.status === 'Joined');

                    let key = '';
                    if (groupBy === 'month') {
                        key = format(projectDate, 'MMM yyyy');
                    } else {
                        key = format(projectDate, 'yyyy-Iw');
                    }

                    // Fallback for edge cases (e.g. week calculation might differ slightly)
                    // If pre-fill didn't catch it, we add it (though chart x-axis might be messy if not sorted)
                    // For simply logic, if it's not in map (due to week boundary diffs), find closest or just add.
                    // Let's rely on date-fns consistency.

                    if (dataMap.has(key)) {
                        const entry = dataMap.get(key)!;
                        if (hasJoinedCandidate) {
                            entry.realized += revenue;
                        } else if (project.status === 'Closed' || project.status === 'Cancelled') {
                            entry.lost += revenue;
                        } else if (project.status === 'Active') {
                            entry.potential += revenue;
                        }
                    }
                });

                // Convert to array and sort by date
                const processedData = Array.from(dataMap.values())
                    .sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime());

                setData(processedData);

            } catch (error) {
                console.error('Error calculating revenue:', error);
            } finally {
                setLoading(false);
            }
        };

        calculateRevenue();
    }, [supabase, dateRange]);

    const formatCurrency = (value: number) => `৳${value.toLocaleString()}`;

    // Calculate totals for the summary cards
    const totalRealized = data.reduce((acc, item) => acc + (item.realized || 0), 0);
    const totalPotential = data.reduce((acc, item) => acc + (item.potential || 0), 0);
    const totalLost = data.reduce((acc, item) => acc + (item.lost || 0), 0);

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Revenue Overview (BDT)</h3>
                <div className="flex items-center space-x-2">
                    <div className="flex items-center border border-gray-300 rounded-md px-2 py-1">
                        <span className="text-xs text-gray-500 mr-2">From:</span>
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="text-sm focus:outline-none"
                        />
                    </div>
                    <div className="flex items-center border border-gray-300 rounded-md px-2 py-1">
                        <span className="text-xs text-gray-500 mr-2">To:</span>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="text-sm focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => `৳${value}`} />
                        <Tooltip
                            formatter={(value: any, name: any) => [formatCurrency(Number(value || 0)), name]}
                            cursor={{ fill: '#f3f4f6' }}
                        />
                        <Legend />
                        <Bar dataKey="realized" name="Realized" fill="#16a34a" radius={[4, 4, 0, 0]} stackId="a" />
                        <Bar dataKey="potential" name="Potential" fill="#00359e" radius={[4, 4, 4, 4]} stackId="a" />
                        <Bar dataKey="lost" name="Loss" fill="#dc2626" radius={[4, 4, 4, 4]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6 text-center border-t pt-4">
                <div>
                    <p className="text-sm text-gray-500">Realized Revenue</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(totalRealized)}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Potential Revenue</p>
                    <p className="text-lg font-bold text-blue-800">{formatCurrency(totalPotential)}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Lost Revenue</p>
                    <p className="text-lg font-bold text-red-600">{formatCurrency(totalLost)}</p>
                </div>
            </div>
        </div>
    );
}



