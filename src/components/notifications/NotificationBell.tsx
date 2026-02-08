'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface Notification {
    id: string;
    type: 'Task' | 'Alert' | 'Info' | 'Success';
    content: string;
    link?: string;
    is_read: boolean;
    created_at: string;
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    const fetchNotifications = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('recipient_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (data) {
                setNotifications(data as Notification[]);
                setUnreadCount(data.filter((n: any) => !n.is_read).length);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Real-time subscription
        const channel = supabase
            .channel('public:notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `recipient_id=eq.${supabase.auth.getUser().then(({ data }) => data.user?.id)}` // This might need simple filter if user ID is static, but for now we poll or use simple filter
                },
                (payload) => {
                    // Refresh on new notification
                    fetchNotifications();
                }
            )
            .subscribe();

        // Click outside to close
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            supabase.removeChannel(channel);
        };
    }, []);

    const markAsRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));

        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);
    };

    const markAllRead = async () => {
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds.length === 0) return;

        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);

        await supabase
            .from('notifications')
            .update({ is_read: true })
            .in('id', unreadIds);
    };

    return (
        <div className="relative mr-4" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-full text-gray-400 hover:text-blue-500 hover:bg-gray-100 transition relative focus:outline-none"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full ring-2 ring-white bg-red-500" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">No notifications</div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 hover:bg-gray-50 transition ${!notification.is_read ? 'bg-blue-50/50' : ''}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 min-w-0 mr-2">
                                                <p className={`text-sm ${!notification.is_read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                                                    {notification.content}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                                </p>
                                                {notification.link && (
                                                    <Link
                                                        href={notification.link}
                                                        onClick={() => {
                                                            setIsOpen(false);
                                                            if (!notification.is_read) markAsRead(notification.id);
                                                        }}
                                                        className="inline-flex items-center mt-2 text-xs text-blue-600 hover:text-blue-800"
                                                    >
                                                        View details <ExternalLink className="h-3 w-3 ml-1" />
                                                    </Link>
                                                )}
                                            </div>
                                            {!notification.is_read && (
                                                <button
                                                    onClick={() => markAsRead(notification.id)}
                                                    className="text-gray-400 hover:text-blue-600"
                                                    title="Mark as read"
                                                >
                                                    <Check className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
