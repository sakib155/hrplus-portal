import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProjects() {
    console.log('--- Checking All Projects (Service Role) ---');
    const { data: allProjects, error } = await supabase
        .from('projects')
        .select('id, project_title, status');

    if (error) {
        console.error('Error fetching projects:', error);
        return;
    }

    console.log(`Total Projects in DB: ${allProjects.length}`);
    allProjects.forEach(p => {
        console.log(`- [${p.status}] ${p.project_title} (${p.id})`);
    });

    const activeCount = allProjects.filter(p => p.status === 'Active').length;
    console.log(`Manual Active Count: ${activeCount}`);
}

checkProjects();
