export type Role = 'admin' | 'lead' | 'recruiter' | 'marketing' | 'sales' | 'sales_lead';

export interface UserProfile {
    id: string;
    email: string;
    name: string;
    role: Role;
}

export interface AuthState {
    user: UserProfile | null;
    loading: boolean;
    isAdmin: boolean;
    isRecruiter: boolean;
    isMarketing: boolean;
    isSales: boolean;
    isSalesLead: boolean;
    signOut: () => Promise<void>;
}
