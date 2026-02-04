'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useState } from 'react';
import { LogOut, Menu, X, LayoutDashboard, Briefcase, Users, User } from 'lucide-react';

export default function TopNavbar() {
    const { user, signOut, isAdmin, isRecruiter } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        ...(isAdmin ? [
            { name: 'All Projects', href: '/admin/projects', icon: Briefcase },
        ] : []),
        ...(isRecruiter ? [
            { name: 'My Projects', href: '/dashboard', icon: Briefcase },
        ] : []),
        { name: 'Candidates', href: '/candidates', icon: Users },
    ];

    const handleSignOut = async () => {
        await signOut();
        router.push('/login');
    };

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <Link href="/dashboard" className="flex items-center space-x-2">
                                <div className="relative h-10 w-auto aspect-[3/1]">
                                    <Image
                                        src="/logo.png"
                                        alt="HRPlus Logo"
                                        width={150}
                                        height={50}
                                        className="h-10 w-auto object-contain"
                                        priority
                                    />
                                </div>
                            </Link>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                                        pathname === item.href
                                            ? "border-blue-500 text-gray-900"
                                            : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                                    )}
                                >
                                    <item.icon className="h-4 w-4 mr-2" />
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                    <div className="hidden sm:ml-6 sm:flex sm:items-center">
                        <div className="ml-3 relative flex items-center space-x-4">
                            <div className="flex flex-col text-right">
                                <span className="text-sm font-medium text-gray-900">{user?.name}</span>
                                <span className="text-xs text-gray-500 capitalize">{user?.role}</span>
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-gray-100 transition"
                                title="Sign Out"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                    <div className="-mr-2 flex items-center sm:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isMenuOpen ? (
                                <X className="block h-6 w-6" aria-hidden="true" />
                            ) : (
                                <Menu className="block h-6 w-6" aria-hidden="true" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isMenuOpen && (
                <div className="sm:hidden">
                    <div className="pt-2 pb-3 space-y-1">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setIsMenuOpen(false)}
                                className={cn(
                                    "block pl-3 pr-4 py-2 border-l-4 text-base font-medium",
                                    pathname === item.href
                                        ? "bg-blue-50 border-blue-500 text-blue-700"
                                        : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                                )}
                            >
                                <div className="flex items-center">
                                    <item.icon className="h-5 w-5 mr-3" />
                                    {item.name}
                                </div>
                            </Link>
                        ))}
                    </div>
                    <div className="pt-4 pb-4 border-t border-gray-200">
                        <div className="flex items-center px-4">
                            <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    <User className="h-6 w-6 text-gray-500" />
                                </div>
                            </div>
                            <div className="ml-3">
                                <div className="text-base font-medium text-gray-800">{user?.name}</div>
                                <div className="text-sm font-medium text-gray-500">{user?.email}</div>
                            </div>
                        </div>
                        <div className="mt-3 space-y-1">
                            <button
                                onClick={handleSignOut}
                                className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
