'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogoMark, Wordmark } from '@/components/Logo'

export default function LoginPage() {
  const router = useRouter()
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 1800)
    return () => clearTimeout(t)
  }, [])

  const handleGoogle = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${location.origin}/auth/callback` } })
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-6">
      <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center bg-sage-whisper transition-opacity duration-700 ${showSplash ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
        <div className={`flex flex-col items-center transition-transform duration-700 ${showSplash ? 'scale-100' : 'scale-90'}`}>
          <LogoMark size={76} />
          <p className="mt-5 text-[12px] tracking-wide text-sage">Know before you buy.</p>
        </div>
      </div>

      <div className={`flex w-full max-w-[340px] flex-col items-center text-center transition-opacity duration-700 ${showSplash ? 'opacity-0' : 'opacity-100'}`}>
        <LogoMark size={48} />
        <div className="mt-4"><Wordmark className="text-[20px]" /></div>
        <p className="mb-8 mt-1 text-[10px] tracking-wide text-sage">Know before you buy.</p>

        <h2 className="font-display text-[18px] font-semibold leading-tight text-forest">An honest gut-check<br />before you spend.</h2>
        <p className="mb-7 mt-3 text-[10px] font-light leading-relaxed text-sage">Enter your real numbers and get a straight verdict — not a guess.</p>

        <button onClick={() => router.push('/onboarding?guest=1')}
          className="mb-2.5 w-full rounded-full bg-mint py-3 text-[13px] font-semibold text-forest transition hover:opacity-90">
          Try it first →
        </button>

        <button onClick={handleGoogle}
          className="flex w-full items-center justify-center gap-3 rounded-full border-[0.5px] border-border bg-white px-6 py-3 text-[13px] font-medium text-forest transition hover:bg-mist">
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/>
            <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"/>
          </svg>
          Continue with Google
        </button>

        <p className="mt-3.5 text-[10px] text-placeholder">By continuing you agree to our Terms & Privacy Policy.</p>
      </div>
    </main>
  )
}