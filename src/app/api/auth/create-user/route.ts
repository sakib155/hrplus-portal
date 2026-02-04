import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password, name, role } = body;

        // Check for Service Role Key
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!serviceRoleKey) {
            return NextResponse.json(
                { error: 'Server configuration error: Missing SUPABASE_SERVICE_ROLE_KEY' },
                { status: 500 }
            );
        }

        // Create Admin Client (Bypasses RLS)
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

        // 1. Create Auth User
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email
            user_metadata: { name }
        });

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        if (!authData.user) {
            return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
        }

        // 2. Insert into Employees Table
        // The Admin Client can insert into 'employees' regardless of RLS, 
        // BUT we need to ensure the schema allows it. 
        // Our 'public.employees' table has RLS. The Service Role bypasses RLS.
        const { error: dbError } = await supabaseAdmin
            .from('employees')
            .insert({
                id: authData.user.id,
                name: name,
                role: role || 'recruiter'
            });

        if (dbError) {
            // Rollback auth user? ideally yes, but for now just report error
            return NextResponse.json({ error: 'User created but failed to create profile: ' + dbError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, user: authData.user });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
