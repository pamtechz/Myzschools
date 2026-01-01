"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowRight, Users, AlertTriangle, CheckCircle, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getClasses, getStudents, bulkPromoteStudents } from "@/src/lib/actions"

export default function BulkPromotionPage() {
  const [fromClass, setFromClass] = useState<string>("")
  const [toClass, setToClass] = useState<string>("")
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [result, setResult] = useState<{ success: boolean; count: number } | null>(null)
  const queryClient = useQueryClient()

  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: getClasses,
  })

  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ["students", fromClass],
    queryFn: () => getStudents(fromClass),
    enabled: !!fromClass,
  })

  const fromClassObj = classes.find((c) => c.id === fromClass)
  const toClassObj = classes.find((c) => c.id === toClass)

  const promotionMutation = useMutation({
    mutationFn: async () => {
      if (!toClassObj) throw new Error("Target class not found")
      return bulkPromoteStudents(fromClass, toClass, toClassObj.name)
    },
    onSuccess: (count) => {
      setResult({ success: true, count })
      queryClient.invalidateQueries({ queryKey: ["students"] })
      setFromClass("")
      setToClass("")
    },
    onError: () => {
      setResult({ success: false, count: 0 })
    },
  })

  const handlePromote = () => {
    setIsConfirmOpen(false)
    promotionMutation.mutate()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Bulk Promotion</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          Promote all students from one class to another
        </p>
      </div>

      {result && (
        <Alert
          className={
            result.success
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-destructive bg-destructive/10"
          }
        >
          {result.success ? (
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-destructive" />
          )}
          <AlertDescription>
            {result.success
              ? `Successfully promoted ${result.count} students to the new class.`
              : "Failed to promote students. Please try again."}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Promotion Settings</CardTitle>
            <CardDescription>Select the source and destination classes for bulk promotion</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>From Class (Source)</Label>
              <Select value={fromClass} onValueChange={setFromClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <ArrowRight className="h-6 w-6 text-emerald-600" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>To Class (Destination)</Label>
              <Select value={toClass} onValueChange={setToClass} disabled={!fromClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination class" />
                </SelectTrigger>
                <SelectContent>
                  {classes
                    .filter((c) => c.id !== fromClass)
                    .map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={!fromClass || !toClass || promotionMutation.isPending}
              onClick={() => setIsConfirmOpen(true)}
            >
              {promotionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Promoting...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  Promote Students
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              {fromClass
                ? `${students.length} student(s) will be affected by this promotion`
                : "Select a source class to preview students"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!fromClass ? (
              <div className="rounded-lg border border-dashed border-border p-8 text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">Select a source class to see students</p>
              </div>
            ) : studentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : students.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-8 text-center">
                <p className="text-muted-foreground">No students in this class.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg bg-muted p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Students to promote:</span>
                    <span className="text-2xl font-bold">{students.length}</span>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto rounded-lg border">
                  <div className="divide-y">
                    {students.slice(0, 10).map((student) => (
                      <div key={student.id} className="flex items-center justify-between px-4 py-2">
                        <div>
                          <div className="font-medium text-sm">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground">{student.eczNumber}</div>
                        </div>
                        <div className="text-xs text-muted-foreground hidden sm:block">{student.className}</div>
                      </div>
                    ))}
                    {students.length > 10 && (
                      <div className="px-4 py-2 text-center text-sm text-muted-foreground">
                        +{students.length - 10} more students
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Promotion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to promote {students.length} student(s) from <strong>{fromClassObj?.name}</strong>{" "}
              to <strong>{toClassObj?.name}</strong>?
              <br />
              <br />
              This action will update all student records and cannot be easily undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePromote} className="bg-emerald-600 hover:bg-emerald-700">
              Confirm Promotion
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
