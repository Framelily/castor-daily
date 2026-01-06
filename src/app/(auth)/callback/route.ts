import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle OAuth errors
  if (errorParam) {
    console.error('OAuth error:', errorParam, errorDescription)
    return NextResponse.redirect(`${origin}/login?error=auth`)
  }

  if (code) {
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('Session exchange error:', error)
        return NextResponse.redirect(`${origin}/login?error=auth`)
      }

      // Check if user has completed onboarding
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profile, error: profileError } = await (supabase as any)
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Profile fetch error:', profileError)
          // Profile might not exist yet, redirect to onboarding
          return NextResponse.redirect(`${origin}/onboarding`)
        }

        if (!profile?.onboarding_completed) {
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    } catch (error) {
      console.error('Callback error:', error)
      return NextResponse.redirect(`${origin}/login?error=auth`)
    }
  }

  // No code provided
  return NextResponse.redirect(`${origin}/login?error=auth`)
}
