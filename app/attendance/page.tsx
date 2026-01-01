"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Check, X, Clock, Save, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getStudents, getClasses, saveAttendance, getAttendance } from "@/src/lib/actions"
import { useAuth } from "@/src/components/providers/auth-provider"
import { format } from "date-fns"
import type { AttendanceRecord } from "@/src/lib/types"

export default function AttendancePage() {
  const { user } = useAuth()
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"))
  const [localRecords, setLocalRecords] = useState<Record<string, "present" | "absent" | "late">>({})
  const queryClient = useQueryClient()

  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: getClasses,
  })

  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ["students", selectedClass],
    queryFn: () => getStudents(selectedClass),
    enabled: !!selectedClass,
  })

  const { data: existingAttendance = [], isLoading: attendanceLoading } = useQuery({
    queryKey: ["attendance", selectedClass, selectedDate],
    queryFn: () => getAttendance(selectedClass, selectedDate),
    enabled: !!selectedClass && !!selectedDate,
  })

  // Initialize local state when attendance or students change
  useState(() => {
    if (existingAttendance.length > 0) {
      const records: Record<string, "present" | "absent" | "late"> = {}
      existingAttendance.forEach((r) => {
        records[r.studentId] = r.status
      })
      setLocalRecords(records)
    }
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const recordsToSave: AttendanceRecord[] = students.map((student) => ({
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        classId: selectedClass,
        date: selectedDate,
        status: localRecords[student.id] || "present", // Default to present
        markedBy: user?.displayName || "Teacher",
        markedAt: new Date(),
      }))
      await saveAttendance(recordsToSave)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] })
    },
  })

  const updateStatus = (studentId: string, status: "present" | "absent" | "late") => {
    setLocalRecords((prev) => ({ ...prev, [studentId]: status }))
  }

  const markAll = (status: "present" | "absent" | "late") => {
    const records: Record<string, "present" | "absent" | "late"> = {}
    students.forEach((s) => (records[s.id] = status))
    setLocalRecords(records)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mark Attendance</h1>
          <p className="text-muted-foreground">Track daily student presence</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => markAll("present")}>
            Mark All Present
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!selectedClass || saveMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {saveMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Attendance
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Selection</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
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
              <Label>Date</Label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-around py-2">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {Object.values(localRecords).filter((v) => v === "present").length}
              </div>
              <div className="text-xs text-muted-foreground">Present</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {Object.values(localRecords).filter((v) => v === "absent").length}
              </div>
              <div className="text-xs text-muted-foreground">Absent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">
                {Object.values(localRecords).filter((v) => v === "late").length}
              </div>
              <div className="text-xs text-muted-foreground">Late</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {studentsLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="animate-spin" />
            </div>
          ) : students.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Select a class to load students</div>
          ) : (
            <div className="divide-y divide-border">
              {students.map((student) => {
                const status = localRecords[student.id] || "present"
                return (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold">
                        {student.firstName[0]}
                      </div>
                      <div>
                        <p className="font-medium">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{student.eczNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Button
                        variant={status === "present" ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateStatus(student.id, "present")}
                        className={status === "present" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                      >
                        <Check className="mr-1 h-3 w-3" /> <span className="hidden sm:inline">Present</span>
                      </Button>
                      <Button
                        variant={status === "late" ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateStatus(student.id, "late")}
                        className={status === "late" ? "bg-amber-600 hover:bg-amber-700" : ""}
                      >
                        <Clock className="mr-1 h-3 w-3" /> <span className="hidden sm:inline">Late</span>
                      </Button>
                      <Button
                        variant={status === "absent" ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => updateStatus(student.id, "absent")}
                      >
                        <X className="mr-1 h-3 w-3" /> <span className="hidden sm:inline">Absent</span>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
