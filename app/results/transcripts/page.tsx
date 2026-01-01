"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { FileText, Download, Users, Search, Loader2, CheckCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getClasses, getStudents, getResults, getAssessmentTypes } from "@/src/lib/actions"
import { generateTranscriptPDF, generateBulkTranscripts } from "@/src/lib/pdf-generator"
import type { Student } from "@/src/lib/types"

export default function TranscriptsPage() {
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedTerm, setSelectedTerm] = useState<string>("Term 1")
  const [academicYear] = useState<string>("2024")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedCount, setGeneratedCount] = useState(0)

  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: getClasses,
  })

  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ["students", selectedClass],
    queryFn: () => getStudents(selectedClass),
    enabled: !!selectedClass,
  })

  const { data: results = [] } = useQuery({
    queryKey: ["results", selectedClass, selectedTerm, academicYear],
    queryFn: () =>
      getResults({
        classId: selectedClass,
        term: selectedTerm,
        academicYear,
      }),
    enabled: !!selectedClass,
  })

  const { data: assessmentTypes = [] } = useQuery({
    queryKey: ["assessmentTypes"],
    queryFn: getAssessmentTypes,
  })

  const filteredStudents = students.filter(
    (student) =>
      searchQuery === "" ||
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.eczNumber.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const studentsWithResults = filteredStudents.filter((student) => results.some((r) => r.studentId === student.id))

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(new Set(studentsWithResults.map((s) => s.id)))
    } else {
      setSelectedStudents(new Set())
    }
  }

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    const newSet = new Set(selectedStudents)
    if (checked) {
      newSet.add(studentId)
    } else {
      newSet.delete(studentId)
    }
    setSelectedStudents(newSet)
  }

  const handleGenerateSingle = async (student: Student) => {
    setIsGenerating(true)
    try {
      const studentResults = results.filter((r) => r.studentId === student.id)
      generateTranscriptPDF({
        student,
        results: studentResults,
        assessmentTypes,
        term: selectedTerm,
        academicYear,
        schoolName: "Zambia School Pro Academy",
        schoolAddress: "Plot 123, Independence Avenue, Lusaka, Zambia",
        headteacherName: "Dr. Mary Phiri",
      })
      setGeneratedCount(1)
      setTimeout(() => setGeneratedCount(0), 3000)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateBulk = async () => {
    if (selectedStudents.size === 0) return

    setIsGenerating(true)
    try {
      const selectedStudentsList = students.filter((s) => selectedStudents.has(s.id))
      generateBulkTranscripts(selectedStudentsList, results, assessmentTypes, selectedTerm, academicYear)
      setGeneratedCount(selectedStudents.size)
      setSelectedStudents(new Set())
      setTimeout(() => setGeneratedCount(0), 3000)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Transcripts</h1>
        <p className="mt-1 text-muted-foreground">Generate and download student report cards</p>
      </div>

      {generatedCount > 0 && (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <AlertDescription>
            Successfully generated {generatedCount} transcript{generatedCount > 1 ? "s" : ""}!
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            Generate Transcripts
          </CardTitle>
          <CardDescription>Select class and term to generate student report cards</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
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
            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Select value={academicYear} disabled>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedClass && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Students</CardTitle>
                <CardDescription>
                  {studentsWithResults.length} student(s) with results available for {selectedTerm}
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  onClick={handleGenerateBulk}
                  disabled={selectedStudents.size === 0 || isGenerating}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Users className="mr-2 h-4 w-4" />
                      Generate Selected ({selectedStudents.size})
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {studentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : studentsWithResults.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-8 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 font-semibold">No Results Found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  No students have results entered for {selectedTerm}. Enter results first to generate transcripts.
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            selectedStudents.size === studentsWithResults.length && studentsWithResults.length > 0
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>ECZ Number</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Subjects</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentsWithResults.map((student) => {
                      const studentSubjects = new Set(
                        results.filter((r) => r.studentId === student.id).map((r) => r.subjectId),
                      )
                      return (
                        <TableRow key={student.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedStudents.has(student.id)}
                              onCheckedChange={(checked) => handleSelectStudent(student.id, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {student.firstName} {student.lastName}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{student.eczNumber}</TableCell>
                          <TableCell>{student.className}</TableCell>
                          <TableCell>
                            <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">
                              {studentSubjects.size} subject(s)
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGenerateSingle(student)}
                              disabled={isGenerating}
                            >
                              <Download className="mr-1 h-3 w-3" />
                              Download
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedClass && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">Select a Class</h3>
              <p className="mt-2 text-muted-foreground">
                Choose a class and term above to generate student transcripts.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Transcript Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border p-4">
              <div className="text-sm font-medium text-muted-foreground">Format</div>
              <div className="mt-1 font-semibold">PDF Document</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm font-medium text-muted-foreground">Grading System</div>
              <div className="mt-1 font-semibold">ECZ Standard</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm font-medium text-muted-foreground">Includes</div>
              <div className="mt-1 font-semibold">All Assessment Types</div>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Each transcript includes student information, all assessment scores (CA, Midterm, Exam), weighted final
            grades, and automatic comments based on the ECZ grading scale.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
