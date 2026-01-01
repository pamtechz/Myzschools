"use client"

import type React from "react"

import { useState, useOptimistic, useTransition } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Pencil, Trash2, GripVertical, Percent, Hash, AlertCircle, Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getAssessmentTypes, createAssessmentType, updateAssessmentType, deleteAssessmentType } from "@/src/lib/actions"
import type { AssessmentType } from "@/src/lib/types"
import { assessmentTypeSchema } from "@/src/lib/validation"
import type { z } from "zod"

function AssessmentForm({
  assessment,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  assessment?: AssessmentType
  onSubmit: (data: z.infer<typeof assessmentTypeSchema>) => void
  onCancel: () => void
  isSubmitting: boolean
}) {
  const [formData, setFormData] = useState({
    name: assessment?.name || "",
    code: assessment?.code || "",
    weightage: assessment?.weightage || 0,
    maxMarks: assessment?.maxMarks || 100,
    isActive: assessment?.isActive ?? true,
    order: assessment?.order || 1,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const result = assessmentTypeSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message
        }
      })
      setErrors(fieldErrors)
      return
    }

    onSubmit(result.data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Assessment Name</Label>
          <Input
            id="name"
            placeholder="e.g., CA 1, Midterm Exam"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">Short Code</Label>
          <Input
            id="code"
            placeholder="e.g., CA1, MID"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            className={errors.code ? "border-destructive" : ""}
          />
          {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="weightage">Weightage (%)</Label>
          <div className="relative">
            <Input
              id="weightage"
              type="number"
              min="0"
              max="100"
              placeholder="30"
              value={formData.weightage}
              onChange={(e) => setFormData({ ...formData, weightage: Number(e.target.value) })}
              className={errors.weightage ? "border-destructive pr-8" : "pr-8"}
            />
            <Percent className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
          {errors.weightage && <p className="text-xs text-destructive">{errors.weightage}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxMarks">Maximum Marks</Label>
          <div className="relative">
            <Input
              id="maxMarks"
              type="number"
              min="1"
              placeholder="100"
              value={formData.maxMarks}
              onChange={(e) => setFormData({ ...formData, maxMarks: Number(e.target.value) })}
              className={errors.maxMarks ? "border-destructive pr-8" : "pr-8"}
            />
            <Hash className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
          {errors.maxMarks && <p className="text-xs text-destructive">{errors.maxMarks}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="order">Display Order</Label>
          <Input
            id="order"
            type="number"
            min="1"
            placeholder="1"
            value={formData.order}
            onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
            className={errors.order ? "border-destructive" : ""}
          />
          {errors.order && <p className="text-xs text-destructive">{errors.order}</p>}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="isActive">Active Status</Label>
          <p className="text-sm text-muted-foreground">Make this assessment type available for use</p>
        </div>
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
      </div>

      <DialogFooter className="flex-col gap-2 sm:flex-row">
        <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto bg-transparent">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 sm:w-auto">
          {isSubmitting ? "Saving..." : assessment ? "Update Assessment" : "Create Assessment"}
        </Button>
      </DialogFooter>
    </form>
  )
}

function AssessmentCard({
  assessment,
  onEdit,
  onDelete,
}: {
  assessment: AssessmentType
  onEdit: (assessment: AssessmentType) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50 sm:flex-row sm:items-center">
      <div className="hidden cursor-move text-muted-foreground sm:block">
        <GripVertical className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-card-foreground">{assessment.name}</h3>
          <Badge variant="outline" className="shrink-0">
            {assessment.code}
          </Badge>
          {!assessment.isActive && (
            <Badge variant="secondary" className="shrink-0 text-muted-foreground">
              Inactive
            </Badge>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Percent className="h-3.5 w-3.5" />
            {assessment.weightage}% weightage
          </span>
          <span className="flex items-center gap-1">
            <Hash className="h-3.5 w-3.5" />
            {assessment.maxMarks} max marks
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => onEdit(assessment)} className="h-8 w-8">
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Edit</span>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Assessment Type</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{assessment.name}"? This action cannot be undone and may affect
                existing results.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(assessment.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

export default function AssessmentManagerPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAssessment, setEditingAssessment] = useState<AssessmentType | null>(null)
  const [isPending, startTransition] = useTransition()
  const queryClient = useQueryClient()

  const {
    data: assessments = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["assessmentTypes"],
    queryFn: getAssessmentTypes,
  })

  const [optimisticAssessments, addOptimistic] = useOptimistic(
    assessments,
    (state: AssessmentType[], newAssessment: { action: string; assessment?: AssessmentType; id?: string }) => {
      if (newAssessment.action === "add" && newAssessment.assessment) {
        return [...state, newAssessment.assessment]
      }
      if (newAssessment.action === "update" && newAssessment.assessment) {
        return state.map((a) => (a.id === newAssessment.assessment!.id ? newAssessment.assessment! : a))
      }
      if (newAssessment.action === "delete" && newAssessment.id) {
        return state.filter((a) => a.id !== newAssessment.id)
      }
      return state
    },
  )

  const createMutation = useMutation({
    mutationFn: createAssessmentType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessmentTypes"] })
      setIsDialogOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AssessmentType> }) => updateAssessmentType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessmentTypes"] })
      setIsDialogOpen(false)
      setEditingAssessment(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAssessmentType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessmentTypes"] })
    },
  })

  const handleCreate = (data: z.infer<typeof assessmentTypeSchema>) => {
    startTransition(() => {
      addOptimistic({
        action: "add",
        assessment: { ...data, id: "temp-" + Date.now() } as AssessmentType,
      })
    })
    createMutation.mutate(data)
  }

  const handleUpdate = (data: z.infer<typeof assessmentTypeSchema>) => {
    if (!editingAssessment) return
    startTransition(() => {
      addOptimistic({
        action: "update",
        assessment: { ...editingAssessment, ...data },
      })
    })
    updateMutation.mutate({ id: editingAssessment.id, data })
  }

  const handleDelete = (id: string) => {
    startTransition(() => {
      addOptimistic({ action: "delete", id })
    })
    deleteMutation.mutate(id)
  }

  const handleEdit = (assessment: AssessmentType) => {
    setEditingAssessment(assessment)
    setIsDialogOpen(true)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingAssessment(null)
  }

  const totalWeightage = optimisticAssessments.filter((a) => a.isActive).reduce((sum, a) => sum + a.weightage, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Assessment Types</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Configure custom assessment types with weightages for your grading system
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Assessment Type
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingAssessment ? "Edit Assessment Type" : "Create Assessment Type"}</DialogTitle>
              <DialogDescription>
                {editingAssessment
                  ? "Update the assessment type details below."
                  : "Add a new assessment type with weightage for calculating final grades."}
              </DialogDescription>
            </DialogHeader>
            <AssessmentForm
              assessment={editingAssessment || undefined}
              onSubmit={editingAssessment ? handleUpdate : handleCreate}
              onCancel={handleDialogClose}
              isSubmitting={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {totalWeightage !== 100 && optimisticAssessments.some((a) => a.isActive) && (
        <Alert variant={totalWeightage > 100 ? "destructive" : "default"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Total weightage of active assessments is{" "}
            <strong className={totalWeightage === 100 ? "text-emerald-600" : ""}>{totalWeightage}%</strong>.
            {totalWeightage !== 100 && " It should equal 100% for proper grade calculation."}
          </AlertDescription>
        </Alert>
      )}

      {totalWeightage === 100 && optimisticAssessments.some((a) => a.isActive) && (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
          <Check className="h-4 w-4 text-emerald-600" />
          <AlertDescription>
            Total weightage equals <strong>100%</strong>. Your grading system is properly configured.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Configured Assessment Types</CardTitle>
          <CardDescription>Drag to reorder. Teachers will see these options when entering results.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-destructive">
              Failed to load assessment types. Please try again.
            </div>
          ) : optimisticAssessments.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold">No assessment types configured</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first assessment type to start entering results.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {optimisticAssessments.map((assessment) => (
                <AssessmentCard
                  key={assessment.id}
                  assessment={assessment}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ECZ Grading Scale (Reference)</CardTitle>
          <CardDescription>The system automatically applies this grading scale to all assessments.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { grade: "Distinction", range: "80-100%", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
              { grade: "Merit", range: "70-79%", color: "bg-blue-100 text-blue-800 border-blue-200" },
              { grade: "Credit", range: "60-69%", color: "bg-amber-100 text-amber-800 border-amber-200" },
              { grade: "Pass", range: "50-59%", color: "bg-orange-100 text-orange-800 border-orange-200" },
              { grade: "Fail", range: "0-49%", color: "bg-red-100 text-red-800 border-red-200" },
            ].map((item) => (
              <div key={item.grade} className={`rounded-lg border p-3 text-center ${item.color}`}>
                <div className="font-semibold text-sm sm:text-base">{item.grade}</div>
                <div className="text-xs sm:text-sm opacity-75">{item.range}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
