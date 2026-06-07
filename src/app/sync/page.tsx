'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getGuestProfile, getGuestCheck, clearGuest } from '@/lib/guest'
import { LogoMark } from '@/components/Logo'

export default function SyncPage() {
  const router = useRouter()
  useEffect(() => {
    (async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      const gp = getGuestProfile()
      const gc = getGuestCheck()

      if (gp) {
        await supabase.from('profiles').upsert({
          id: user.id, monthly_income: gp.income, monthly_savings: gp.savings, liquid_buffer: gp.buffer,
        })
        await supabase.from('commitments').delete().eq('user_id', user.id)
        if (gp.commitments.length) {
          await supabase.from('commitments').insert(gp.commitments.map(c => ({ user_id: user.id, label: c.label, amount: c.amount })))
        }
      }
      if (gc) await supabase.from('checks').insert({ user_id: user.id, ...gc })

      clearGuest()
      router.replace('/home')
    })()
  }, [router])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <LogoMark size={56} />
      <p className="text-[12px] text-sage">Setting up your account…</p>
    </main>
  )
}