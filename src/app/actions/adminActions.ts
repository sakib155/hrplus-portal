'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

export async function deleteUser(userId: string) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
        throw new Error('Server configuration error: Missing SUPABASE_SERVICE_ROLE_KEY');
    }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );

    // Safety Check: Prevent deleting the last admin
    try {
        const { data: userProfile, error: profileError } = await supabaseAdmin
            .from('employees')
            .select('role')
            .eq('id', userId)
            .single();

        if (userProfile?.role === 'admin') {
            const { count, error: countError } = await supabaseAdmin
                .from('employees')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'admin');

            if (countError) throw new Error('Failed to verify admin count');

            // If this is an admin and the count is 1 (or somehow 0/less), block deletion
            if (count !== null && count <= 1) {
                return { success: false, error: 'Cannot delete the only remaining admin.' };
            }
        }
    } catch (error) {
        console.error('Error in deletion safety check:', error);
        // Depending on strictness, we might want to return here or proceed. 
        // Let's be safe and fail if we can't verify.
        return { success: false, error: 'Failed to verify deletion safety.' };
    }

    try {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (error) {
            console.error('Error deleting user:', error);
            throw new Error(error.message);
        }

        revalidatePath('/admin/employees');
        return { success: true };
    } catch (error: any) {
        console.error('Unexpected error deleting user:', error);
        return { success: false, error: error.message };
    }
}
