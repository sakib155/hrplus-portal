require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkJoinedMapping() {
    console.log('--- Checking Joined Candidates & Projects ---');

    // 1. Get Joined Candidates with their Project ID
    const { data: joinedCandidates } = await supabase
        .from('candidates')
        .select('id, name, project_id, status')
        .eq('status', 'Joined');

    console.log(`Joined Candidates: ${joinedCandidates.length}`);

    // 2. Check the Status of those Projects
    for (const c of joinedCandidates) {
        if (!c.project_id) {
            console.log(`- Candidate ${c.name} has NO project assigned.`);
            continue;
        }

        const { data: project } = await supabase
            .from('projects')
            .select('id, project_title, status')
            .eq('id', c.project_id)
            .single();

        if (project) {
            console.log(`- Candidate: ${c.name} -> Project: ${project.project_title} [${project.status}]`);
        } else {
            console.log(`- Candidate: ${c.name} -> Project ID ${c.project_id} NOT FOUND.`);
        }
    }
}

checkJoinedMapping();
