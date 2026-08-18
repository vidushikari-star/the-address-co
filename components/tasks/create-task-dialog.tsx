"use client"

import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getAllUserProfiles } from "@/lib/repositories/user-profile-repository"
import { createTask } from "@/lib/repositories/task-repository"

import type { TaskPriority } from "@/types/task"
import type { UserProfile } from "@/types/user"

type Props = {
  contactId?: string
  dealId?: string
  onCreated?: () => void
}

const initialForm = {
  title: "",
  description: "",
  priority: "medium" as TaskPriority,
  dueDate: "",
  dueTime: "",
  assignedTo: "",
}

export function CreateTaskDialog({
  contactId,
  dealId,
  onCreated,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [advisors, setAdvisors] = useState<UserProfile[]>([])
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadAdvisors() {
      try {
        setAdvisors(await getAllUserProfiles())
      } catch (error) {
        console.error("Unable to load task assignees", error)
        setError("Unable to load advisors. You can still create an unassigned task.")
      }
    }

    if (open) {
      setError(null)
      loadAdvisors()
    }
  }, [open])

  function update<K extends keyof typeof initialForm>(
    key: K,
    value: typeof initialForm[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()

    if (!form.title.trim()) {
      setError("Task title is required.")
      return
    }

    setSaving(true)
    setError(null)

    try {
      await createTask({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        priority: form.priority,
        dueDate: form.dueDate || undefined,
        dueTime: form.dueTime || undefined,
        assignedTo: form.assignedTo || undefined,
        contactId,
        dealId,
      })

      setForm(initialForm)
      setOpen(false)
      onCreated?.()
      router.refresh()
    } catch (error) {
      console.error("Unable to create task", error)
      setError("Unable to create the task. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button className="w-full sm:w-auto" onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        New Task
      </Button>

      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-lg overflow-y-auto p-0">
        <form onSubmit={submit}>
          <DialogHeader className="p-5 pr-12">
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>
              Track the next action for this relationship or deal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-5 pb-5">
            <div className="space-y-2">
              <label htmlFor="task-title" className="text-sm font-medium">
                Task title <span className="text-destructive">*</span>
              </label>
              <Input
                id="task-title"
                value={form.title}
                onChange={(event) => update("title", event.target.value)}
                placeholder="Call to discuss shortlisted properties"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="task-description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="task-description"
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
                placeholder="Context, talking points, or expected outcome"
                rows={4}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label htmlFor="task-priority" className="text-sm font-medium">
                  Priority
                </label>
                <select
                  id="task-priority"
                  className="w-full rounded-md border bg-background px-3 py-2"
                  value={form.priority}
                  onChange={(event) =>
                    update("priority", event.target.value as TaskPriority)
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="task-due-date" className="text-sm font-medium">
                  Due date
                </label>
                <Input
                  id="task-due-date"
                  type="date"
                  value={form.dueDate}
                  onChange={(event) => update("dueDate", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="task-due-time" className="text-sm font-medium">
                  Due time <span className="text-muted-foreground">(optional)</span>
                </label>
                <Input
                  id="task-due-time"
                  type="time"
                  value={form.dueTime}
                  onChange={(event) => update("dueTime", event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="task-assignee" className="text-sm font-medium">
                Assigned advisor
              </label>
              <select
                id="task-assignee"
                className="w-full rounded-md border bg-background px-3 py-2"
                value={form.assignedTo}
                onChange={(event) => update("assignedTo", event.target.value)}
              >
                <option value="">Unassigned</option>
                {advisors.map((advisor) => (
                  <option key={advisor.id} value={advisor.id}>
                    {advisor.name}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
