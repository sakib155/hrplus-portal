'use client';

import RecruiterPerformance from './RecruiterPerformance';
import AddEmployeeModal from './AddEmployeeModal';
import AdminKPIs from './AdminKPIs';
import RevenueChart from './RevenueChart';

export default function AdminDashboard() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <AddEmployeeModal />
            </div>

            {/* KPI Cards */}
            <AdminKPIs />

            {/* Revenue Chart */}
            <RevenueChart />

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recruiter Performance</h3>
                <RecruiterPerformance />
            </div>
        </div>
    );
}
