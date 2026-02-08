import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Check if we have any Supabase cookies to avoid initializing client if not needed
    // This dramatically improves performance for public pages when not logged in
    const hasSupabaseCookies = request.cookies.getAll().some(cookie =>
        cookie.name.startsWith('sb-') || cookie.name.includes('auth')
    );

    const isAuthRoute = request.nextUrl.pathname.startsWith('/login')
    const isProtectedRoute =
        request.nextUrl.pathname.startsWith('/dashboard') ||
        request.nextUrl.pathname.startsWith('/projects') ||
        request.nextUrl.pathname.startsWith('/candidates') ||
        request.nextUrl.pathname.startsWith('/admin')

    if (!hasSupabaseCookies) {
        if (isProtectedRoute) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
        return response;
    }

    // Check for environment variables to prevent crash
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your-project-url') {
        console.warn('Supabase credentials missing. Skipping middleware auth.');
        return response;
    }

    // Create simple Supabase client for middleware
    // Note: we need to handle cookie methods manually for middleware
    const supabase = createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: specific to Supabase Auth which does not update the cookie in the
    // request itself, so we need to pass the modified request to the next step.


    // OPTIMIZATION:
    // Only fetch session for protected routes or if we really need to check auth state.
    // For specific public routes like /login, checking session server-side can be slow (network call).
    // We defer the "redirect if logged in" logic to the client-side for better perceived performance.

    if (isProtectedRoute) {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    // For Auth Routes (Login/Signup), we skip the server-side redirect check to avoid the delay.
    // The client-side component will handle the redirect if the user is already logged in.

    return response
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/projects/:path*',
        '/candidates/:path*',
        '/admin/:path*',
        '/login',
        '/signup',
    ],
}
