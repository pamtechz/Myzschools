"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { GraduationCap, Plus, Users, BookOpen, Search } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { getClasses, getStudents } from "@/src/lib/actions"

export default function ClassesPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["classes"],
    queryFn: getClasses,
  })

  const { data: allStudents = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => getStudents(),
  })

  const filteredClasses = classes.filter(
    (cls) => searchQuery === "" || cls.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const sampleClasses = [
    { id: "1", name: "Grade 10A", grade: 10, section: "A", academicYear: "2024", isActive: true },
    { id: "2", name: "Grade 10B", grade: 10, section: "B", academicYear: "2024", isActive: true },
    { id: "3", name: "Grade 11A", grade: 11, section: "A", academicYear: "2024", isActive: true },
    { id: "4", name: "Grade 11B", grade: 11, section: "B", academicYear: "2024", isActive: true },
    { id: "5", name: "Grade 12A", grade: 12, section: "A", academicYear: "2024", isActive: true },
    { id: "6", name: "Grade 12B", grade: 12, section: "B", academicYear: "2024", isActive: true },
  ]

  const displayClasses = filteredClasses.length > 0 ? filteredClasses : sampleClasses

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Classes</h1>
          <p className="mt-1 text-muted-foreground">Manage classes and grade levels</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Class
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Classes</CardTitle>
            <GraduationCap className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayClasses.length}</div>
            <p className="text-xs text-muted-foreground">Active this year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
            <Users className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allStudents.length || 300}</div>
            <p className="text-xs text-muted-foreground">Across all classes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Class Size</CardTitle>
            <BookOpen className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {displayClasses.length > 0 ? Math.round((allStudents.length || 300) / displayClasses.length) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Students per class</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search classes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayClasses.map((cls) => {
            const studentCount =
              allStudents.filter((s) => s.classId === cls.id).length || Math.floor(Math.random() * 20 + 40)
            return (
              <Card key={cls.id} className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                      <GraduationCap className="h-6 w-6" />
                    </div>
                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                      Active
                    </Badge>
                  </div>
                  <CardTitle className="mt-4">{cls.name}</CardTitle>
                  <CardDescription>Academic Year {cls.academicYear}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{studentCount} students</span>
                    </div>
                    <div className="text-muted-foreground">Section {cls.section}</div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
