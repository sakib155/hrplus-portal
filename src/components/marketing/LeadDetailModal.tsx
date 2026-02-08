'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { X, Send, Phone, Mail, Calendar, User, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface LeadDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    leadId: string | null;
}

interface Note {
    id: string;
    note: string;
    contact_type: string;
    created_at: string;
    employee_id: string;
    employees?: { name: string };
}

interface Lead {
    id: string;
    company_name: string;
    contact_person: string;
    phone: string;
    email: string;
    status: string;
    priority: string;
    last_contact_date: string;
    next_followup_date: string;
    lead_responsible_id: string;
    lead_owner_id: string; // New field
    remarks: string;
    employees?: { name: string }; // This will be the "Manager" via 'lead_responsible_id' join
    // We need to fetch owner name separately or use a different query
    owner?: { name: string }; // We will need to adjust the query
}

export default function LeadDetailModal({ isOpen, onClose, leadId }: LeadDetailModalProps) {
    const supabase = createClient();
    const [lead, setLead] = useState<Lead | null>(null);
    const [loading, setLoading] = useState(false);
    const [notes, setNotes] = useState<Note[]>([]);
    const [newNote, setNewNote] = useState('');
    const [contactType, setContactType] = useState('Call');
    const [nextFollowup, setNextFollowup] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && leadId) {
            fetchLeadDetails();
            fetchNotes();
        }
    }, [isOpen, leadId]);

    // ... fetch functions ...
    const fetchLeadDetails = async () => {
        setLoading(true);
        // Supabase join syntax: table!foreign_key( columns )
        const { data, error } = await supabase
            .from('leads')
            .select(`
                *,
                manager:employees!lead_responsible_id(name),
                owner:employees!lead_owner_id(name)
            `)
            .eq('id', leadId)
            .single();

        if (error) {
            console.error('Error fetching lead:', error);
            toast.error('Failed to load lead details');
        } else {
            setLead(data);
        }
        setLoading(false);
    };

    const fetchNotes = async () => {
        const { data, error } = await supabase
            .from('lead_notes')
            .select('*, employees(name)')
            .eq('lead_id', leadId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching notes:', error);
        } else {
            setNotes(data || []);
        }
    };

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim() || !leadId) return;

        setSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // 1. Insert Note
            const { error: noteError } = await supabase
                .from('lead_notes')
                .insert({
                    lead_id: leadId,
                    employee_id: user.id,
                    note: newNote,
                    contact_type: contactType
                });

            if (noteError) throw noteError;

            // 2. Update Lead Last Contact Date & Next Follow-up
            const updatePayload: any = {
                last_contact_date: new Date().toISOString()
            };

            if (nextFollowup) {
                updatePayload.next_followup_date = nextFollowup;
            }

            const { error: leadError } = await supabase
                .from('leads')
                .update(updatePayload)
                .eq('id', leadId);

            if (leadError) throw leadError;

            toast.success('Activity logged successfully');
            setNewNote('');
            setNextFollowup('');
            fetchNotes();
            fetchLeadDetails();

        } catch (error: any) {
            console.error('Error adding note:', error);
            toast.error('Failed to add note: ' + (error.message || 'Unknown error'));
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 my-8 h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-lg">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{lead?.company_name || 'Loading...'}</h3>
                        <p className="text-sm text-gray-500">
                            {lead?.contact_person} • <span className={`font-medium ${lead?.priority === 'High' ? 'text-red-600' : 'text-gray-600'}`}>{lead?.priority} Priority</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Details */}
                    <div className="w-1/3 border-r border-gray-200 p-6 overflow-y-auto bg-gray-50">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Lead Details</h4>

                        <div className="space-y-4 text-sm">
                            <div>
                                <label className="block text-gray-500 text-xs">Status</label>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                                    {lead?.status}
                                </span>
                            </div>

                            <div>
                                <label className="block text-gray-500 text-xs">Contact Info</label>
                                <div className="mt-1 space-y-1">
                                    {lead?.phone && <div className="flex items-center text-gray-900"><Phone className="h-3 w-3 mr-2 text-gray-400" /> {lead.phone}</div>}
                                    {lead?.email && <div className="flex items-center text-gray-900"><Mail className="h-3 w-3 mr-2 text-gray-400" /> {lead.email}</div>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-500 text-xs">Manager (Responsible)</label>
                                <div className="flex items-center mt-1 text-gray-900">
                                    <User className="h-3 w-3 mr-2 text-gray-400" />
                                    {/* data is returned as manager: { name: ... } */}
                                    {(lead as any)?.manager?.name || 'Unassigned'}
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-500 text-xs">Lead Owner</label>
                                <div className="flex items-center mt-1 text-gray-900">
                                    <User className="h-3 w-3 mr-2 text-gray-400" />
                                    {(lead as any)?.owner?.name || 'Unknown'}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-200">
                                <label className="block text-gray-500 text-xs">Last Contact</label>
                                <div className="flex items-center mt-1 text-gray-900">
                                    <Clock className="h-3 w-3 mr-2 text-gray-400" />
                                    {lead?.last_contact_date ? format(new Date(lead.last_contact_date), 'MMM d, yyyy') : 'Never'}
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-500 text-xs">Next Follow-up</label>
                                <div className="flex items-center mt-1 text-gray-900">
                                    <Calendar className="h-3 w-3 mr-2 text-gray-400" />
                                    {lead?.next_followup_date ? format(new Date(lead.next_followup_date), 'MMM d, yyyy') : 'Not scheduled'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Activity Log */}
                    <div className="w-2/3 p-6 flex flex-col bg-white">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Activity Log</h4>

                        {/* Note Input */}
                        <form onSubmit={handleAddNote} className="mb-6 space-y-3">
                            <div className="flex gap-2">
                                <select
                                    value={contactType}
                                    onChange={(e) => setContactType(e.target.value)}
                                    className="block w-32 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                >
                                    <option>Call</option>
                                    <option>Email</option>
                                    <option>Meeting</option>
                                    <option>Other</option>
                                </select>
                                <input
                                    type="text"
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    placeholder="Log a call, email, or note..."
                                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                />
                            </div>
                            <div className="flex gap-2 items-center">
                                <span className="text-sm text-gray-500 whitespace-nowrap">Next Follow-up:</span>
                                <input
                                    type="date"
                                    value={nextFollowup}
                                    onChange={(e) => setNextFollowup(e.target.value)}
                                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                />
                                <button
                                    type="submit"
                                    disabled={submitting || !newNote.trim()}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                                >
                                    <Send className="h-4 w-4 mr-2" />
                                    Log Activity
                                </button>
                            </div>
                        </form>

                        {/* Timeline */}
                        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                            {notes.length === 0 ? (
                                <p className="text-center text-gray-500 text-sm py-4">No activity logged yet.</p>
                            ) : (
                                notes.map((note) => (
                                    <div key={note.id} className="relative pl-8 pb-4">
                                        {/* Timeline Line */}
                                        <div className="absolute top-0 left-3 h-full w-0.5 bg-gray-200 -z-10"></div>
                                        {/* Dot */}
                                        <div className="absolute top-1 left-1.5 h-3 w-3 rounded-full bg-blue-400 border-2 border-white"></div>

                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <div className="flex justify-between items-start">
                                                <span className="text-xs font-bold text-gray-700 uppercase">{note.contact_type}</span>
                                                <span className="text-xs text-gray-500">{format(new Date(note.created_at), 'MMM d, h:mm a')}</span>
                                            </div>
                                            <p className="text-sm text-gray-800 mt-1">{note.note}</p>
                                            <p className="text-xs text-gray-500 mt-2">Logged by {note.employees?.name}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
