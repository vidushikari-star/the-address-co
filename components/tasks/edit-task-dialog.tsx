"use client"

import {
  useEffect,
  useState,
} from "react"

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
import { updateTask } from "@/lib/repositories/task-repository"

import type { TaskWithContext } from "@/lib/repositories/task-server-repository"
import type { TaskPriority } from "@/types/task"
import type { UserProfile } from "@/types/user"

type Props = {
  task: TaskWithContext
  onUpdated?: () => void
}

function getInitialForm(task: TaskWithContext) {
  return {
    title: task.title,
    description: task.description ?? "",
    priority: task.priority,
    dueDate: task.dueDate ?? "",
    dueTime: task.dueTime ?? "",
    assignedTo: task.assignedTo ?? "",
  }
}

export function EditTaskDialog({
  task,
  onUpdated,
}: Props) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [advisors, setAdvisors] = useState<UserProfile[]>([])
  const [form, setForm] = useState(() => getInitialForm(task))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    setForm(getInitialForm(task))
    setError(null)

    getAllUserProfiles()
      .then(setAdvisors)
      .catch((error) => {
        console.error("Unable to load task assignees", error)
        setError("Unable to load advisors. You can still save the task unassigned.")
      })
  }, [open, task])

  async function save(event: React.FormEvent) {
    event.preventDefault()

    if (!form.title.trim()) {
      setError("Task title is required.")
      return
    }

    setSaving(true)
    setError(null)

    try {
      await updateTask(task.id, {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        priority: form.priority,
        dueDate: form.dueDate || undefined,
        dueTime: form.dueTime || undefined,
        assignedTo: form.assignedTo || undefined,
        completed: task.completed,
        archived: task.archived,
      })

      setOpen(false)
      onUpdated?.()
    } catch (error) {
      console.error("Unable to update task", error)
      setError("Unable to save the task. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Edit
      </Button>

      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-lg overflow-y-auto p-0">
        <form onSubmit={save}>
          <DialogHeader className="p-5 pr-12">
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update the task context, ownership, or due date.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-5 pb-5">
            <div className="space-y-2">
              <label
                htmlFor={`task-${task.id}-title`}
                className="text-sm font-medium"
              >
                Task title <span className="text-destructive">*</span>
              </label>
              <Input
                id={`task-${task.id}-title`}
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor={`task-${task.id}-description`}
                className="text-sm font-medium"
              >
                Description
              </label>
              <Textarea
                id={`task-${task.id}-description`}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                rows={4}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label
                  htmlFor={`task-${task.id}-priority`}
                  className="text-sm font-medium"
                >
                  Priority
                </label>
                <select
                  id={`task-${task.id}-priority`}
                  className="w-full rounded-md border bg-background px-3 py-2"
                  value={form.priority}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      priority: event.target.value as TaskPriority,
                    }))
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor={`task-${task.id}-due-date`}
                  className="text-sm font-medium"
                >
                  Due date
                </label>
                <Input
                  id={`task-${task.id}-due-date`}
                  type="date"
                  value={form.dueDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      dueDate: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor={`task-${task.id}-due-time`}
                  className="text-sm font-medium"
                >
                  Due time <span className="text-muted-foreground">(optional)</span>
                </label>
                <Input
                  id={`task-${task.id}-due-time`}
                  type="time"
                  value={form.dueTime}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      dueTime: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor={`task-${task.id}-assignee`}
                className="text-sm font-medium"
              >
                Assigned advisor
              </label>
              <select
                id={`task-${task.id}-assignee`}
                className="w-full rounded-md border bg-background px-3 py-2"
                value={form.assignedTo}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    assignedTo: event.target.value,
                  }))
                }
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
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
