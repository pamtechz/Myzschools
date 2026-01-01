"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Users, Search, Plus, UserCircle, Phone } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getStudents, getClasses } from "@/src/lib/actions"

export default function StudentsPage() {
  const [selectedClass, setSelectedClass] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: getClasses,
  })

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students", selectedClass],
    queryFn: () => getStudents(selectedClass === "all" ? undefined : selectedClass),
  })

  const filteredStudents = students.filter(
    (student) =>
      searchQuery === "" ||
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.eczNumber.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Students</h1>
          <p className="mt-1 text-muted-foreground">Manage student records and information</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
            <Users className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">Active enrollments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Male Students</CardTitle>
            <UserCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.filter((s) => s.gender === "Male").length}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((students.filter((s) => s.gender === "Male").length / students.length) * 100) || 0}% of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Female Students</CardTitle>
            <UserCircle className="h-4 w-4 text-pink-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.filter((s) => s.gender === "Female").length}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((students.filter((s) => s.gender === "Female").length / students.length) * 100) || 0}% of
              total
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Directory</CardTitle>
          <CardDescription>View and manage all registered students</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or ECZ number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 font-semibold">No Students Found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery
                  ? "No students match your search criteria."
                  : "No students registered yet. Add your first student."}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>ECZ Number</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Guardian</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                            {student.firstName[0]}
                            {student.lastName[0]}
                          </div>
                          <div>
                            <div className="font-medium">
                              {student.firstName} {student.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Enrolled: {new Date(student.enrollmentDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{student.eczNumber}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            student.gender === "Male"
                              ? "border-blue-200 bg-blue-50 text-blue-700"
                              : "border-pink-200 bg-pink-50 text-pink-700"
                          }
                        >
                          {student.gender}
                        </Badge>
                      </TableCell>
                      <TableCell>{student.className}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{student.guardianName}</div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {student.guardianPhone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                          Active
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
