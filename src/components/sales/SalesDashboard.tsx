import { useState } from 'react';
import LeadList from '../marketing/LeadList';
import { LayoutDashboard, Plus } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import AddLeadModal from '../marketing/AddLeadModal';

export default function SalesDashboard() {
    const { isSalesLead, user } = useAuth();
    const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
    // Sales Reps sees their assigned leads (enforced by RLS)
    // Sales Leads see ALL leads (enforced by RLS)

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isSalesLead ? 'Sales Team Dashboard' : 'My Sales Dashboard'}
                    </h1>
                    <p className="text-gray-600 text-sm">
                        {isSalesLead
                            ? 'Overview of all leads and team performance.'
                            : `Welcome back, ${user?.name}. Here are your assigned leads.`}
                    </p>
                </div>
                {isSalesLead && (
                    <button
                        onClick={() => setIsAddLeadOpen(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Lead
                    </button>
                )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <LayoutDashboard className="h-5 w-5 mr-2 text-blue-600" />
                    {isSalesLead ? 'All Active Leads' : 'My Assigned Leads'}
                </h3>
                <LeadList />
            </div>

            <AddLeadModal
                isOpen={isAddLeadOpen}
                onClose={() => setIsAddLeadOpen(false)}
                onSuccess={() => window.location.reload()} // Simple reload for now, or trigger refetch
            />
        </div>
    );
}
