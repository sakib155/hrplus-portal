'use client';

import { usePathname } from 'next/navigation';
import TopNavbar from './TopNavbar';
import { useAuth } from './AuthProvider';

export default function NavigationWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user, loading } = useAuth();

    // Pages that should NOT have the navbar
    const isPublicPage = pathname === '/login' || pathname === '/signup';

    // While loading auth state, we might show a spinner or just nothing for the navbar
    // But usually it's better to render children (layout) and let them handle loading states
    // HOWEVER, for the Navbar itself:

    if (isPublicPage) {
        return <>{children}</>;
    }

    // Attempting to access protected pages without user?
    // AuthProvider logic usually redirects, but we might render Navbar briefly.
    // Let's only render Navbar if we have a user OR if we are just optimistic (loading).
    // Safest: Render Navbar, it will show "Loading" user or empty if loading.
    // Our TopNavbar handles `user?.name` safely.

    return (
        <div className="min-h-screen bg-gray-50">
            <TopNavbar />
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    );
}
