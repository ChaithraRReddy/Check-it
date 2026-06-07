'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { computeVerdict, type FinancialProfile, type VerdictResult } from '@/lib/verdict'

const inr = (n: number) => Math.round(n).toLocaleString('en-IN')

const PILL = {
  yes: { bg: 'bg-yes-fill', text: 'text-yes-text', dot: '#3EC98A', label: 'Yes, go for it' },
  careful: { bg: 'bg-careful-fill', text: 'text-careful-text', dot: '#F5A623', label: 'Careful' },
  no: { bg: 'bg-no-fill', text: 'text-no-text', dot: '#E24B4A', label: 'Not yet' },
} as const

const fieldCls = 'w-full rounded-xl border-[1.5px] border-border bg-white py-3 pl-8 pr-4 text-[15px] text-forest outline-none transition focus:border-forest placeholder:text-placeholder'
const fieldPlain = 'w-full rounded-xl border-[1.5px] border-border bg-white px-4 py-3 text-[15px] text-forest outline-none transition focus:border-forest placeholder:text-placeholder'

const Currency = () => (
  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-number text-[15px] font-light text-sage">₹</span>
)

export default function CheckPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<FinancialProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'entry' | 'verdict'>('entry')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [ptype, setPtype] = useState<'onetime' | 'emi'>('onetime')
  const [amount, setAmount] = useState('')
  const [emiMonthly, setEmiMonthly] = useState('')
  const [emiMonths, setEmiMonths] = useState('')
  const [emiRate, setEmiRate] = useState('')
  const [result, setResult] = useState<VerdictResult | null>(null)

  useEffect(() => {
    (async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      if (!prof) { router.push('/onboarding'); return }
      const { data: commitments } = await supabase.from('commitments').select('amount').eq('user_id', user.id)
      const totalCommitments = (commitments ?? []).reduce((s, c) => s + Number(c.amount), 0)
      setProfile({
        income: Number(prof.monthly_income),
        totalCommitments,
        savings: Number(prof.monthly_savings),
        buffer: Number(prof.liquid_buffer),
      })
      setLoading(false)
    })()
  }, [router])

  const getVerdict = async () => {
    setError('')
    if (!name.trim()) return setError('Give the purchase a name.')
    if (ptype === 'onetime') {
      if (!amount || Number(amount) <= 0) return setError('Enter the total price.')
    } else if (!emiMonthly || Number(emiMonthly) <= 0 || !emiMonths || Number(emiMonths) <= 0) {
      return setError('Enter the monthly EMI and number of months.')
    }
    if (!profile) return

    const purchase = {
      name: name.trim(),
      type: ptype,
      amount: ptype === 'onetime' ? Number(amount) : undefined,
      emiMonthly: ptype === 'emi' ? Number(emiMonthly) : undefined,
      emiMonths: ptype === 'emi' ? Number(emiMonths) : undefined,
      emiRate: ptype === 'emi' && emiRate ? Number(emiRate) : undefined,
    }
    const r = computeVerdict(profile, purchase)
    setResult(r)
    setSaving(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('checks').insert({
        user_id: user.id,
        purchase_name: purchase.name,
        purchase_type: purchase.type,
        purchase_amount: purchase.amount ?? null,
        emi_monthly: purchase.emiMonthly ?? null,
        emi_months: purchase.emiMonths ?? null,
        emi_rate: purchase.emiRate ?? null,
        total_cost: r.totalCost,
        verdict: r.verdict,
        free_cash: r.freeCash,
        required_buffer: r.requiredBuffer,
      })
    }
    setSaving(false)
    setView('verdict')
  }

  const checkAnother = () => {
    setName(''); setAmount(''); setEmiMonthly(''); setEmiMonths(''); setEmiRate('')
    setPtype('onetime'); setResult(null); setError(''); setView('entry')
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center"><p className="text-[12px] text-sage">Loading…</p></main>
  }

  return (
    <main className="mx-auto min-h-screen max-w-[420px] px-5 pb-10 pt-6">
      <div className="mb-5 flex items-center">
        <button onClick={() => router.push('/home')} aria-label="Back" className="text-[18px] text-sage">←</button>
        <span className="mx-auto font-display text-[16px] font-semibold text-forest">Check<span className="text-mint">.</span>it</span>
        <span className="w-4" />
      </div>

      {view === 'entry' && (
        <section className="mt-2">
          <h1 className="font-display text-[18px] font-semibold leading-tight text-forest">What are you thinking of buying?</h1>
          <p className="mb-6 mt-1.5 text-[12px] font-light text-sage">Tell us what it is, and how you plan to pay.</p>

          <label className="mb-1.5 block text-[11px] font-medium tracking-wide text-sage">What is it?</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. iPhone 16 Pro, Sofa…" className={`${fieldPlain} mb-5`} />

          <label className="mb-1.5 block text-[11px] font-medium tracking-wide text-sage">How are you paying?</label>
          <div className="mb-5 flex gap-2">
            {(['onetime', 'emi'] as const).map(t => (
              <button key={t} onClick={() => setPtype(t)}
                className={`flex-1 rounded-lg py-2.5 text-[13px] transition ${ptype === t ? 'bg-forest text-[#E8F5EE]' : 'border-[1.5px] border-border text-sage'}`}>
                {t === 'onetime' ? 'One-time' : 'EMI'}
              </button>
            ))}
          </div>

          {ptype === 'onetime' ? (
            <>
              <label className="mb-1.5 block text-[11px] font-medium tracking-wide text-sage">Total price</label>
              <div className="relative"><Currency />
                <input value={amount} onChange={e => setAmount(e.target.value)} type="number" inputMode="numeric" placeholder="85,000" className={fieldCls} />
              </div>
            </>
          ) : (
            <div className="flex gap-2.5">
              <div className="flex-1">
                <label className="mb-1.5 block text-[11px] font-medium tracking-wide text-sage">Monthly EMI</label>
                <div className="relative"><Currency />
                  <input value={emiMonthly} onChange={e => setEmiMonthly(e.target.value)} type="number" inputMode="numeric" placeholder="3,500" className={fieldCls} />
                </div>
              </div>
              <div className="w-[76px]">
                <label className="mb-1.5 block text-[11px] font-medium tracking-wide text-sage">Months</label>
                <input value={emiMonths} onChange={e => setEmiMonths(e.target.value)} type="number" inputMode="numeric" placeholder="24" className={fieldPlain} />
              </div>
              <div className="w-[66px]">
                <label className="mb-1.5 block text-[11px] font-medium tracking-wide text-sage">Rate %</label>
                <input value={emiRate} onChange={e => setEmiRate(e.target.value)} type="number" inputMode="numeric" placeholder="14" className={fieldPlain} />
              </div>
            </div>
          )}

          {error && <p className="mt-4 text-[12px] text-warn">{error}</p>}

          <button onClick={getVerdict} disabled={saving}
            className="mt-8 w-full rounded-full bg-mint py-4 text-[14px] font-semibold text-forest transition hover:opacity-90 disabled:opacity-50">
            {saving ? 'Checking…' : 'Get verdict →'}
          </button>
        </section>
      )}

      {view === 'verdict' && result && (
        <section className="mt-2">
          <span className={`mb-4 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-medium ${PILL[result.verdict].bg} ${PILL[result.verdict].text}`}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: PILL[result.verdict].dot }} />{PILL[result.verdict].label}
          </span>
          <h1 className="font-display text-[20px] font-semibold leading-tight text-forest">{result.headline}</h1>
          <p className="mb-6 mt-3 text-[12px] font-light leading-relaxed text-sage">{result.reason}</p>

          <div className="rounded-2xl border-[0.5px] border-border bg-white p-4">
            <p className="mb-3 text-[9px] font-medium uppercase tracking-[0.12em] text-placeholder">Your picture</p>
            <div className="space-y-2 text-[12px]">
              <BRow label="Take-home income" value={`₹${inr(profile!.income)}`} />
              <BRow label="Fixed commitments" value={`−₹${inr(profile!.totalCommitments)}`} />
              <BRow label="Monthly savings" value={`−₹${inr(profile!.savings)}`} />
              <BRow label="Free cash / month" value={`₹${inr(result.freeCash)}`} accent danger={result.freeCash < 0} />
              {ptype === 'emi'
                ? <BRow label="EMI / month" value={`₹${inr(Number(emiMonthly))}`} accent />
                : <BRow label="Purchase cost" value={`₹${inr(result.totalCost)}`} accent />}
              <BRow label="Emergency buffer" value={`need ₹${inr(result.requiredBuffer)}`} />
            </div>
          </div>

          {result.verdict !== 'yes' && result.monthsToSave && (
            <div className="mt-4 rounded-2xl bg-[#F0F7F2] p-4">
              <p className="text-[12px] font-medium text-forest">What would make this a yes?</p>
              <p className="mt-1 text-[12px] font-light leading-relaxed text-sage">
                Keep setting aside what you save each month and you could comfortably afford this in about{' '}
                <span className="font-medium text-forest">{result.monthsToSave} month{result.monthsToSave > 1 ? 's' : ''}</span>.
              </p>
            </div>
          )}

          <div className="mt-7 flex gap-2.5">
            <button onClick={() => router.push('/home')} className="flex-1 rounded-full border-[1.5px] border-border py-3.5 text-[13px] text-sage transition hover:border-forest hover:text-forest">Back to home</button>
            <button onClick={checkAnother} className="flex-1 rounded-full bg-mint py-3.5 text-[13px] font-semibold text-forest transition hover:opacity-90">Check another</button>
          </div>
        </section>
      )}
    </main>
  )
}

function BRow({ label, value, accent, danger }: { label: string; value: string; accent?: boolean; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sage">{label}</span>
      <span className={`font-number font-medium ${danger ? 'text-warn' : accent ? 'text-mint' : 'text-forest'}`}>{value}</span>
    </div>
  )
}