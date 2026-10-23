"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import type { FinancialDashboardData } from "@/lib/services/financial-dashboard-service"

type Props = { data: FinancialDashboardData; title?: string; description?: string }
type Period = "all" | "month" | "quarter" | "year"

function money(value: number) { return `₹${value.toLocaleString("en-IN")}` }

function inPeriod(value: string, period: Period) {
  if (period === "all") return true
  const date = new Date(value)
  const now = new Date()
  if (period === "year") return date.getFullYear() === now.getFullYear()
  if (period === "month") return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
  return date.getFullYear() === now.getFullYear() && Math.floor(date.getMonth() / 3) === Math.floor(now.getMonth() / 3)
}

export function FinancialDashboard({ data, title = "Commission Overview", description = "A reconciled operating view of commissions, allocations and business expenses." }: Props) {
  const [period, setPeriod] = useState<Period>("all")
  const [propertyId, setPropertyId] = useState("all")
  const [dealId, setDealId] = useState("all")
  const [status, setStatus] = useState("all")
  const [collection, setCollection] = useState("all")
  const [reconciliation, setReconciliation] = useState("all")
  const [recipient, setRecipient] = useState("all")
  const cards = [["Gross Commission", data.summary.grossCommission], ["My Income", data.summary.myIncome], ["Net Income", data.summary.netIncome], ["Received", data.summary.receivedCommission], ["Outstanding", data.summary.outstandingCommission]] as const
  const secondary = [["Distributions payable", data.summary.distributionsPayable], ["Distributions paid", data.summary.distributionsPaid], ["Expenses paid", data.summary.paidExpenses], ["Expenses pending", data.summary.pendingExpenses], ["Needs reconciliation", data.summary.unallocated + data.summary.overallocated]] as const
  const properties = useMemo(() => uniqueOptions(data.commissions.filter((item) => item.propertyId).map((item) => [item.propertyId!, item.propertyName ?? item.propertyId!])), [data.commissions])
  const deals = useMemo(() => uniqueOptions(data.commissions.filter((item) => item.dealId).map((item) => [item.dealId!, item.dealName ?? item.dealId!])), [data.commissions])
  const recipients = useMemo(() => uniqueOptions(data.distributions.filter((item) => item.recipientName).map((item) => [item.recipientKind === "external" ? item.externalRecipientId! : item.crmUserId!, item.recipientName!])), [data.distributions])
  const rows = data.summary.commissionReconciliations.filter((item) => {
    const commission = item.commission
    const date = commission.status === "received" ? commission.receivedDate ?? commission.paymentDate ?? commission.createdAt : commission.createdAt
    if (!inPeriod(date, period)) return false
    if (propertyId !== "all" && commission.propertyId !== propertyId) return false
    if (dealId !== "all" && commission.dealId !== dealId) return false
    if (status !== "all" && commission.status !== status) return false
    if (collection === "received" && commission.status !== "received") return false
    if (collection === "outstanding" && commission.status !== "pending" && commission.status !== "invoiced") return false
    if (reconciliation !== "all" && item.reconciliationStatus !== reconciliation) return false
    return recipient === "all" || item.distributions.some((distribution) => (distribution.recipientKind === "external" ? distribution.externalRecipientId : distribution.crmUserId) === recipient)
  })

  return <div className="mx-auto max-w-[1600px] space-y-8 p-4 md:p-8">
    <div><h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1><p className="mt-1 text-muted-foreground">{description}</p></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{cards.map(([label, value]) => <Metric key={label} label={label} value={value} />)}</div>
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-lg font-semibold">Financial flow</h2><p className="mt-1 text-sm text-muted-foreground">Net income includes recorded paid and pending expenses. Net cash includes only received principal allocations and paid outflows.</p></div><p className="text-sm font-medium">Net cash: {money(data.summary.netCash)}</p></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Flow label="Gross Commission" value={data.summary.grossCommission} /><Flow label="Other-recipient distributions" value={-data.summary.otherRecipientDistributions} /><Flow label="My Income" value={data.summary.myIncome} /><Flow label="Business expenses" value={-data.summary.totalExpenses} /><Flow label="Net Income" value={data.summary.netIncome} prominent /></div>
      {data.summary.receivedPrincipalCashUnresolvedCount > 0 && <p className="mt-4 text-sm text-amber-700">{data.summary.receivedPrincipalCashUnresolvedCount} received commission{data.summary.receivedPrincipalCashUnresolvedCount === 1 ? " is" : "s are"} not included in net cash until a principal allocation is recorded.</p>}
    </section>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{secondary.map(([label, value]) => <Metric key={label} label={label} value={value} compact />)}</div>
    <section className="space-y-5 rounded-2xl border bg-card p-5 shadow-sm">
      <div><h2 className="text-xl font-semibold">Commission ledger</h2><p className="mt-1 text-sm text-muted-foreground">Review commission, collection, recipient and reconciliation state in one place.</p></div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Select label="Period" value={period} onChange={(value) => setPeriod(value as Period)} options={[["all", "All time"], ["month", "This month"], ["quarter", "This quarter"], ["year", "This year"]]} />
        <Select label="Property" value={propertyId} onChange={setPropertyId} options={[["all", "All properties"], ...properties]} />
        <Select label="Deal" value={dealId} onChange={setDealId} options={[["all", "All deals"], ...deals]} />
        <Select label="Commission status" value={status} onChange={setStatus} options={[["all", "All statuses"], ["pending", "Pending"], ["invoiced", "Invoiced"], ["received", "Received"], ["cancelled", "Cancelled"]]} />
        <Select label="Received / outstanding" value={collection} onChange={setCollection} options={[["all", "All"], ["received", "Received"], ["outstanding", "Outstanding"]]} />
        <Select label="Reconciliation" value={reconciliation} onChange={setReconciliation} options={[["all", "All"], ["reconciled", "Reconciled"], ["provisional", "Provisional remainder"], ["unallocated", "Unallocated"], ["overallocated", "Overallocated"]]} />
        <Select label="Recipient" value={recipient} onChange={setRecipient} options={[["all", "All recipients"], ...recipients]} />
      </div>
      <div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[1000px] text-sm"><thead className="bg-muted text-left"><tr><th className="p-3">Commission</th><th className="p-3">Status</th><th className="p-3">Gross</th><th className="p-3">My allocation</th><th className="p-3">Other allocations</th><th className="p-3">Unallocated</th><th className="p-3">State</th></tr></thead><tbody>{rows.map((item) => <tr key={item.commission.id} className="border-t"><td className="p-3"><Link className="font-medium hover:underline" href={`/commissions/${item.commission.id}`}>{item.commission.dealName ?? item.commission.id}</Link><p className="mt-1 text-xs text-muted-foreground">{item.distributions.map((distribution) => distribution.recipientName).filter(Boolean).join(", ") || "No allocations"}</p></td><td className="p-3 capitalize">{item.commission.status}</td><td className="p-3">{money(item.gross)}</td><td className="p-3">{money(item.myIncome)}</td><td className="p-3">{money(item.otherRecipientAllocation)}</td><td className="p-3">{money(item.unallocated)}</td><td className="p-3 capitalize">{item.reconciliationStatus.replaceAll("_", " ")}</td></tr>)}{rows.length === 0 && <tr><td className="p-8 text-center text-muted-foreground" colSpan={7}>No commissions match these filters.</td></tr>}</tbody></table></div>
    </section>
  </div>
}

function uniqueOptions(options: Array<[string, string]>) { return [...new Map(options).entries()] }
function Metric({ label, value, compact = false }: { label: string; value: number; compact?: boolean }) { return <div className={`rounded-2xl border bg-card shadow-sm ${compact ? "p-4" : "p-5"}`}><p className="text-sm text-muted-foreground">{label}</p><p className={`mt-2 font-semibold ${compact ? "text-lg" : "text-2xl"}`}>{money(value)}</p></div> }
function Flow({ label, value, prominent = false }: { label: string; value: number; prominent?: boolean }) { return <div className={`rounded-xl border p-4 ${prominent ? "bg-primary text-primary-foreground" : "bg-muted/30"}`}><p className="text-xs opacity-80">{label}</p><p className="mt-1 text-lg font-semibold">{value < 0 ? "− " : ""}{money(Math.abs(value))}</p></div> }
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<[string, string]> }) { return <label className="text-sm"><span className="mb-1 block text-muted-foreground">{label}</span><select className="w-full rounded-md border bg-background p-2" value={value} onChange={(event) => onChange(event.target.value)}>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label> }
