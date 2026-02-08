'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthProvider';
import { Loader2, User, Lock, Mail, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const supabase = createClient();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [newEmail, setNewEmail] = useState('');

    const [passwordLoading, setPasswordLoading] = useState(false);
    const [emailLoading, setEmailLoading] = useState(false);

    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    if (authLoading || !user) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
            </div>
        );
    }

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage(null);

        if (password !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        if (password.length < 6) {
            setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        setPasswordLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            setPasswordMessage({ type: 'success', text: 'Password updated successfully!' });
            setPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setPasswordMessage({ type: 'error', text: err.message || 'Failed to update password' });
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleEmailChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmailMessage(null);

        if (!newEmail || !newEmail.includes('@')) {
            setEmailMessage({ type: 'error', text: 'Please enter a valid email address' });
            return;
        }

        setEmailLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                email: newEmail
            });

            if (error) throw error;

            setEmailMessage({ type: 'success', text: 'Confirmation link sent to new email!' });
            setNewEmail('');
        } catch (err: any) {
            setEmailMessage({ type: 'error', text: err.message || 'Failed to update email' });
        } finally {
            setEmailLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile & Settings</h1>

            <div className="bg-white shadow rounded-lg mb-6 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                    <div className="flex items-center">
                        <div className="bg-white p-2 rounded-full">
                            <User className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="ml-4 text-white">
                            <h2 className="text-xl font-bold">{user.name || 'User'}</h2>
                            <p className="text-blue-100 text-sm">{user.email}</p>
                        </div>
                        <div className="ml-auto">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-800 text-blue-100">
                                {user.role?.toUpperCase() || 'USER'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Change Password */}
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center mb-4">
                        <Lock className="h-5 w-5 text-gray-500 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
                    </div>

                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">New Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-sm"
                                placeholder="Min 6 characters"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-sm"
                                placeholder="Re-enter password"
                            />
                        </div>

                        {passwordMessage && (
                            <div className={`text-sm p-2 rounded ${passwordMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {passwordMessage.text}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={passwordLoading}
                            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {passwordLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Update Password
                        </button>
                    </form>
                </div>

                {/* Change Email */}
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center mb-4">
                        <Mail className="h-5 w-5 text-gray-500 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900">Change Email</h3>
                    </div>

                    <div className="text-sm text-gray-500 mb-4 bg-yellow-50 p-3 rounded border border-yellow-100">
                        Note: You will need to click the confirmation link sent to your new email address to finalize this change.
                    </div>

                    <form onSubmit={handleEmailChange} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">New Email Address</label>
                            <input
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-sm"
                                placeholder="you@example.com"
                            />
                        </div>

                        {emailMessage && (
                            <div className={`text-sm p-2 rounded ${emailMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {emailMessage.text}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={emailLoading}
                            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {emailLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Update Email
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
