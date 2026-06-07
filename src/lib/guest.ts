export type GuestProfile = {
  income: number
  savings: number
  buffer: number
  commitments: { label: string; amount: number }[]
}

export type GuestCheck = {
  purchase_name: string
  purchase_type: 'onetime' | 'emi'
  purchase_amount: number | null
  emi_monthly: number | null
  emi_months: number | null
  emi_rate: number | null
  total_cost: number
  verdict: 'yes' | 'careful' | 'no'
  free_cash: number
  required_buffer: number
}

const PROFILE_KEY = 'checkit_guest_profile'
const CHECK_KEY = 'checkit_guest_check'

export function saveGuestProfile(p: GuestProfile) { sessionStorage.setItem(PROFILE_KEY, JSON.stringify(p)) }
export function getGuestProfile(): GuestProfile | null {
  try { const v = sessionStorage.getItem(PROFILE_KEY); return v ? JSON.parse(v) : null } catch { return null }
}
export function saveGuestCheck(c: GuestCheck) { sessionStorage.setItem(CHECK_KEY, JSON.stringify(c)) }
export function getGuestCheck(): GuestCheck | null {
  try { const v = sessionStorage.getItem(CHECK_KEY); return v ? JSON.parse(v) : null } catch { return null }
}
export function clearGuest() { sessionStorage.removeItem(PROFILE_KEY); sessionStorage.removeItem(CHECK_KEY) }