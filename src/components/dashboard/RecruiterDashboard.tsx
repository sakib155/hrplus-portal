import RecruiterKPIs from './RecruiterKPIs';
import RecruiterProjectList from './RecruiterProjectList';

export default function RecruiterDashboard() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>

            {/* KPI Cards */}
            <RecruiterKPIs />

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Active Projects</h3>
                <RecruiterProjectList />
            </div>
        </div>
    );
}
