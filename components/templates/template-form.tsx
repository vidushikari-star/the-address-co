"use client"

import { useActionState } from "react"

import {
  createTemplate,
  updateTemplate,
} from "@/app/(app)/templates/actions"

import type { Database } from "@/types/database"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Template =
  Database["public"]["Tables"]["communications_templates"]["Row"]

interface TemplateFormProps {
  template?: Template
  onSuccess?: () => void
}

const initialState = {
  error: "",
}

export function TemplateForm({
  template,
  onSuccess,
}: TemplateFormProps) {
  const isEditing = !!template

  const [state, formAction, pending] = useActionState(
    async (_: typeof initialState, formData: FormData) => {
      try {
        if (isEditing) {
          await updateTemplate(formData)
        } else {
          await createTemplate(formData)
        }

        onSuccess?.()

        return {
          error: "",
        }
      } catch (error) {
        return {
          error:
            error instanceof Error
              ? error.message
              : "Something went wrong.",
        }
      }
    },
    initialState
  )

  return (
    <form
      action={formAction}
      className="flex h-full flex-col"
    >
      {isEditing && (
        <input
          type="hidden"
          name="id"
          value={template.id}
        />
      )}

      <div className="space-y-6 p-4">

        <div className="space-y-2">
          <label
            htmlFor="title"
            className="text-sm font-medium"
          >
            Template Title
          </label>

          <Input
            id="title"
            name="title"
            defaultValue={template?.title}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Channel
          </label>

          <Select
            name="channel"
            defaultValue={
              template?.channel ?? "whatsapp"
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="whatsapp">
                WhatsApp
              </SelectItem>

              <SelectItem value="email">
                Email
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Category
          </label>

          <Select
            name="category"
            defaultValue={
              template?.category ?? "buyer"
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="buyer">
                Buyer
              </SelectItem>

              <SelectItem value="seller">
                Seller
              </SelectItem>

              <SelectItem value="developer">
                Developer
              </SelectItem>

              <SelectItem value="broker">
                Broker
              </SelectItem>

              <SelectItem value="internal">
                Internal
              </SelectItem>

              <SelectItem value="marketing">
                Marketing
              </SelectItem>

              <SelectItem value="legal">
                Legal
              </SelectItem>

              <SelectItem value="finance">
                Finance
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="subject"
            className="text-sm font-medium"
          >
            Subject
          </label>

          <Input
            id="subject"
            name="subject"
            defaultValue={template?.subject ?? ""}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="body"
            className="text-sm font-medium"
          >
            Message
          </label>

          <Textarea
            id="body"
            name="body"
            rows={10}
            defaultValue={template?.body}
            required
          />
        </div>

        {state.error && (
          <p className="text-sm text-destructive">
            {state.error}
          </p>
        )}
      </div>

      <div className="mt-auto flex flex-col-reverse gap-3 border-t p-4 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
        >
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={pending}
        >
          {pending
            ? "Saving..."
            : isEditing
              ? "Update Template"
              : "Save Template"}
        </Button>
      </div>
    </form>
  )
}