export type Role = 'admin' | 'lead' | 'marketing' | 'sales' | 'recruiter' | 'sales_lead' | 'recruitment_lead';

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
    isRecruitmentLead: boolean;
    isMarketing: boolean;
    isSales: boolean;
    isSalesLead: boolean;
    signOut: () => Promise<void>;
}
