"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, BookOpen, Calendar, Loader2, FileText } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getClasses, getSubjects, saveLessonPlan, getLessonPlans } from "@/src/lib/actions"
import { useAuth } from "@/src/components/providers/auth-provider"
import { format } from "date-fns"

export default function LessonsPage() {
  const { user } = useAuth()
  const [isAdding, setIsAdding] = useState(false)
  const [newPlan, setNewPlan] = useState({
    title: "",
    objective: "",
    content: "",
    classId: "",
    subjectId: "",
    date: format(new Date(), "yyyy-MM-dd"),
  })
  const queryClient = useQueryClient()

  const { data: classes = [] } = useQuery({ queryKey: ["classes"], queryFn: getClasses })
  const { data: subjects = [] } = useQuery({ queryKey: ["subjects"], queryFn: getSubjects })
  const { data: lessonPlans = [], isLoading } = useQuery({
    queryKey: ["lessonPlans", user?.uid],
    queryFn: () => getLessonPlans(user?.uid || ""),
    enabled: !!user,
  })

  const saveMutation = useMutation({
    mutationFn: () =>
      saveLessonPlan({
        ...newPlan,
        teacherId: user?.uid || "",
        teacherName: user?.displayName || "Teacher",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessonPlans"] })
      setIsAdding(false)
      setNewPlan({
        title: "",
        objective: "",
        content: "",
        classId: "",
        subjectId: "",
        date: format(new Date(), "yyyy-MM-dd"),
      })
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lesson Planning</h1>
          <p className="text-muted-foreground">Prepare and manage your academic lessons</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="mr-2 h-4 w-4" />
          {isAdding ? "Cancel" : "New Lesson Plan"}
        </Button>
      </div>

      {isAdding && (
        <Card className="border-emerald-200 bg-emerald-50/20">
          <CardHeader>
            <CardTitle>Create New Lesson Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Lesson Title</Label>
                <Input
                  value={newPlan.title}
                  onChange={(e) => setNewPlan({ ...newPlan, title: e.target.value })}
                  placeholder="e.g., Introduction to Algebra"
                />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={newPlan.date}
                  onChange={(e) => setNewPlan({ ...newPlan, date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={newPlan.classId} onValueChange={(v) => setNewPlan({ ...newPlan, classId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select value={newPlan.subjectId} onValueChange={(v) => setNewPlan({ ...newPlan, subjectId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Objective</Label>
              <Input
                value={newPlan.objective}
                onChange={(e) => setNewPlan({ ...newPlan, objective: e.target.value })}
                placeholder="What should students learn?"
              />
            </div>
            <div className="space-y-2">
              <Label>Content / Methodology</Label>
              <Textarea
                value={newPlan.content}
                onChange={(e) => setNewPlan({ ...newPlan, content: e.target.value })}
                rows={4}
                placeholder="Details of the lesson..."
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={!newPlan.title || saveMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Lesson Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full flex h-40 items-center justify-center">
            <Loader2 className="animate-spin text-emerald-600" />
          </div>
        ) : lessonPlans.length === 0 ? (
          <div className="col-span-full rounded-lg border border-dashed p-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
            <h3 className="mt-4 text-lg font-semibold">No lesson plans yet</h3>
            <p className="text-muted-foreground">Start planning your lessons to see them here.</p>
          </div>
        ) : (
          lessonPlans.map((plan) => (
            <Card key={plan.id} className="group transition-all hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">{plan.date}</div>
                </div>
                <CardTitle className="mt-2 text-lg line-clamp-1">{plan.title}</CardTitle>
                <CardDescription className="line-clamp-2">{plan.objective}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" /> {subjects.find((s) => s.id === plan.subjectId)?.name || "Subject"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {classes.find((c) => c.id === plan.classId)?.name || "Class"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
