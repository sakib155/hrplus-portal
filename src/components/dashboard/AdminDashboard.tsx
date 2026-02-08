'use client';

import RecruiterPerformance from './RecruiterPerformance';
import AdminKPIs from './AdminKPIs';
import RevenueChart from './RevenueChart';
import AdminActivityLog from './AdminActivityLog';
import AssignTaskModal from '../admin/AssignTaskModal';
import { Send } from 'lucide-react';
import { useState } from 'react';

export default function AdminDashboard() {
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

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

            {/* Global Activity Log */}
            <AdminActivityLog />
        </div>
    );
}
