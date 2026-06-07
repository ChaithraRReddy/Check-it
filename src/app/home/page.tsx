import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HomeClient from './HomeClient'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (!profile) redirect('/onboarding')

  const { data: commitments } = await supabase.from('commitments').select('amount').eq('user_id', user.id)
  const { data: checks } = await supabase
    .from('checks').select('*').eq('user_id', user.id)
    .order('created_at', { ascending: false }).limit(5)

  const totalCommitments = (commitments ?? []).reduce((s, c) => s + Number(c.amount), 0)

  return (
    <HomeClient
      profile={profile}
      totalCommitments={totalCommitments}
      checks={checks ?? []}
      email={user.email ?? ''}
    />
  )
}