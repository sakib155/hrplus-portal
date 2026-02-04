import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your-project-url') {
        console.warn('Supabase credentials missing.');
        // Return a dummy client or handle gracefully?
        // For now, let it try, or we can patch it to not throw immediately, but the app largely depends on it.
        // Better to let the AuthProvider handle the error.
    }

    const urlToUse = (supabaseUrl && supabaseUrl.startsWith('http'))
        ? supabaseUrl
        : 'https://placeholder.supabase.co';

    return createBrowserClient(
        urlToUse,
        supabaseKey || 'placeholder'
    )
}
