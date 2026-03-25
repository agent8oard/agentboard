import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const pathname = request.nextUrl.pathname

  // Always allow these routes with no checks
  const alwaysPublic = ['/_next', '/favicon', '/api/stripe/webhook', '/api/dev', '/api/auth']
  if (alwaysPublic.some(r => pathname.startsWith(r))) return supabaseResponse

  const publicRoutes = ['/', '/auth', '/dev', '/payment']
  const isPublic = publicRoutes.some(r => pathname === r || pathname.startsWith(r + '/'))

  // CHECK 1: Valid dev session cookie bypasses everything — but only if no real auth user
  const devSessionId = request.cookies.get('dev_session')?.value
  if (devSessionId && devSessionId.length > 10) {
    const tempAuthClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll() {},
        },
      }
    )
    const { data: { user: realUser } } = await tempAuthClient.auth.getUser()

    if (!realUser) {
      // No real user — check if dev session is valid
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      const { data: devSession } = await adminClient
        .from('dev_sessions')
        .select('id, is_active')
        .eq('id', devSessionId)
        .eq('is_active', true)
        .single()

      if (devSession) {
        return supabaseResponse // Valid dev session, no real user — let through
      }
    }
    // Real user exists — ignore dev cookie, continue to normal auth checks
  }

  if (isPublic) return supabaseResponse

  // CHECK 2: Must be logged in
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await authClient.auth.getUser()

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    return NextResponse.redirect(url)
  }

  if (pathname === '/auth') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // CHECK 3: Must have active subscription
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await serviceClient
    .from('profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .single()

  if (!profile) {
    await serviceClient.from('profiles').insert({
      id: user.id,
      full_name: user.user_metadata?.full_name || '',
      subscription_status: 'inactive',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    const url = request.nextUrl.clone()
    url.pathname = '/payment'
    return NextResponse.redirect(url)
  }

  if (profile.subscription_status !== 'active') {
    const url = request.nextUrl.clone()
    url.pathname = '/payment'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
