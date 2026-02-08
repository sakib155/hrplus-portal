require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCounts() {
    console.log('--- Checking Counts (Service Role) ---');

    // Check Projects
    const { data: allProjects } = await supabase.from('projects').select('status');
    const activeProjects = allProjects.filter(p => p.status === 'Active').length;
    console.log(`Total Projects: ${allProjects.length}`);
    console.log(`Active Projects: ${activeProjects}`);

    // Check Candidates
    const { count: joinedCount } = await supabase
        .from('candidates')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Joined');

    console.log(`Total Joined Candidates: ${joinedCount}`);
}

checkCounts();
