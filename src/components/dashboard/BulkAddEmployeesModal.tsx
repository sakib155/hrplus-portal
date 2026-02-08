'use client';

import { useState } from 'react';
import { Loader2, UserPlus, X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface BulkAddEmployeesModalProps {
    onSuccess?: () => void;
}

export default function BulkAddEmployeesModal({ onSuccess }: BulkAddEmployeesModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Initial State: One empty row
    const [rows, setRows] = useState([
        { name: '', email: '', password: '', role: 'sales_lead' }
    ]);

    const addRow = () => {
        setRows([...rows, { name: '', email: '', password: '', role: 'sales_lead' }]);
    };

    const removeRow = (index: number) => {
        if (rows.length === 1) return;
        const newRows = [...rows];
        newRows.splice(index, 1);
        setRows(newRows);
    };

    const handleChange = (index: number, field: string, value: string) => {
        const newRows = [...rows];
        (newRows[index] as any)[field] = value;
        setRows(newRows);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validate
            const validRows = rows.filter(r => r.email && r.password && r.name && r.role);
            if (validRows.length === 0) {
                toast.error('Please fill in at least one employee details');
                setLoading(false);
                return;
            }

            const res = await fetch('/api/auth/bulk-create-users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ users: validRows })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to create users');

            if (data.failed > 0) {
                toast.warning(`Created ${data.created} users, but ${data.failed} failed.`);
                console.error('Failed users:', data.errors);
            } else {
                toast.success(`Successfully created ${data.created} employees!`);
                setIsOpen(false);
                setRows([{ name: '', email: '', password: '', role: 'sales_lead' }]); // Reset
                if (onSuccess) onSuccess();
            }

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
            >
                <UserPlus className="h-4 w-4" />
                <span>Bulk Add</span>
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Bulk Add Employees</h3>
                                <p className="text-sm text-gray-500">Add multiple employees at once.</p>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4 mb-6">
                                {/* Header Row */}
                                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-500 border-b pb-2">
                                    <div className="col-span-3">Full Name</div>
                                    <div className="col-span-3">Email</div>
                                    <div className="col-span-3">Password</div>
                                    <div className="col-span-2">Role</div>
                                    <div className="col-span-1"></div>
                                </div>

                                {/* Dynamic Rows */}
                                {rows.map((row, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-4 items-center">
                                        <div className="col-span-3">
                                            <input
                                                type="text"
                                                required
                                                placeholder="John Doe"
                                                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                                value={row.name}
                                                onChange={(e) => handleChange(index, 'name', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            <input
                                                type="email"
                                                required
                                                placeholder="john@example.com"
                                                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                                value={row.email}
                                                onChange={(e) => handleChange(index, 'email', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            <input
                                                type="text"
                                                required
                                                placeholder="Password123"
                                                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                                value={row.password}
                                                onChange={(e) => handleChange(index, 'password', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <select
                                                required
                                                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                                value={row.role}
                                                onChange={(e) => handleChange(index, 'role', e.target.value)}
                                            >
                                                <option value="recruiter">Recruiter</option>
                                                <option value="marketing">Marketing</option>
                                                <option value="sales">Sales (Assigned)</option>
                                                <option value="sales_lead">Sales Team Lead</option>
                                                <option value="lead">Recruitment Lead</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </div>
                                        <div className="col-span-1 flex justify-center">
                                            {rows.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeRow(index)}
                                                    className="text-red-400 hover:text-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={addRow}
                                className="mb-6 flex items-center text-sm text-blue-600 hover:text-blue-800"
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Another Row
                            </button>

                            <div className="flex justify-end pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : 'Create All Employees'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
