import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const guest = searchParams.get('guest') === '1'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      if (guest) return NextResponse.redirect(`${origin}/sync`)
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase.from('profiles').select('id').eq('id', user!.id).maybeSingle()
      return NextResponse.redirect(`${origin}${profile ? '/home' : '/onboarding'}`)
    }
  }
  return NextResponse.redirect(`${origin}/?error=auth_failed`)
}