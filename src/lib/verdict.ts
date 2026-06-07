export type Verdict = 'yes' | 'careful' | 'no'

export interface FinancialProfile {
  income: number
  totalCommitments: number
  savings: number
  buffer: number
}

export interface PurchaseInput {
  name: string
  type: 'onetime' | 'emi'
  amount?: number
  emiMonthly?: number
  emiMonths?: number
  emiRate?: number
}

export interface VerdictResult {
  verdict: Verdict
  headline: string
  reason: string
  totalCost: number
  freeCash: number
  requiredBuffer: number
  monthsToSave: number | null
}

const inr = (n: number) => Math.round(n).toLocaleString('en-IN')

export function computeVerdict(
  profile: FinancialProfile,
  purchase: PurchaseInput
): VerdictResult {
  const { income, totalCommitments, savings, buffer } = profile

  const monthlyCash = income - totalCommitments - savings
  const requiredBuffer = totalCommitments * 3
  const bufferGap = requiredBuffer - buffer        // +ve = buffer is short
  const bufferOk = bufferGap <= 0

  const isEMI = purchase.type === 'emi'
  const purchaseMonthly = isEMI ? purchase.emiMonthly ?? 0 : 0
  const totalCost = isEMI
    ? purchaseMonthly * (purchase.emiMonths ?? 0)
    : purchase.amount ?? 0

  // safe monthly saving rate — guards against divide-by-zero / Infinity
  const saveRate = savings > 0 ? savings : Math.max(monthlyCash * 0.3, 0)
  const monthsFor = (shortfall: number) =>
    saveRate > 0 ? Math.ceil(shortfall / saveRate) : null

  const name = purchase.name
  let verdict: Verdict
  let headline: string
  let reason: string
  let monthsToSave: number | null = null

  if (!isEMI) {
    const stillHasBuffer = buffer - totalCost >= requiredBuffer
    const canAffordFromFree = monthlyCash >= totalCost

    if (canAffordFromFree && bufferOk) {
      verdict = 'yes'
      headline = `Go for the ${name}.`
      reason = `You have ₹${inr(monthlyCash)} of free cash this month — enough to cover ₹${inr(totalCost)} outright while keeping your emergency buffer fully intact.`
    } else if (bufferOk && stillHasBuffer) {
      verdict = 'careful'
      headline = `Possible, but spend from savings carefully.`
      reason = `Your monthly free cash (₹${inr(monthlyCash)}) doesn't cover the full ₹${inr(totalCost)}, but you could fund it from savings without dropping below your 3-month buffer. Have a plan to replenish.`
    } else if (bufferOk) {
      const shortfall = totalCost - monthlyCash
      monthsToSave = monthsFor(shortfall)
      verdict = 'no'
      headline = `Not yet — the timing isn't right.`
      reason = `₹${inr(totalCost)} would eat into your emergency buffer. With ₹${inr(monthlyCash)}/month free, you're ₹${inr(shortfall)} short. Save up for it instead of touching the cushion.`
    } else {
      monthsToSave = monthsFor(totalCost + bufferGap)
      verdict = 'no'
      headline = `Not yet — fix your safety net first.`
      reason = `Your emergency buffer is ₹${inr(bufferGap)} short of the 3-month target, and the purchase isn't covered by free cash. Sort the cushion first, then revisit this.`
    }
  } else {
    const freeAfterEMI = monthlyCash - purchaseMonthly

    if (freeAfterEMI >= 0 && bufferOk) {
      verdict = 'yes'
      headline = `Yes — the EMI fits comfortably.`
      reason = `₹${inr(purchaseMonthly)}/mo leaves you ₹${inr(freeAfterEMI)} of breathing room after all commitments. Total cost is ₹${inr(totalCost)} over ${purchase.emiMonths} months, and your buffer is healthy.`
    } else if (freeAfterEMI >= 0 && !bufferOk) {
      monthsToSave = monthsFor(bufferGap)
      verdict = 'careful'
      headline = `EMI fits, but build your buffer first.`
      reason = `The ₹${inr(purchaseMonthly)}/mo payment is manageable, but your emergency fund is ₹${inr(bufferGap)} below the 3-month target. Build the cushion first, then take on the EMI.`
    } else {
      const monthlyShort = Math.abs(freeAfterEMI)
      verdict = 'no'
      headline = `This EMI stretches you too thin.`
      reason = `Adding ₹${inr(purchaseMonthly)}/mo would leave you ₹${inr(monthlyShort)} short every month. Over ${purchase.emiMonths} months that's a ₹${inr(monthlyShort * (purchase.emiMonths ?? 0))} hole. Negotiate a smaller EMI or save up.`
    }
  }

  return { verdict, headline, reason, totalCost, freeCash: monthlyCash, requiredBuffer, monthsToSave }
}