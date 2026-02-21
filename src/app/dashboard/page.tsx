'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import RecruiterDashboard from '@/components/dashboard/RecruiterDashboard';
import MarketingDashboard from '@/components/dashboard/MarketingDashboard';
import SalesDashboard from '@/components/sales/SalesDashboard';

export default function DashboardPage() {
    const { isAdmin, isRecruiter, isMarketing, isSales, isSalesLead, loading, user, signOut } = useAuth();
    const [adminView, setAdminView] = useState<'admin' | 'sales' | 'recruiter'>('admin');

    if (loading) {
        return <div>Loading...</div>;
    }

    if (isAdmin) {
        return (
            <div className="space-y-4">
                <div className="border-b border-gray-200 mb-6 bg-white rounded-lg shadow-sm px-4 pt-4">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setAdminView('admin')}
                            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${adminView === 'admin' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setAdminView('sales')}
                            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${adminView === 'sales' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            Sales View (Read-Only)
                        </button>
                        <button
                            onClick={() => setAdminView('recruiter')}
                            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${adminView === 'recruiter' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            Recruiter View (Read-Only)
                        </button>
                    </nav>
                </div>
                {adminView === 'admin' && <AdminDashboard />}
                {adminView === 'sales' && <SalesDashboard readOnly={true} />}
                {adminView === 'recruiter' && <RecruiterDashboard readOnly={true} />}
            </div>
        );
    }

    if (isRecruiter) {
        return <RecruiterDashboard />;
    }

    if (isMarketing) {
        return <MarketingDashboard />;
    }



    if (isSales || isSalesLead) {
        return <SalesDashboard />;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
            <p className="text-gray-600">Your account does not have the required permissions.</p>

            <div className="bg-gray-100 p-4 rounded-md text-left text-sm font-mono text-gray-700">
                <p><strong>Name:</strong> {user?.name || 'Unknown'}</p>
                <p><strong>Email:</strong> {user?.email || 'Unknown'}</p>
                <p><strong>Role:</strong> {user?.role || 'None'}</p>
                <p><strong>User ID:</strong> {user?.id}</p>
            </div>

            <button
                onClick={signOut}
                className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition"
            >
                Sign Out
            </button>
        </div>
    );
}
