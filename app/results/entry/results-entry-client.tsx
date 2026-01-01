"use client"

import type React from "react"

import { useState, useCallback, useMemo, useTransition } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { Save, Search, ArrowUpDown, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getAssessmentTypes, getClasses, getSubjects, getStudents, saveResults, getResults } from "@/src/lib/actions"
import { calculateGrade, calculatePercentage } from "@/src/lib/types"

interface StudentMark {
  studentId: string
  studentName: string
  eczNumber: string
  marks: number | null
  percentage: number | null
  grade: string | null
  comment: string | null
  isDirty: boolean
}

function GradeBadge({ grade }: { grade: string | null }) {
  if (!grade) return <span className="text-muted-foreground">-</span>

  const colors: Record<string, string> = {
    Distinction: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Merit: "bg-blue-100 text-blue-800 border-blue-200",
    Credit: "bg-amber-100 text-amber-800 border-amber-200",
    Pass: "bg-orange-100 text-orange-800 border-orange-200",
    Fail: "bg-red-100 text-red-800 border-red-200",
  }

  return (
    <Badge variant="outline" className={`${colors[grade] || ""} font-medium`}>
      {grade}
    </Badge>
  )
}

function MarksInput({
  value,
  maxMarks,
  onChange,
}: {
  value: number | null
  maxMarks: number
  onChange: (value: number | null) => void
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val === "") {
      onChange(null)
      return
    }
    const num = Number.parseInt(val, 10)
    if (!isNaN(num) && num >= 0 && num <= maxMarks) {
      onChange(num)
    }
  }

  return (
    <Input
      type="number"
      min="0"
      max={maxMarks}
      value={value ?? ""}
      onChange={handleChange}
      className="w-16 sm:w-20 text-center"
      placeholder="--"
    />
  )
}

export default function ResultsEntryClient() {
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  const [selectedAssessment, setSelectedAssessment] = useState<string>("")
  const [selectedTerm, setSelectedTerm] = useState<string>("Term 1")
  const [academicYear] = useState<string>("2024")
  const [studentMarks, setStudentMarks] = useState<StudentMark[]>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [isPending, startTransition] = useTransition()
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const queryClient = useQueryClient()

  // Fetch data
  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: getClasses,
  })

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: getSubjects,
  })

  const { data: assessmentTypes = [] } = useQuery({
    queryKey: ["assessmentTypes"],
    queryFn: getAssessmentTypes,
  })

  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ["students", selectedClass],
    queryFn: () => getStudents(selectedClass),
    enabled: !!selectedClass,
  })

  const { data: existingResults = [] } = useQuery({
    queryKey: ["results", selectedClass, selectedSubject, selectedAssessment, selectedTerm],
    queryFn: () =>
      getResults({
        classId: selectedClass,
        subjectId: selectedSubject,
        assessmentTypeId: selectedAssessment,
        term: selectedTerm,
        academicYear,
      }),
    enabled: !!selectedClass && !!selectedSubject && !!selectedAssessment,
  })

  // Get selected entities
  const selectedClassObj = classes.find((c) => c.id === selectedClass)
  const selectedSubjectObj = subjects.find((s) => s.id === selectedSubject)
  const selectedAssessmentObj = assessmentTypes.find((a) => a.id === selectedAssessment)

  // Initialize student marks when selection changes
  const initializeMarks = useCallback(() => {
    if (!students.length) return

    const marks: StudentMark[] = students.map((student) => {
      const existingResult = existingResults.find((r) => r.studentId === student.id)
      return {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        eczNumber: student.eczNumber,
        marks: existingResult?.marks ?? null,
        percentage: existingResult?.percentage ?? null,
        grade: existingResult?.grade ?? null,
        comment: existingResult?.comment ?? null,
        isDirty: false,
      }
    })

    setStudentMarks(marks)
  }, [students, existingResults])

  // Update marks when selection changes
  useMemo(() => {
    if (selectedClass && selectedSubject && selectedAssessment && students.length) {
      initializeMarks()
    }
  }, [selectedClass, selectedSubject, selectedAssessment, students, initializeMarks])

  // Handle mark change
  const handleMarkChange = useCallback(
    (studentId: string, marks: number | null) => {
      setStudentMarks((prev) =>
        prev.map((student) => {
          if (student.studentId !== studentId) return student

          if (marks === null) {
            return {
              ...student,
              marks: null,
              percentage: null,
              grade: null,
              comment: null,
              isDirty: true,
            }
          }

          const maxMarks = selectedAssessmentObj?.maxMarks || 100
          const percentage = calculatePercentage(marks, maxMarks)
          const { grade, comment } = calculateGrade(percentage)

          return {
            ...student,
            marks,
            percentage,
            grade,
            comment,
            isDirty: true,
          }
        }),
      )
      setSaveStatus("idle")
    },
    [selectedAssessmentObj],
  )

  // Save results mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const dirtyMarks = studentMarks.filter((m) => m.isDirty && m.marks !== null)

      if (!dirtyMarks.length || !selectedSubjectObj || !selectedAssessmentObj) {
        throw new Error("No marks to save")
      }

      const resultsToSave = dirtyMarks.map((m) => ({
        studentId: m.studentId,
        studentName: m.studentName,
        eczNumber: m.eczNumber,
        classId: selectedClass,
        subjectId: selectedSubject,
        subjectName: selectedSubjectObj.name,
        assessmentTypeId: selectedAssessment,
        assessmentTypeName: selectedAssessmentObj.name,
        academicYear,
        term: selectedTerm,
        marks: m.marks!,
        maxMarks: selectedAssessmentObj.maxMarks,
      }))

      await saveResults(resultsToSave, "Admin User")
    },
    onSuccess: () => {
      setSaveStatus("saved")
      setStudentMarks((prev) => prev.map((m) => ({ ...m, isDirty: false })))
      queryClient.invalidateQueries({ queryKey: ["results"] })
      setTimeout(() => setSaveStatus("idle"), 3000)
    },
    onError: () => {
      setSaveStatus("error")
    },
  })

  // Table columns - responsive
  const columns = useMemo<ColumnDef<StudentMark>[]>(
    () => [
      {
        accessorKey: "studentName",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-4"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Student
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-sm">{row.original.studentName}</div>
            <div className="text-xs text-muted-foreground hidden sm:block">{row.original.eczNumber}</div>
          </div>
        ),
      },
      {
        accessorKey: "marks",
        header: () => (
          <div className="text-center">
            Marks
            {selectedAssessmentObj && (
              <span className="ml-1 text-xs text-muted-foreground hidden sm:inline">
                / {selectedAssessmentObj.maxMarks}
              </span>
            )}
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex justify-center">
            <MarksInput
              value={row.original.marks}
              maxMarks={selectedAssessmentObj?.maxMarks || 100}
              onChange={(value) => handleMarkChange(row.original.studentId, value)}
            />
          </div>
        ),
      },
      {
        accessorKey: "percentage",
        header: () => <div className="text-center hidden sm:block">%</div>,
        cell: ({ row }) => (
          <div className="text-center font-medium hidden sm:block">
            {row.original.percentage !== null ? `${row.original.percentage}%` : "-"}
          </div>
        ),
      },
      {
        accessorKey: "grade",
        header: () => <div className="text-center">Grade</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <GradeBadge grade={row.original.grade} />
          </div>
        ),
      },
      {
        accessorKey: "comment",
        header: () => <span className="hidden lg:inline">Auto Comment</span>,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground hidden lg:block">{row.original.comment || "-"}</span>
        ),
      },
    ],
    [selectedAssessmentObj, handleMarkChange],
  )

  const table = useReactTable({
    data: studentMarks,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      globalFilter,
    },
  })

  const dirtyCount = studentMarks.filter((m) => m.isDirty).length
  const filledCount = studentMarks.filter((m) => m.marks !== null).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Results Entry</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">Enter and manage student assessment marks</p>
      </div>

      {/* Selection Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Select Parameters</CardTitle>
          <CardDescription>Choose the class, subject, and assessment type to enter marks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
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

            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assessment</Label>
              <Select
                value={selectedAssessment}
                onValueChange={setSelectedAssessment}
                disabled={!selectedClass || !selectedSubject}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assessment" />
                </SelectTrigger>
                <SelectContent>
                  {assessmentTypes
                    .filter((a) => a.isActive)
                    .map((assessment) => (
                      <SelectItem key={assessment.id} value={assessment.id}>
                        <div className="flex items-center gap-2">
                          {assessment.name}
                          <span className="text-xs text-muted-foreground">({assessment.weightage}%)</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Term</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Term 1">Term 1</SelectItem>
                  <SelectItem value="Term 2">Term 2</SelectItem>
                  <SelectItem value="Term 3">Term 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Entry Grid */}
      {selectedClass && selectedSubject && selectedAssessment && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div>
                <CardTitle className="flex flex-wrap items-center gap-2">Marks Entry Grid</CardTitle>
                {selectedClassObj && selectedSubjectObj && selectedAssessmentObj && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedClassObj.name} | {selectedSubjectObj.name} | {selectedAssessmentObj.name}
                  </p>
                )}
                <CardDescription className="mt-1">
                  {filledCount} of {studentMarks.length} students have marks entered
                </CardDescription>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  onClick={() => saveMutation.mutate()}
                  disabled={dirtyCount === 0 || saveMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
                >
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save {dirtyCount > 0 && `(${dirtyCount})`}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {saveStatus === "saved" && (
              <Alert className="mb-4 border-emerald-200 bg-emerald-50 text-emerald-800">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <AlertDescription>Results saved successfully!</AlertDescription>
              </Alert>
            )}

            {saveStatus === "error" && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Failed to save results. Please try again.</AlertDescription>
              </Alert>
            )}

            {studentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : studentMarks.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-8 text-center">
                <p className="text-muted-foreground">No students found in this class.</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          className={row.original.isDirty ? "bg-amber-50/50" : ""}
                          data-state={row.getIsSelected() && "selected"}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-24 text-center">
                          No students match your search.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {(!selectedClass || !selectedSubject || !selectedAssessment) && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">Select Parameters</h3>
              <p className="mt-2 text-muted-foreground">
                Choose a class, subject, and assessment type above to start entering marks.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
