require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRoles() {
    console.log('--- Checking Employees ---');
    const { data: employees, error } = await supabase
        .from('employees')
        .select('id, name, role');

    if (error) {
        console.error('Error fetching employees:', error);
        return;
    }

    console.log(`Total Employees: ${employees.length}`);
    employees.forEach(e => {
        console.log(`- ${e.name}: "${e.role}"`);
    });
}

checkRoles();
