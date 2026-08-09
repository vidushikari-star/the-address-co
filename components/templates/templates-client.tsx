"use client"

import { useState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"

import type { Database } from "@/types/database"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import { PageHeader } from "@/components/layout/page-header"
import { DeleteTemplateForm } from "@/components/templates/delete-template-form"
import { TemplateForm } from "@/components/templates/template-form"

type Template =
  Database["public"]["Tables"]["communications_templates"]["Row"]

interface TemplatesClientProps {
  templates: Template[]
}

export function TemplatesClient({
  templates,
}: TemplatesClientProps) {
  const [editorOpen, setEditorOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [selectedTemplate, setSelectedTemplate] =
    useState<Template | undefined>()

  function createNew() {
    setSelectedTemplate(undefined)
    setEditorOpen(true)
  }

  function editTemplate(template: Template) {
    setSelectedTemplate(template)
    setEditorOpen(true)
  }

  function confirmDelete(template: Template) {
    setSelectedTemplate(template)
    setDeleteOpen(true)
  }

  function closeEditor() {
    setSelectedTemplate(undefined)
    setEditorOpen(false)
  }

  function closeDelete() {
    setSelectedTemplate(undefined)
    setDeleteOpen(false)
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-4 md:p-8">
      <PageHeader
        title="Templates"
        description="Create and manage reusable WhatsApp and Email templates."
        actions={
          <Button onClick={createNew}>
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Button>
        }
      />

      {/* Editor Sheet */}

      <Sheet
        open={editorOpen}
        onOpenChange={(value) => {
          setEditorOpen(value)

          if (!value) {
            setSelectedTemplate(undefined)
          }
        }}
      >
        <SheetContent className="sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>
              {selectedTemplate
                ? "Edit Template"
                : "Create Template"}
            </SheetTitle>

            <SheetDescription>
              {selectedTemplate
                ? "Update your communication template."
                : "Create a reusable communication template."}
            </SheetDescription>
          </SheetHeader>

          <TemplateForm
            template={selectedTemplate}
            onSuccess={closeEditor}
            onCancel={closeEditor}
          />
        </SheetContent>
      </Sheet>

      {/* Delete Sheet */}

      <Sheet
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      >
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              Delete Template
            </SheetTitle>

            <SheetDescription>
              This action cannot be undone.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-8 space-y-6">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">
                You are deleting
              </p>

              <p className="mt-2 font-semibold">
                {selectedTemplate?.title}
              </p>
            </div>

            {selectedTemplate && (
              <DeleteTemplateForm
                id={selectedTemplate.id}
                onSuccess={closeDelete}
              />
            )}

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={closeDelete}
              >
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {templates.length === 0 ? (
        <div className="rounded-xl border p-12 text-center">
          <h3 className="text-lg font-semibold">
            No templates yet
          </h3>

          <p className="mt-2 text-muted-foreground">
            Create your first reusable communication template.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="min-w-[760px] w-full">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-6 py-3 text-left">
                  Title
                </th>

                <th className="px-6 py-3 text-left">
                  Channel
                </th>

                <th className="px-6 py-3 text-left">
                  Category
                </th>

                <th className="px-6 py-3 text-right">
                  Uses
                </th>

                <th className="px-6 py-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {templates.map((template) => (
                <tr
                  key={template.id}
                  className="border-b last:border-0"
                >
                  <td className="px-6 py-4 font-medium">
                    {template.title}
                  </td>

                  <td className="px-6 py-4 capitalize">
                    {template.channel}
                  </td>

                  <td className="px-6 py-4 capitalize">
                    {template.category}
                  </td>

                  <td className="px-6 py-4 text-right">
                    {template.usage_count}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          editTemplate(template)
                        }
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          confirmDelete(template)
                        }
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
