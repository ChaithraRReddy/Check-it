'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { saveGuestProfile, getGuestProfile } from '@/lib/guest'
import { Logo } from '@/components/Logo'

const CATEGORIES = ['Rent/PG', 'Loan EMI', 'Insurance', 'Subscriptions', 'Bills & utilities', 'Other']
type Expense = { label: string; amount: string }
type Mode = 'new' | 'edit' | 'guest'

const fieldCls = 'w-full rounded-xl border-[1.5px] border-border bg-white py-3 pl-8 pr-4 text-[15px] text-forest outline-none transition focus:border-forest placeholder:text-placeholder'
const CloseIcon = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>)

export default function OnboardingPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('new')
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [income, setIncome] = useState('')
  const [expenses, setExpenses] = useState<Expense[]>([{ label: 'Rent/PG', amount: '' }])
  const [savings, setSavings] = useState('')
  const [buffer, setBuffer] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const m: Mode = params.get('edit') ? 'edit' : params.get('guest') ? 'guest' : 'new'
    setMode(m)

    if (m === 'edit') {
      (async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/'); return }
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
        const { data: comms } = await supabase.from('commitments').select('label, amount').eq('user_id', user.id)
        if (prof) { setIncome(String(prof.monthly_income)); setSavings(String(prof.monthly_savings)); setBuffer(prof.liquid_buffer ? String(prof.liquid_buffer) : '') }
        if (comms && comms.length) setExpenses(comms.map(c => ({ label: c.label, amount: String(c.amount) })))
      })()
    } else if (m === 'guest') {
      const gp = getGuestProfile()
      if (gp) {
        setIncome(String(gp.income)); setSavings(String(gp.savings)); setBuffer(gp.buffer ? String(gp.buffer) : '')
        if (gp.commitments.length) setExpenses(gp.commitments.map(c => ({ label: c.label, amount: String(c.amount) })))
      }
    }
  }, [router])

  const updateExpense = (i: number, patch: Partial<Expense>) => setExpenses(prev => prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)))
  const addExpense = () => setExpenses(prev => [...prev, { label: 'Other', amount: '' }])
  const removeExpense = (i: number) => setExpenses(prev => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev))

  const next = () => {
    setError('')
    if (step === 0 && (!income || Number(income) <= 0)) return setError('Please enter your monthly income.')
    if (step === 1 && expenses.filter(e => Number(e.amount) > 0).length === 0) return setError('Add at least one commitment.')
    setStep(s => s + 1)
  }
  const back = () => { setError(''); setStep(s => s - 1) }

  const finish = async () => {
    setError('')
    if (savings === '' || Number(savings) < 0) return setError("Enter how much you save each month — type 0 if you don't.")
    if (buffer !== '' && (isNaN(Number(buffer)) || Number(buffer) < 0)) return setError('Enter a valid emergency amount, or leave it blank.')
    const bufferVal = buffer === '' ? 0 : Number(buffer)
    const cleaned = expenses.filter(e => Number(e.amount) > 0)

    if (mode === 'guest') {
      saveGuestProfile({ income: Number(income), savings: Number(savings), buffer: bufferVal, commitments: cleaned.map(e => ({ label: e.label, amount: Number(e.amount) })) })
      router.push('/check?guest=1')
      return
    }

    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    const rows = cleaned.map(e => ({ user_id: user.id, label: e.label, amount: Number(e.amount) }))
    const { error: pErr } = await supabase.from('profiles').upsert({ id: user.id, monthly_income: Number(income), monthly_savings: Number(savings), liquid_buffer: bufferVal })
    await supabase.from('commitments').delete().eq('user_id', user.id)
    const { error: cErr } = await supabase.from('commitments').insert(rows)
    if (pErr || cErr) { setSaving(false); setError('Something went wrong saving your profile. Please try again.'); return }
    router.push(mode === 'edit' ? '/home' : '/check')
  }

  const dotCls = (i: number) => `h-[3px] flex-1 rounded-full transition-colors ${i < step ? 'bg-forest' : i === step ? 'bg-mint' : 'bg-border'}`
  const Currency = () => (<span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-number text-[15px] font-light text-sage">₹</span>)

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-[420px]">
        <div className="mb-6 flex items-center justify-between px-1">
          <Logo markSize={28} wordClass="text-[18px]" />
          {mode !== 'new' && (
            <button onClick={() => router.push(mode === 'edit' ? '/home' : '/')} aria-label="Close" className="text-sage transition hover:text-forest"><CloseIcon /></button>
          )}
        </div>

        <div className="rounded-3xl border-[0.5px] border-border bg-white p-7">
          <div className="mb-9 flex gap-1.5">{[0, 1, 2].map(i => <div key={i} className={dotCls(i)} />)}</div>

          {step === 0 && (
            <section>
              <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.12em] text-placeholder">Step 1 of 3</p>
              <h2 className="font-display text-[22px] font-semibold leading-tight text-forest">What do you take home?</h2>
              <p className="mb-7 mt-1.5 text-[12px] font-light leading-relaxed text-sage">Whatever lands in your bank account each month — after taxes are already taken out.</p>
              <label className="mb-1.5 block text-[11px] font-medium tracking-wide text-sage">Monthly take-home income</label>
              <div className="relative"><Currency /><input value={income} onChange={e => setIncome(e.target.value)} type="number" inputMode="numeric" placeholder="55,000" className={fieldCls} /></div>
            </section>
          )}

          {step === 1 && (
            <section>
              <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.12em] text-placeholder">Step 2 of 3</p>
              <h2 className="font-display text-[22px] font-semibold leading-tight text-forest">What goes out each month?</h2>
              <p className="mb-6 mt-1.5 text-[12px] font-light leading-relaxed text-sage">Money that&apos;s gone the moment your salary lands — rent, loan payments, subscriptions, that kind of thing.</p>
              {expenses.map((exp, i) => (
                <div key={i} className="mb-3 flex gap-2.5">
                  <select value={exp.label} onChange={e => updateExpense(i, { label: e.target.value })} className="w-[124px] shrink-0 rounded-xl border-[1.5px] border-border bg-white px-3 py-3 text-[13px] text-forest outline-none focus:border-forest">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <div className="relative flex-1"><Currency /><input value={exp.amount} onChange={e => updateExpense(i, { amount: e.target.value })} type="number" inputMode="numeric" placeholder="Amount" className="w-full rounded-xl border-[1.5px] border-border bg-white py-3 pl-8 pr-3 text-[15px] text-forest outline-none focus:border-forest placeholder:text-placeholder" /></div>
                  <button onClick={() => removeExpense(i)} disabled={expenses.length === 1} aria-label="Remove" className="w-11 shrink-0 rounded-xl border-[1.5px] border-border text-lg text-sage transition hover:border-warn hover:text-warn disabled:opacity-40 disabled:hover:border-border disabled:hover:text-sage">×</button>
                </div>
              ))}
              <button onClick={addExpense} className="flex w-full items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-dashed border-border py-3 text-[13px] text-sage transition hover:border-sage">+ Add commitment</button>
            </section>
          )}

          {step === 2 && (
            <section>
              <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.12em] text-placeholder">Step 3 of 3</p>
              <h2 className="font-display text-[22px] font-semibold leading-tight text-forest">What do you put aside?</h2>
              <p className="mb-7 mt-1.5 text-[12px] font-light leading-relaxed text-sage">Money you save or invest each month — plus anything you&apos;ve already saved up for a rainy day.</p>

              <label className="mb-1.5 block text-[11px] font-medium tracking-wide text-sage">How much do you save or invest each month?</label>
              <div className="relative"><Currency /><input value={savings} onChange={e => setSavings(e.target.value)} type="number" inputMode="numeric" placeholder="10,000" className={fieldCls} /></div>
              <p className="mt-1.5 text-[10px] font-light leading-relaxed text-sage">A rough number is fine. Type 0 if you don&apos;t save regularly.</p>

              <label className="mb-1.5 mt-6 block text-[11px] font-medium tracking-wide text-sage">How much have you saved for emergencies? (optional)</label>
              <div className="relative"><Currency /><input value={buffer} onChange={e => setBuffer(e.target.value)} type="number" inputMode="numeric" placeholder="75,000" className={fieldCls} /></div>
              <p className="mt-1.5 text-[10px] font-light leading-relaxed text-sage">This is money you could access easily, not locked-in deposits. We like to keep at least 3 months of your expenses untouched for emergencies, and flag any purchase that would dip into it. If you leave it blank, we&apos;ll treat your emergency fund as ₹0.</p>

            </section>
          )}

          <div className="mt-9 flex gap-2.5">
            {step > 0 && <button onClick={back} className="rounded-full border-[1.5px] border-border px-6 py-3.5 text-[14px] text-sage transition hover:border-forest hover:text-forest">Back</button>}
            {step < 2
              ? <button onClick={next} className="flex-1 rounded-full bg-forest py-3.5 text-[14px] font-medium text-[#E8F5EE] transition hover:opacity-90">Continue</button>
              : <button onClick={finish} disabled={saving} className="flex-1 rounded-full bg-forest py-3.5 text-[14px] font-medium text-[#E8F5EE] transition hover:opacity-90 disabled:opacity-50">{saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Finish setup'}</button>}
          </div>
          {error && <p className="mt-4 text-center text-[12px] text-warn">{error}</p>}
        </div>
      </div>
    </main>
  )
}