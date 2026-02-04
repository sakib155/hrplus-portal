export type Role = 'admin' | 'lead' | 'recruiter';

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
    signOut: () => Promise<void>;
}
