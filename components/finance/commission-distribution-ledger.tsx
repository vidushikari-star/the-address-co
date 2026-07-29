"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { AddDistributionDrawer } from "@/components/finance/add-distribution-drawer"

import type { CommissionDistribution } from "@/types/commission-distribution"
import type { Commission } from "@/types/commission"

import {
  deleteCommissionDistributionGroup,
  updateCommissionDistributionGroupStatus,
} from "@/lib/repositories/commission-distribution-repository"

type Props = {
  distributions: CommissionDistribution[]
  commissions: Commission[]
}

function money(value: number) {
  return `₹${value.toLocaleString("en-IN")}`
}

function StatusBadge({
  complete,
}: {
  complete: boolean
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
        complete
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
      }`}
    >
      {complete ? "Complete" : "Pending"}
    </span>
  )
}

export function CommissionDistributionLedger({
  distributions,
  commissions,
}: Props) {
  const router = useRouter()

  const [pending, startTransition] = useTransition()

  const [open, setOpen] = useState(false)

  const [editingCommissionId, setEditingCommissionId] =
    useState<string>()

  const [editingDistributions, setEditingDistributions] =
    useState<CommissionDistribution[]>([])

  const commissionMap = useMemo(() => {
    return new Map(
      commissions.map((commission) => [
        commission.id,
        commission,
      ])
    )
  }, [commissions])

  const grouped = useMemo(() => {
    return distributions.reduce<
      Record<string, CommissionDistribution[]>
    >((groups, item) => {
      if (!groups[item.commissionId]) {
        groups[item.commissionId] = []
      }

      groups[item.commissionId].push(item)

      return groups
    }, {})
  }, [distributions])

  const rows = Object.entries(grouped)

  function openCreateDrawer() {
    setEditingCommissionId(undefined)
    setEditingDistributions([])
    setOpen(true)
  }

  function editSplit(
    commissionId: string,
    items: CommissionDistribution[]
  ) {
    setEditingCommissionId(commissionId)
    setEditingDistributions(items)
    setOpen(true)
  }

  function toggleStatus(
    commissionId: string,
    complete: boolean
  ) {
    startTransition(async () => {
      await updateCommissionDistributionGroupStatus(
        commissionId,
        complete ? "pending" : "paid"
      )

      router.refresh()
    })
  }

  function deleteSplit(commissionId: string) {
    const confirmed = window.confirm(
      "Delete this commission split?"
    )

    if (!confirmed) return

    startTransition(async () => {
      await deleteCommissionDistributionGroup(
        commissionId
      )

      router.refresh()
    })
  }

  return (
        <div className="space-y-6 rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            Commission Distribution Ledger
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Track internal commission splits across advisors.
          </p>
        </div>

        <Button onClick={openCreateDrawer}>
          + Record Commission Split
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-12 text-center">
          <h3 className="font-medium">
            No commission splits yet
          </h3>

          <p className="mt-2 text-sm text-muted-foreground">
            Record your first commission distribution to
            start tracking internal payouts.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile */}

          <div className="space-y-4 lg:hidden">
            {rows.map(([commissionId, items]) => {
              const commission =
                commissionMap.get(commissionId)

              const complete = items.every(
                (item) => item.status === "paid"
              )

              return (
                <div
                  key={commissionId}
                  className="rounded-2xl border bg-background p-5 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">
                        {commission?.dealName ??
                          items[0]?.dealName ??
                          "-"}
                      </h3>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Total Commission
                      </p>

                      <p className="font-semibold">
                        {money(
                          commission?.amount ?? 0
                        )}
                      </p>
                    </div>

                    <StatusBadge complete={complete} />
                  </div>

                  <div className="mt-5">
                    <p className="mb-3 text-sm font-medium">
                      Distribution
                    </p>

                    <div className="space-y-2">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-xl border bg-muted/30 px-3 py-2"
                        >
                          <span className="font-medium">
                            {item.userName ?? "-"}
                          </span>

                          <span className="font-semibold">
                            {money(item.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant={
                        complete
                          ? "secondary"
                          : "default"
                      }
                      disabled={pending}
                      onClick={() =>
                        toggleStatus(
                          commissionId,
                          complete
                        )
                      }
                    >
                      {complete
                        ? "Mark Pending"
                        : "Mark Complete"}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        editSplit(
                          commissionId,
                          items
                        )
                      }
                    >
                      Edit
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={pending}
                      onClick={() =>
                        deleteSplit(
                          commissionId
                        )
                      }
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop */}

          <div className="hidden overflow-x-auto rounded-2xl border lg:block">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="sticky top-0 bg-muted">
                <tr>
                  <th className="p-4 text-left">
                    Deal
                  </th>

                  <th className="p-4 text-left">
                    Total Commission
                  </th>

                  <th className="p-4 text-left">
                    Distribution
                  </th>

                  <th className="p-4 text-left">
                    Status
                  </th>

                  <th className="p-4 text-left">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                                {rows.map(([commissionId, items]) => {
                  const commission =
                    commissionMap.get(commissionId)

                  const complete = items.every(
                    (item) => item.status === "paid"
                  )

                  return (
                    <tr
                      key={commissionId}
                      className="border-t transition-colors hover:bg-muted/30"
                    >
                      <td className="p-4 font-medium">
                        {commission?.dealName ??
                          items[0]?.dealName ??
                          "-"}
                      </td>

                      <td className="p-4 font-semibold">
                        {money(
                          commission?.amount ?? 0
                        )}
                      </td>

                      <td className="p-4">
                        <div className="flex flex-wrap gap-2">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-lg border bg-muted/30 px-3 py-2"
                            >
                              <p className="text-xs text-muted-foreground">
                                {item.userName ?? "-"}
                              </p>

                              <p className="font-medium">
                                {money(item.amount)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="p-4">
                        <StatusBadge
                          complete={complete}
                        />
                      </td>

                      <td className="p-4">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant={
                              complete
                                ? "secondary"
                                : "default"
                            }
                            disabled={pending}
                            onClick={() =>
                              toggleStatus(
                                commissionId,
                                complete
                              )
                            }
                          >
                            {complete
                              ? "Mark Pending"
                              : "Mark Complete"}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              editSplit(
                                commissionId,
                                items
                              )
                            }
                          >
                            Edit
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={pending}
                            onClick={() =>
                              deleteSplit(
                                commissionId
                              )
                            }
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <AddDistributionDrawer
        open={open}
        onOpenChange={setOpen}
        commissions={commissions}
        editingCommissionId={
          editingCommissionId
        }
        editingDistributions={
          editingDistributions
        }
      />
    </div>
  )
}
              