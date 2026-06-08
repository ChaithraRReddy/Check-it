'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/Logo'

type Check = { id: string; purchase_name: string; purchase_type: string; total_cost: number; verdict: 'yes' | 'careful' | 'no'; created_at: string }
type Profile = { monthly_income: number; monthly_savings: number; liquid_buffer: number }

const inr = (n: number) => Math.round(n).toLocaleString('en-IN')
const PILL = {
  yes: { bg: 'bg-yes-fill', text: 'text-yes-text', dot: '#3EC98A', label: 'Yes' },
  careful: { bg: 'bg-careful-fill', text: 'text-careful-text', dot: '#F5A623', label: 'Careful' },
  no: { bg: 'bg-no-fill', text: 'text-no-text', dot: '#E24B4A', label: 'Not yet' },
} as const

export default function HomeClient({ profile, totalCommitments, checks, email }: { profile: Profile; totalCommitments: number; checks: Check[]; email: string }) {
  const router = useRouter()
  const [hidden, setHidden] = useState(false)
  const freeCash = profile.monthly_income - totalCommitments - profile.monthly_savings
  const requiredBuffer = totalCommitments * 3
  const mask = (v: string) => (hidden ? '•••••' : v)
  const signOut = async () => { await createClient().auth.signOut(); router.push('/') }

  return (
    <main className="mx-auto min-h-screen max-w-[420px] px-5 pb-28 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <Logo markSize={26} wordClass="text-[16px]" />
        <button onClick={signOut} title="Sign out" className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-[12px] font-semibold text-mint">{email ? email[0].toUpperCase() : 'U'}</button>
      </div>

      <p className="mb-2.5 text-[9px] font-medium uppercase tracking-[0.12em] text-sage">Your financial snapshot</p>
      <div className="rounded-2xl border-[0.5px] border-border bg-white p-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-forest p-3.5">
            <p className="text-[10px] text-mint">Free cash / month</p>
            <p className="font-sans text-[20px] font-semibold" style={{ color: freeCash < 0 ? '#FFB3A6' : '#E8F5EE' }}>₹{mask(inr(freeCash))}</p>
          </div>
          <div className="rounded-xl bg-sage-whisper p-3.5">
            <p className="text-[10px] text-sage">Emergency buffer</p>
            <p className="font-sans text-[20px] font-semibold text-forest">₹{mask(inr(profile.liquid_buffer))}</p>
          </div>
        </div>
        <div className="my-3 h-px bg-divider" />
        <div className="space-y-2 text-[12px]">
          <Row label="Take-home income" value={`₹${mask(inr(profile.monthly_income))}`} />
          <Row label="Fixed commitments" value={`₹${mask(inr(totalCommitments))}`} />
          <Row label="Monthly savings" value={`₹${mask(inr(profile.monthly_savings))}`} />
          <Row label="Liquid buffer" value={`₹${mask(inr(profile.liquid_buffer))}`} sub={`need ₹${inr(requiredBuffer)}`} />
        </div>
        <div className="mt-3.5 flex items-center justify-between border-t border-divider pt-3">
          <button onClick={() => setHidden(h => !h)} className="inline-flex items-center gap-1.5 rounded-full border-[0.5px] border-border px-3 py-1.5 text-[12px] text-sage transition hover:bg-mist">
            <i className={`ti ${hidden ? 'ti-eye-off' : 'ti-eye'}`} aria-hidden="true" style={{ fontSize: 14 }} />
            {hidden ? 'Show numbers' : 'Hide numbers'}</button>
          <button onClick={() => router.push('/onboarding?edit=1')} className="text-[12px] font-medium text-mint">Modify financials →</button>
        </div>
      </div>

      <p className="mb-2.5 mt-7 text-[9px] font-medium uppercase tracking-[0.12em] text-sage">Recent checks</p>
      {checks.length === 0 ? (
        <div className="rounded-2xl border-[0.5px] border-dashed border-border bg-white p-6 text-center">
          <p className="text-[13px] font-medium text-forest">No checks yet</p>
          <p className="mt-1 text-[11px] font-light text-sage">Run your first check to see whether that purchase fits your budget.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {checks.map(c => {
            const p = PILL[c.verdict]
            return (
              <div key={c.id} className="flex items-center rounded-xl border-[0.5px] border-border bg-white px-4 py-3">
                <div>
                  <p className="text-[13px] font-medium text-forest">{c.purchase_name}</p>
                  <p className="text-[10px] text-sage">{c.purchase_type === 'emi' ? 'EMI' : 'One-time'} · {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                </div>
                <div className="ml-auto flex items-center gap-2.5">
                  <span className="font-number text-[13px] font-medium text-forest">₹{inr(c.total_cost)}</span>
                  <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${p.bg} ${p.text}`}><span className="h-1.5 w-1.5 rounded-full" style={{ background: p.dot }} />{p.label}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-[420px] px-5 pb-5 pt-8" style={{ background: 'linear-gradient(to top, var(--color-sage-whisper) 55%, transparent)' }}>
        <button onClick={() => router.push('/check')} className="w-full rounded-full bg-mint py-4 text-[14px] font-semibold text-forest transition hover:opacity-90">Run a check →</button>
      </div>
    </main>
  )
}

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sage">{label}</span>
      <span className="font-number font-medium text-forest">{value}{sub && <span className="ml-1 text-[10px] font-normal text-placeholder">({sub})</span>}</span>
    </div>
  )
}