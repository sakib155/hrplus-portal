'use client';

import { useAuth } from '@/components/AuthProvider';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import RecruiterDashboard from '@/components/dashboard/RecruiterDashboard';
import MarketingDashboard from '@/components/dashboard/MarketingDashboard';
import SalesDashboard from '@/components/sales/SalesDashboard';

export default function DashboardPage() {
    const { isAdmin, isRecruiter, isMarketing, isSales, isSalesLead, loading, user, signOut } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (isAdmin) {
        return <AdminDashboard />;
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
