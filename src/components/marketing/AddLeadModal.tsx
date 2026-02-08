'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { X, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AddLeadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any; // If provided, we are in EDIT mode
}

export default function AddLeadModal({ isOpen, onClose, onSuccess, initialData }: AddLeadModalProps) {
    const [loading, setLoading] = useState(false);
    const [allEmployees, setAllEmployees] = useState<{ id: string, name: string, role: string }[]>([]);
    const [eligibleManagers, setEligibleManagers] = useState<{ id: string, name: string }[]>([]);
    const supabase = createClient();

    const [formData, setFormData] = useState({
        company_name: '',
        industry: '',
        location: '',
        contact_person: '',
        designation: '',
        phone: '',
        email: '',
        lead_source: '',
        service_type: '',
        status: 'Not Contacted',
        priority: 'Medium',
        hiring_growth_score: 1,
        online_footprint_score: 1,
        marketing_status_score: 1,
        lead_responsible_id: '',
        lead_owner_id: '',
        remarks: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchEmployees();
            if (initialData) {
                setFormData({
                    company_name: initialData.company_name || '',
                    industry: initialData.industry || '',
                    location: initialData.location || '',
                    contact_person: initialData.contact_person || '',
                    designation: initialData.designation || '',
                    phone: initialData.phone || '',
                    email: initialData.email || '',
                    lead_source: initialData.lead_source || '',
                    service_type: initialData.service_type || '',
                    status: initialData.status || 'Not Contacted',
                    priority: initialData.priority || 'Medium',
                    hiring_growth_score: Number(initialData.hiring_growth_score) || 1,
                    online_footprint_score: Number(initialData.online_footprint_score) || 1,
                    marketing_status_score: Number(initialData.marketing_status_score) || 1,
                    lead_responsible_id: initialData.lead_responsible_id || '',
                    lead_owner_id: initialData.lead_owner_id || '',
                    remarks: initialData.remarks || ''
                });
            } else {
                // Reset form for "Add New"
                setFormData({
                    company_name: '',
                    industry: '',
                    location: '',
                    contact_person: '',
                    designation: '',
                    phone: '',
                    email: '',
                    lead_source: '',
                    service_type: '',
                    status: 'Not Contacted',
                    priority: 'Medium',
                    hiring_growth_score: 1,
                    online_footprint_score: 1,
                    marketing_status_score: 1,
                    lead_responsible_id: '',
                    lead_owner_id: '',
                    remarks: ''
                });
            }
        }
    }, [isOpen, initialData]);

    const fetchEmployees = async () => {
        const { data } = await supabase
            .from('employees')
            .select('id, name, role')
            .order('name');

        if (data) {
            setAllEmployees(data);
            setEligibleManagers(data);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const potentiality_score =
                Number(formData.hiring_growth_score) +
                Number(formData.online_footprint_score) +
                Number(formData.marketing_status_score);

            const payload = {
                ...formData,
                potentiality_score,
                // Convert empty strings to null for UUID fields
                lead_responsible_id: formData.lead_responsible_id || null,
                lead_owner_id: formData.lead_owner_id || null,
            };

            if (initialData?.id) {
                // UPDATE
                const { error } = await supabase
                    .from('leads')
                    .update(payload)
                    .eq('id', initialData.id);
                if (error) throw error;
                toast.success('Lead updated successfully');
            } else {
                // INSERT
                const { error } = await supabase
                    .from('leads')
                    .insert({
                        ...payload,
                        created_at: new Date().toISOString()
                    });
                if (error) throw error;
                toast.success('Lead added successfully');
            }

            onSuccess();
            onClose();

        } catch (error: any) {
            console.error('Error saving lead:', error);
            toast.error('Failed to save lead: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 my-8">
                <div className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-lg">
                    <h3 className="text-lg font-medium text-gray-900">{initialData ? 'Edit Lead' : 'Add New Lead'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Section 1: Company Info */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Company Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Company Name *</label>
                                <input required type="text" name="company_name" value={formData.company_name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Industry</label>
                                <input type="text" name="industry" value={formData.industry} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Location</label>
                                <input type="text" name="location" value={formData.location} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Contact Info */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Contact Person</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input type="text" name="contact_person" value={formData.contact_person} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Designation</label>
                                <input type="text" name="designation" value={formData.designation} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Phone</label>
                                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Scoring & Details */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Assessment & Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Hiring Growth (1-5)</label>
                                <input type="number" min="1" max="5" name="hiring_growth_score" value={formData.hiring_growth_score} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Online Footprint (1-5)</label>
                                <input type="number" min="1" max="5" name="online_footprint_score" value={formData.online_footprint_score} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Marketing Status (1-5)</label>
                                <input type="number" min="1" max="5" name="marketing_status_score" value={formData.marketing_status_score} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Status</label>
                                <select name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                                    <option>Not Contacted</option>
                                    <option>Contacted</option>
                                    <option>Requirement Received</option>
                                    <option>Converted</option>
                                    <option>Lost</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Priority</label>
                                <select name="priority" value={formData.priority} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                                    <option>Low</option>
                                    <option>Medium</option>
                                    <option>High</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Lead Owner (Referrer)</label>
                                <select
                                    name="lead_owner_id"
                                    value={formData.lead_owner_id}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                >
                                    <option value="">Select Owner (Any Employee)...</option>
                                    {allEmployees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Lead Manager (Sales/Mkting)</label>
                                <select
                                    name="lead_responsible_id"
                                    value={formData.lead_responsible_id}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                >
                                    <option value="">Select Manager...</option>
                                    {eligibleManagers.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                            Save Lead
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
