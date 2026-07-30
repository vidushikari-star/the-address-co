"use client"

import { useActionState } from "react"

import { deleteTemplate } from "@/app/(app)/templates/actions"

import { Button } from "@/components/ui/button"

interface DeleteTemplateFormProps {
  id: string
  onSuccess?: () => void
}

const initialState = {
  error: "",
}

export function DeleteTemplateForm({
  id,
  onSuccess,
}: DeleteTemplateFormProps) {
  const [state, formAction, pending] = useActionState(
    async (_: typeof initialState, formData: FormData) => {
      try {
        await deleteTemplate(formData)

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
      className="space-y-4"
    >
      <input
        type="hidden"
        name="id"
        value={id}
      />

      {state.error && (
        <p className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          variant="destructive"
          disabled={pending}
        >
          {pending ? "Deleting..." : "Delete Template"}
        </Button>
      </div>
    </form>
  )
}