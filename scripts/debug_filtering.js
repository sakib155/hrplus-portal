require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Using service role key (assuming from previous context)
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugFiltering() {
    console.log('--- Fetching Recruiters ---');
    const { data: recruiters } = await supabase
        .from('employees')
        .select('id, name')
        .in('role', ['recruiter', 'team lead']); // Note: lowercase 'recruiter' based on previous finding

    if (!recruiters || recruiters.length === 0) {
        console.log('No recruiters found.');
        return;
    }

    const targetRecruiter = recruiters[0];
    console.log(`Testing filter for: ${targetRecruiter.name} (ID: ${targetRecruiter.id})`);

    console.log('--- Running Query ---');
    let query = supabase
        .from('project_logs')
        .select(`
            id,
            log_date,
            content,
            recruiter_id
        `);

    // Apply filter
    query = query.eq('recruiter_id', targetRecruiter.id);

    // Apply sort and limit
    const { data: logs, error } = await query
        .order('log_date', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Query Error:', error);
    } else {
        console.log(`Found ${logs.length} logs.`);
        logs.forEach(l => {
            const match = l.recruiter_id === targetRecruiter.id ? 'MATCH' : 'MISMATCH';
            console.log(`[${match}] ${l.log_date}: ${l.content.substring(0, 30)}...`);
        });
    }
}

debugFiltering();
