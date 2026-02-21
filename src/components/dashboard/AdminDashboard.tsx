'use client';

import RecruiterPerformance from './RecruiterPerformance';
import AdminKPIs from './AdminKPIs';
import RevenueChart from './RevenueChart';
import AdminActivityLog from './AdminActivityLog';
import AdminTaskApprovals from './AdminTaskApprovals';
import AssignTaskModal from '../admin/AssignTaskModal';
import RecruiterTaskLog from './RecruiterTaskLog';
import FollowUpTracker from '../admin/FollowUpTracker';
import { Send, Eye, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { format } from 'date-fns';

export default function AdminDashboard() {
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [recruiters, setRecruiters] = useState<{ id: string, name: string }[]>([]);
    const [inspectorId, setInspectorId] = useState('');
    const supabase = createClient();

    useEffect(() => {
        const fetchRecruiters = async () => {
            const { data } = await supabase
                .from('employees')
                .select('id, name')
                .in('role', ['recruiter', 'team lead'])
                .order('name');
            if (data) setRecruiters(data);
        };
        fetchRecruiters();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                        <label className="text-sm font-medium text-gray-700 mr-2">Filter Month:</label>
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        {selectedMonth && (
                            <button
                                onClick={() => setSelectedMonth('')}
                                className="ml-2 text-sm text-gray-500 hover:text-red-500"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => setIsTaskModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                        <Send className="mr-2 h-4 w-4" />
                        Send Task
                    </button>
                </div>
            </div>

            <AssignTaskModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
            />

            {/* Master Follow-Up Board */}
            <FollowUpTracker selectedMonth={selectedMonth} />

            {/* KPI Cards */}
            <AdminKPIs selectedMonth={selectedMonth} />

            {/* Revenue Chart */}
            <RevenueChart />

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recruiter Performance</h3>
                <RecruiterPerformance />
            </div>

            {/* Task Inspector */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        <Eye className="h-5 w-5 mr-2 text-blue-600" />
                        Recruiter Task Inspector
                    </h3>
                    <select
                        value={inspectorId}
                        onChange={(e) => setInspectorId(e.target.value)}
                        className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                        <option value="">Select Recruiter...</option>
                        {recruiters.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                    </select>
                </div>
                {inspectorId ? (
                    <RecruiterTaskLog recruiterId={inspectorId} />
                ) : (
                    <p className="text-sm text-gray-500 italic">Select a recruiter to view their active task list.</p>
                )}
            </div>

            {/* Global Activity Log */}
            <AdminTaskApprovals />
            <AdminActivityLog />
        </div>
    );
}
