import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { users } = body; // Array of { email, password, name, role }

        if (!users || !Array.isArray(users) || users.length === 0) {
            return NextResponse.json({ error: 'Invalid input: users array required' }, { status: 400 });
        }

        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceRoleKey) {
            return NextResponse.json({ error: 'Server config error' }, { status: 500 });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const results = [];
        const errors = [];

        for (const user of users) {
            const { email, password, name, role } = user;

            // 1. Create Auth User
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { name }
            });

            if (authError) {
                errors.push({ email, error: authError.message });
                continue;
            }

            if (authData.user) {
                // 2. Insert into Employees
                const { error: dbError } = await supabaseAdmin
                    .from('employees')
                    .insert({
                        id: authData.user.id,
                        name: name,
                        role: role || 'recruiter'
                    });

                if (dbError) {
                    errors.push({ email, error: 'Profile creation failed: ' + dbError.message });
                    // Ideally cleanup auth user here
                } else {
                    results.push({ email, id: authData.user.id });
                }
            }
        }

        return NextResponse.json({
            success: true,
            created: results.length,
            failed: errors.length,
            results,
            errors
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
