require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Using service role key
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectLogs() {
    console.log('--- Inspecting Project Logs and Recruiters ---');

    // 1. Get all recruiters for reference
    const { data: recruiters } = await supabase
        .from('employees')
        .select('id, name, role');

    // Create a map for easy lookup
    const recruiterMap = {};
    recruiters.forEach(r => recruiterMap[r.id] = r.name);
    console.log('Recruiters:', recruiterMap);

    // 2. Get top 10 logs
    const { data: logs } = await supabase
        .from('project_logs')
        .select('id, content, recruiter_id, type')
        .limit(10); // Simple fetch, no sort yet

    console.log(`\nFound ${logs.length} sample logs:`);
    logs.forEach(l => {
        const recruiterName = recruiterMap[l.recruiter_id] || 'UNKNOWN_ID';
        console.log(`- [${l.type}] Recruiter: ${recruiterName} (${l.recruiter_id}) -> Content: ${l.content.substring(0, 20)}...`);
    });
}

inspectLogs();
