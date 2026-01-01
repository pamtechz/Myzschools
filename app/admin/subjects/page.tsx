"use client"

import type React from "react"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Pencil, Trash2, BookOpen, Layers } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { getSubjects, createSubject, updateSubject, deleteSubject } from "@/src/lib/actions"
import type { Subject } from "@/src/lib/types"

export default function AdminSubjectsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const queryClient = useQueryClient()

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: getSubjects,
  })

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingSubject) {
        return updateSubject(editingSubject.id, data)
      }
      return createSubject(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] })
      setIsDialogOpen(false)
      setEditingSubject(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSubject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subjects"] }),
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name") as string,
      code: formData.get("code") as string,
      department: formData.get("department") as string,
    }
    mutation.mutate(data)
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subjects</h1>
          <p className="text-muted-foreground">Manage the curriculum and available academic subjects.</p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) setEditingSubject(null)
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingSubject ? "Edit Subject" : "Create New Subject"}</DialogTitle>
                <DialogDescription>Define a new subject for the school's curriculum.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Subject Name</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingSubject?.name}
                    placeholder="e.g. Mathematics"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Subject Code</Label>
                  <Input
                    id="code"
                    name="code"
                    defaultValue={editingSubject?.code}
                    placeholder="e.g. MATH101"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    name="department"
                    defaultValue={editingSubject?.department}
                    placeholder="e.g. Sciences"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Saving..." : "Save Subject"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />)
        ) : subjects.length === 0 ? (
          <Card className="sm:col-span-2 lg:col-span-3 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No subjects found</p>
              <p className="text-sm text-muted-foreground">Define your curriculum by adding subjects.</p>
            </CardContent>
          </Card>
        ) : (
          subjects.map((sub) => (
            <Card key={sub.id} className="group relative overflow-hidden transition-all hover:border-emerald-500/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="font-mono text-[10px] uppercase">
                    {sub.code}
                  </Badge>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditingSubject(sub)
                        setIsDialogOpen(true)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Subject</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {sub.name}? This will mark it as inactive.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(sub.id)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <CardTitle className="text-xl">{sub.name}</CardTitle>
                <CardDescription>{sub.department || "No Department"}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
                  <Layers className="h-4 w-4" />
                  <span>Ref: {sub.id.slice(0, 8)}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
