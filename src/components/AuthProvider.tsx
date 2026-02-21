'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { AuthState, UserProfile, Role } from '@/types';
import { useRouter } from 'next/navigation';

const AuthContext = createContext<AuthState>({
    user: null,
    loading: true,
    isAdmin: false,
    isRecruiter: false,
    isRecruitmentLead: false,
    isMarketing: false,
    isSales: false,
    isSalesLead: false,
    signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const getUserProfile = async (session: any) => {
            if (!session?.user) {
                setUser(null);
                setLoading(false);
                return;
            }

            try {
                const { data: employee, error } = await supabase
                    .from('employees')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (employee) {
                    setUser({
                        id: session.user.id,
                        email: session.user.email!,
                        name: employee.name,
                        role: employee.role as Role,
                    });
                } else {
                    console.error('User authenticated but no employee record found');
                    // Still set user to allow debugging, but role will be undefined/null effectively
                    setUser({
                        id: session.user.id,
                        email: session.user.email!,
                        name: session.user.user_metadata?.name || 'Unknown',
                        role: 'recruiter', // Fallback or handle as 'pending'
                    });
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };

        // 1. Initial Session Check
        supabase.auth.getSession().then(({ data: { session } }) => {
            getUserProfile(session);
        });

        // 2. Auth State Change Listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            getUserProfile(session);
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        router.push('/login');
    };

    const value = {
        user,
        loading,
        isAdmin: user?.role === 'admin' || user?.role === 'lead',
        isRecruiter: user?.role === 'recruiter' || user?.role === 'recruitment_lead',
        isRecruitmentLead: user?.role === 'recruitment_lead',
        isMarketing: user?.role === 'marketing',
        isSales: user?.role === 'sales' || user?.role === 'sales_lead',
        isSalesLead: user?.role === 'sales_lead',
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
