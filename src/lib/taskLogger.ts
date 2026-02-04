import { createClient } from '@/lib/supabaseClient';

export async function logSystemTask(
    projectId: string | null,
    recruiterId: string,
    actionType: string,
    description: string
) {
    const supabase = createClient();

    try {
        const { error } = await supabase
            .from('system_tasks')
            .insert({
                project_id: projectId,
                recruiter_id: recruiterId,
                action_type: actionType,
                description: description
            });

        if (error) console.error('Failed to log task:', error);
    } catch (err) {
        console.error('Error logging task:', err);
    }
}
