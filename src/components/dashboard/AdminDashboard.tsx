'use client';

import RecruiterPerformance from './RecruiterPerformance';
import AdminKPIs from './AdminKPIs';
import RevenueChart from './RevenueChart';
import AdminActivityLog from './AdminActivityLog';
import AssignTaskModal from '../admin/AssignTaskModal';
import RecruiterTaskLog from './RecruiterTaskLog';
import { Send, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';

export default function AdminDashboard() {
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
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <button
                    onClick={() => setIsTaskModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                    <Send className="mr-2 h-4 w-4" />
                    Send Task
                </button>
            </div>

            <AssignTaskModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
            />

            {/* KPI Cards */}
            <AdminKPIs />

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
            <AdminActivityLog />
        </div>
    );
}
