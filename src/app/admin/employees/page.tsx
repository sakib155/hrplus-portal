'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Loader2, Search, User, Shield, Briefcase, LayoutDashboard, Trash2 } from 'lucide-react';
import AddEmployeeModal from '@/components/dashboard/AddEmployeeModal';
import Link from 'next/link';
import { toast } from 'sonner';
import { deleteUser } from '@/app/actions/adminActions';

interface Employee {
    id: string;
    email?: string; // Not in schema currently
    name: string;
    role: 'admin' | 'lead' | 'recruiter';
    created_at: string;
    avatar_url?: string;
}

const getRoleBadgeColor = (role: string) => {
    switch (role) {
        case 'admin':
            return 'bg-purple-100 text-purple-800';
        case 'lead':
            return 'bg-blue-100 text-blue-800';
        case 'recruiter':
            return 'bg-green-100 text-green-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

const getRoleIcon = (role: string) => {
    switch (role) {
        case 'admin':
            return <Shield className="w-3 h-3" />;
        case 'lead':
            return <Briefcase className="w-3 h-3" />;
        case 'recruiter':
            return <User className="w-3 h-3" />;
        default:
            return <User className="w-3 h-3" />;
    }
};

export default function EmployeeDirectoryPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const supabase = createClient();

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching employees:', error);
                toast.error('Failed to load employees');
            } else {
                setEmployees(data || []);
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            toast.error('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const filteredEmployees = employees.filter(employee =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (employee.email && employee.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Employee Directory</h1>
                    <p className="text-gray-500">Manage and view all team members</p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-500">
                        Total: <span className="font-bold text-gray-900">{employees.length}</span>
                    </div>
                    <AddEmployeeModal onSuccess={fetchEmployees} />
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Search employees by name, role, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Employee Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEmployees.map((employee) => (
                    <div key={employee.id} className="bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-600">
                                        {employee.avatar_url ? (
                                            <img src={employee.avatar_url} alt={employee.name} className="h-12 w-12 rounded-full object-cover" />
                                        ) : (
                                            employee.name.charAt(0)
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">{employee.name}</h3>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(employee.role)}`}>
                                            {getRoleIcon(employee.role)}
                                            <span className="ml-1 capitalize">{employee.role}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 text-sm text-gray-500">
                                {employee.email}
                            </div>

                            <div className="mt-6 flex space-x-3">
                                <Link
                                    href={`/admin/recruiters/${employee.id}`}
                                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <LayoutDashboard className="h-4 w-4 mr-2" />
                                    Dashboard
                                </Link>
                                <button
                                    onClick={async () => {
                                        if (confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
                                            try {
                                                const res = await deleteUser(employee.id);
                                                if (res.success) {
                                                    toast.success('Employee deleted successfully');
                                                    fetchEmployees();
                                                } else {
                                                    toast.error('Failed to delete employee: ' + res.error);
                                                }
                                            } catch (error) {
                                                console.error(error);
                                                toast.error('An error occurred');
                                            }
                                        }
                                    }}
                                    className="inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 text-xs text-gray-500 flex justify-between">
                            <span>Joined: {new Date(employee.created_at).toLocaleDateString()}</span>
                            <span>ID: ...{employee.id.slice(-4)}</span>
                        </div>
                    </div>
                ))}

                {filteredEmployees.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No employees found matching "{searchTerm}"
                    </div>
                )}
            </div>
        </div>
    );
}
