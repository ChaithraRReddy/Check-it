'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const CATEGORIES = ['Rent/PG', 'EMI', 'SIP/MF', 'Insurance', 'Subscriptions', 'Utilities', 'Other']
type Expense = { label: string; amount: string }

const fieldCls =
  'w-full rounded-xl border-[1.5px] border-border bg-white py-3 pl-8 pr-4 text-[15px] text-forest outline-none transition focus:border-forest placeholder:text-placeholder'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [income, setIncome] = useState('')
  const [expenses, setExpenses] = useState<Expense[]>([{ label: 'Rent/PG', amount: '' }])
  const [savings, setSavings] = useState('')
  const [buffer, setBuffer] = useState('')

  const updateExpense = (i: number, patch: Partial<Expense>) =>
    setExpenses(prev => prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)))
  const addExpense = () => setExpenses(prev => [...prev, { label: 'Other', amount: '' }])
  const removeExpense = (i: number) =>
    setExpenses(prev => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev))

  const next = () => {
    setError('')
    if (step === 0 && (!income || Number(income) <= 0)) return setError('Please enter your monthly income.')
    if (step === 1) {
      if (expenses.filter(e => Number(e.amount) > 0).length === 0) return setError('Add at least one commitment.')
      if (savings === '' || Number(savings) < 0) return setError('Enter your monthly savings (0 is fine).')
    }
    setStep(s => s + 1)
  }
  const back = () => { setError(''); setStep(s => s - 1) }

  const finish = async () => {
    setError('')
    if (buffer === '' || Number(buffer) < 0) return setError('Enter your liquid savings (0 is fine).')
    setSaving(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }

    const cleanExpenses = expenses
      .filter(e => Number(e.amount) > 0)
      .map(e => ({ user_id: user.id, label: e.label, amount: Number(e.amount) }))

    const { error: pErr } = await supabase.from('profiles').upsert({
      id: user.id,
      monthly_income: Number(income),
      monthly_savings: Number(savings),
      liquid_buffer: Number(buffer),
    })
    await supabase.from('commitments').delete().eq('user_id', user.id)
    const { error: cErr } = await supabase.from('commitments').insert(cleanExpenses)

    if (pErr || cErr) {
      setSaving(false)
      setError('Something went wrong saving your profile. Please try again.')
      return
    }
    router.push('/home')
  }

  const dotCls = (i: number) =>
    `h-[3px] flex-1 rounded-full transition-colors ${
      i < step ? 'bg-forest' : i === step ? 'bg-mint' : 'bg-border'
    }`

  const Currency = () => (
    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-number text-[15px] font-light text-sage">₹</span>
  )

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-[420px] rounded-3xl border-[0.5px] border-border bg-white p-7">
        <div className="mb-9 flex gap-1.5">
          {[0, 1, 2].map(i => <div key={i} className={dotCls(i)} />)}
        </div>

        {step === 0 && (
          <section>
            <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.12em] text-placeholder">Step 1 of 3</p>
            <h2 className="font-display text-[22px] font-semibold leading-tight text-forest">What do you take home?</h2>
            <p className="mb-7 mt-1.5 text-[12px] font-light leading-relaxed text-sage">Your monthly in-hand salary, after all deductions.</p>
            <label className="mb-1.5 block text-[11px] font-medium tracking-wide text-sage">Monthly take-home income</label>
            <div className="relative">
              <Currency />
              <input value={income} onChange={e => setIncome(e.target.value)} type="number" inputMode="numeric" placeholder="55,000" className={fieldCls} />
            </div>
          </section>
        )}

        {step === 1 && (
          <section>
            <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.12em] text-placeholder">Step 2 of 3</p>
            <h2 className="font-display text-[22px] font-semibold leading-tight text-forest">Fixed commitments</h2>
            <p className="mb-6 mt-1.5 text-[12px] font-light leading-relaxed text-sage">Rent, EMIs, SIPs — money that leaves before you see it.</p>

            {expenses.map((exp, i) => (
              <div key={i} className="mb-3 flex gap-2.5">
                <select value={exp.label} onChange={e => updateExpense(i, { label: e.target.value })}
                  className="w-[118px] shrink-0 rounded-xl border-[1.5px] border-border bg-white px-3 py-3 text-[13px] text-forest outline-none focus:border-forest">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <div className="relative flex-1">
                  <Currency />
                  <input value={exp.amount} onChange={e => updateExpense(i, { amount: e.target.value })} type="number" inputMode="numeric" placeholder="Amount"
                    className="w-full rounded-xl border-[1.5px] border-border bg-white py-3 pl-8 pr-3 text-[15px] text-forest outline-none focus:border-forest placeholder:text-placeholder" />
                </div>
                <button onClick={() => removeExpense(i)} disabled={expenses.length === 1} aria-label="Remove"
                  className="w-11 shrink-0 rounded-xl border-[1.5px] border-border text-lg text-sage transition hover:border-warn hover:text-warn disabled:opacity-40 disabled:hover:border-border disabled:hover:text-sage">×</button>
              </div>
            ))}

            <button onClick={addExpense} className="flex w-full items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-dashed border-border py-3 text-[13px] text-sage transition hover:border-sage">+ Add commitment</button>

            <label className="mb-1.5 mt-6 block text-[11px] font-medium tracking-wide text-sage">Monthly savings / investments</label>
            <div className="relative">
              <Currency />
              <input value={savings} onChange={e => setSavings(e.target.value)} type="number" inputMode="numeric" placeholder="10,000" className={fieldCls} />
            </div>
          </section>
        )}

        {step === 2 && (
          <section>
            <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.12em] text-placeholder">Step 3 of 3</p>
            <h2 className="font-display text-[22px] font-semibold leading-tight text-forest">Your safety cushion</h2>
            <p className="mb-7 mt-1.5 text-[12px] font-light leading-relaxed text-sage">How much do you have in easily accessible savings right now?</p>
            <label className="mb-1.5 block text-[11px] font-medium tracking-wide text-sage">Current liquid savings</label>
            <div className="relative">
              <Currency />
              <input value={buffer} onChange={e => setBuffer(e.target.value)} type="number" inputMode="numeric" placeholder="75,000" className={fieldCls} />
            </div>
            <p className="mt-4 rounded-xl bg-[#F0F7F2] p-3.5 text-[11px] font-light leading-relaxed text-sage">
              We protect 3 months of your essential expenses as an emergency buffer. Purchases won&apos;t get a green light if they&apos;d eat into it.
            </p>
          </section>
        )}

        <div className="mt-9 flex gap-2.5">
          {step > 0 && (
            <button onClick={back} className="rounded-full border-[1.5px] border-border px-6 py-3.5 text-[14px] text-sage transition hover:border-forest hover:text-forest">Back</button>
          )}
          {step < 2 ? (
            <button onClick={next} className="flex-1 rounded-full bg-forest py-3.5 text-[14px] font-medium text-[#E8F5EE] transition hover:opacity-90">Continue</button>
          ) : (
            <button onClick={finish} disabled={saving} className="flex-1 rounded-full bg-forest py-3.5 text-[14px] font-medium text-[#E8F5EE] transition hover:opacity-90 disabled:opacity-50">
              {saving ? 'Saving…' : 'Finish setup'}
            </button>
          )}
        </div>

        {error && <p className="mt-4 text-center text-[12px] text-warn">{error}</p>}
      </div>
    </main>
  )
}