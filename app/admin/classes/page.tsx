"use client"

import type React from "react"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Pencil, Trash2, GraduationCap, Users } from "lucide-react"
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
import { getClasses, createClass, updateClass, deleteClass } from "@/src/lib/actions"
import type { SchoolClass } from "@/src/lib/types"

export default function AdminClassesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null)
  const queryClient = useQueryClient()

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["classes"],
    queryFn: getClasses,
  })

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingClass) {
        return updateClass(editingClass.id, data)
      }
      return createClass(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] })
      setIsDialogOpen(false)
      setEditingClass(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteClass,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["classes"] }),
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name") as string,
      grade: Number(formData.get("grade")),
      section: formData.get("section") as string,
      academicYear: formData.get("academicYear") as string,
    }
    mutation.mutate(data)
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Classes</h1>
          <p className="text-muted-foreground">Manage grade levels, sections, and class assignments.</p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) setEditingClass(null)
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Class
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingClass ? "Edit Class" : "Create New Class"}</DialogTitle>
                <DialogDescription>Enter the details for the school class below.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Class Name</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingClass?.name}
                    placeholder="e.g. Grade 10A"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="grade">Grade Level</Label>
                    <Input
                      id="grade"
                      name="grade"
                      type="number"
                      defaultValue={editingClass?.grade}
                      placeholder="10"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="section">Section</Label>
                    <Input id="section" name="section" defaultValue={editingClass?.section} placeholder="A" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="academicYear">Academic Year</Label>
                  <Input
                    id="academicYear"
                    name="academicYear"
                    defaultValue={editingClass?.academicYear}
                    placeholder="2024"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Saving..." : "Save Class"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />)
        ) : classes.length === 0 ? (
          <Card className="sm:col-span-2 lg:col-span-3 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <GraduationCap className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No classes found</p>
              <p className="text-sm text-muted-foreground">Add your first class to start managing students.</p>
            </CardContent>
          </Card>
        ) : (
          classes.map((cls) => (
            <Card key={cls.id} className="group relative overflow-hidden transition-all hover:border-emerald-500/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-mono">
                    Grade {cls.grade}
                  </Badge>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditingClass(cls)
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
                          <AlertDialogTitle>Delete Class</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {cls.name}? This will mark it as inactive.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(cls.id)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <CardTitle className="text-xl">{cls.name}</CardTitle>
                <CardDescription>
                  Section {cls.section} • {cls.academicYear}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
                  <Users className="h-4 w-4" />
                  <span>Class ID: {cls.id.slice(0, 8)}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
