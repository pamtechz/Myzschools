"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { Upload, FileSpreadsheet, ArrowRight, CheckCircle, AlertCircle, X, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { bulkCreateStudents, getClasses } from "@/src/lib/actions"
import type { Student } from "@/src/lib/types"

interface CSVRow {
  [key: string]: string
}

interface ColumnMapping {
  csvColumn: string
  dbField: string
}

const DB_FIELDS = [
  { value: "firstName", label: "First Name", required: true },
  { value: "lastName", label: "Last Name", required: true },
  { value: "middleName", label: "Middle Name", required: false },
  { value: "eczNumber", label: "ECZ Number", required: true },
  { value: "gender", label: "Gender", required: true },
  { value: "dateOfBirth", label: "Date of Birth", required: false },
  { value: "guardianName", label: "Guardian Name", required: true },
  { value: "guardianPhone", label: "Guardian Phone", required: true },
  { value: "address", label: "Address", required: false },
  { value: "skip", label: "-- Skip --", required: false },
]

function parseCSV(text: string): { headers: string[]; rows: CSVRow[] } {
  const lines = text.trim().split("\n")
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""))

  const rows = lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""))
    const row: CSVRow = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ""
    })
    return row
  })

  return { headers, rows }
}

export default function CSVImportPage() {
  const [step, setStep] = useState<"upload" | "mapping" | "preview" | "complete">("upload")
  const [csvData, setCSVData] = useState<{ headers: string[]; rows: CSVRow[] } | null>(null)
  const [mappings, setMappings] = useState<ColumnMapping[]>([])
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null)
  const queryClient = useQueryClient()

  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: getClasses,
  })

  const selectedClassObj = classes.find((c) => c.id === selectedClass)

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError("")

    if (!file.name.endsWith(".csv")) {
      setError("Please upload a CSV file.")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const parsed = parseCSV(text)

        if (parsed.headers.length === 0 || parsed.rows.length === 0) {
          setError("CSV file appears to be empty or invalid.")
          return
        }

        setCSVData(parsed)
        setMappings(parsed.headers.map((header) => ({ csvColumn: header, dbField: "" })))
        setStep("mapping")
      } catch {
        setError("Failed to parse CSV file. Please check the format.")
      }
    }
    reader.readAsText(file)
  }, [])

  const handleMappingChange = (csvColumn: string, dbField: string) => {
    setMappings((prev) => prev.map((m) => (m.csvColumn === csvColumn ? { ...m, dbField } : m)))
  }

  const validateMappings = (): boolean => {
    const requiredFields = ["firstName", "lastName", "eczNumber", "gender", "guardianName", "guardianPhone"]
    const mappedFields = mappings.filter((m) => m.dbField && m.dbField !== "skip").map((m) => m.dbField)

    const missing = requiredFields.filter((f) => !mappedFields.includes(f))
    if (missing.length > 0) {
      setError(`Missing required mappings: ${missing.join(", ")}`)
      return false
    }

    if (!selectedClass) {
      setError("Please select a class for the imported students.")
      return false
    }

    return true
  }

  const getMappedStudents = (): Omit<Student, "id" | "createdAt" | "updatedAt">[] => {
    if (!csvData || !selectedClassObj) return []

    return csvData.rows.map((row) => {
      const student: Record<string, unknown> = {
        classId: selectedClass,
        className: selectedClassObj.name,
        enrollmentDate: new Date().toISOString().split("T")[0],
        isActive: true,
      }

      mappings.forEach((mapping) => {
        if (mapping.dbField && mapping.dbField !== "skip") {
          let value = row[mapping.csvColumn] || ""

          if (mapping.dbField === "gender") {
            value = value.toLowerCase().startsWith("m") ? "Male" : "Female"
          }

          student[mapping.dbField] = value
        }
      })

      return student as Omit<Student, "id" | "createdAt" | "updatedAt">
    })
  }

  const importMutation = useMutation({
    mutationFn: async () => {
      const students = getMappedStudents()
      await bulkCreateStudents(students)
      return students.length
    },
    onSuccess: (count) => {
      setImportResult({ success: count, failed: 0 })
      setStep("complete")
      queryClient.invalidateQueries({ queryKey: ["students"] })
    },
    onError: () => {
      setError("Failed to import students. Please try again.")
    },
  })

  const handleProceedToPreview = () => {
    setError("")
    if (validateMappings()) {
      setStep("preview")
    }
  }

  const resetImport = () => {
    setStep("upload")
    setCSVData(null)
    setMappings([])
    setSelectedClass("")
    setError("")
    setImportResult(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">CSV Import</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          Import students from a CSV file with column mapping
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-1 sm:gap-2">
        {["upload", "mapping", "preview", "complete"].map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full text-xs sm:text-sm font-medium ${
                step === s
                  ? "bg-emerald-600 text-white"
                  : ["upload", "mapping", "preview", "complete"].indexOf(step) > i
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </div>
            {i < 3 && (
              <div
                className={`mx-1 sm:mx-2 h-0.5 w-4 sm:w-8 ${
                  ["upload", "mapping", "preview", "complete"].indexOf(step) > i ? "bg-emerald-600" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Upload */}
      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription>Select a CSV file containing student data to import</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <label className="flex h-48 sm:h-64 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border transition-colors hover:border-emerald-500 hover:bg-emerald-50/50">
                <FileSpreadsheet className="mb-4 h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
                <span className="mb-2 text-base sm:text-lg font-medium text-center">Drop your CSV file here</span>
                <span className="text-xs sm:text-sm text-muted-foreground">or click to browse</span>
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <div className="mt-6">
              <h4 className="mb-2 font-medium text-sm">Expected CSV Format:</h4>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">First Name</TableHead>
                      <TableHead className="text-xs">Last Name</TableHead>
                      <TableHead className="text-xs">ECZ No</TableHead>
                      <TableHead className="text-xs hidden sm:table-cell">Gender</TableHead>
                      <TableHead className="text-xs hidden sm:table-cell">Guardian</TableHead>
                      <TableHead className="text-xs hidden sm:table-cell">Phone</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="text-xs text-muted-foreground">John</TableCell>
                      <TableCell className="text-xs text-muted-foreground">Mwale</TableCell>
                      <TableCell className="text-xs text-muted-foreground">ECZ001234</TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">Male</TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">Mary Mwale</TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">0971234567</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Mapping */}
      {step === "mapping" && csvData && (
        <Card>
          <CardHeader>
            <CardTitle>Map Columns</CardTitle>
            <CardDescription>
              Match your CSV columns to the database fields. Found {csvData.rows.length} records.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Target Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Select class for import" />
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

            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">CSV Column</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">Sample</TableHead>
                    <TableHead className="text-xs w-8"></TableHead>
                    <TableHead className="text-xs">Map To</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappings.map((mapping) => (
                    <TableRow key={mapping.csvColumn}>
                      <TableCell className="font-medium text-xs sm:text-sm">{mapping.csvColumn}</TableCell>
                      <TableCell className="text-muted-foreground text-xs hidden sm:table-cell">
                        {csvData.rows[0]?.[mapping.csvColumn] || "-"}
                      </TableCell>
                      <TableCell>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={mapping.dbField}
                          onValueChange={(v) => handleMappingChange(mapping.csvColumn, v)}
                        >
                          <SelectTrigger className="w-32 sm:w-48">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {DB_FIELDS.map((field) => (
                              <SelectItem key={field.value} value={field.value}>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs sm:text-sm">{field.label}</span>
                                  {field.required && (
                                    <Badge variant="outline" className="text-[10px] hidden sm:inline">
                                      Req
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <Button variant="outline" onClick={resetImport} className="w-full sm:w-auto bg-transparent">
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleProceedToPreview} className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto">
                Preview Import
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Preview */}
      {step === "preview" && csvData && (
        <Card>
          <CardHeader>
            <CardTitle>Preview Import</CardTitle>
            <CardDescription>
              Review the data before importing {csvData.rows.length} students to {selectedClassObj?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="max-h-72 sm:max-h-96 overflow-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">#</TableHead>
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">ECZ Number</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">Gender</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">Guardian</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getMappedStudents()
                    .slice(0, 20)
                    .map((student, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-xs">{index + 1}</TableCell>
                        <TableCell className="font-medium text-xs sm:text-sm">
                          {student.firstName} {student.lastName}
                        </TableCell>
                        <TableCell className="text-xs hidden sm:table-cell">{student.eczNumber}</TableCell>
                        <TableCell className="text-xs hidden sm:table-cell">{student.gender}</TableCell>
                        <TableCell className="text-xs hidden sm:table-cell">{student.guardianName}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
            {csvData.rows.length > 20 && (
              <p className="text-center text-xs sm:text-sm text-muted-foreground">
                Showing 20 of {csvData.rows.length} records
              </p>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <Button variant="outline" onClick={() => setStep("mapping")} className="w-full sm:w-auto">
                Back to Mapping
              </Button>
              <Button
                onClick={() => importMutation.mutate()}
                disabled={importMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import {csvData.rows.length} Students
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Complete */}
      {step === "complete" && importResult && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold">Import Complete!</h3>
              <p className="mt-2 text-muted-foreground">
                Successfully imported {importResult.success} students to {selectedClassObj?.name}.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button variant="outline" onClick={resetImport}>
                  Import More
                </Button>
                <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                  <a href="/students">View Students</a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
