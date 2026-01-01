"use client"

import type React from "react"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Pencil, Trash2, Search, User, Phone } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
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
import { getStudents, createStudent, getClasses } from "@/src/lib/actions"
import type { Student } from "@/src/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AdminStudentsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const queryClient = useQueryClient()

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: () => getStudents(),
  })

  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: getClasses,
  })

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      // In a real app, update would go here. For now, we focus on connection.
      return createStudent(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] })
      setIsDialogOpen(false)
      setEditingStudent(null)
    },
  })

  const filteredStudents = students.filter(
    (s) =>
      searchQuery === "" ||
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.eczNumber.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const classId = formData.get("classId") as string
    const classObj = classes.find((c) => c.id === classId)

    const data = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      eczNumber: formData.get("eczNumber") as string,
      gender: formData.get("gender") as "Male" | "Female",
      dateOfBirth: formData.get("dateOfBirth") as string,
      classId,
      className: classObj?.name || "",
      enrollmentDate: new Date().toISOString(),
      guardianName: formData.get("guardianName") as string,
      guardianPhone: formData.get("guardianPhone") as string,
      isActive: true,
    }
    mutation.mutate(data)
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Directory</h1>
          <p className="text-muted-foreground">Manage student records, enrollment, and profiles.</p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) setEditingStudent(null)
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="mr-2 h-4 w-4" />
              Enroll Student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingStudent ? "Edit Student" : "New Student Enrollment"}</DialogTitle>
                <DialogDescription>Enter the student's personal and academic details.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" name="firstName" defaultValue={editingStudent?.firstName} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" name="lastName" defaultValue={editingStudent?.lastName} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="eczNumber">ECZ Number</Label>
                    <Input id="eczNumber" name="eczNumber" defaultValue={editingStudent?.eczNumber} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select name="gender" defaultValue={editingStudent?.gender || "Male"}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="classId">Assigned Class</Label>
                    <Select name="classId" defaultValue={editingStudent?.classId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
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
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input id="dateOfBirth" name="dateOfBirth" type="date" required />
                  </div>
                </div>
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold mb-3">Guardian Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="guardianName">Guardian Name</Label>
                      <Input id="guardianName" name="guardianName" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="guardianPhone">Guardian Phone</Label>
                      <Input id="guardianPhone" name="guardianPhone" required />
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Enrolling..." : "Complete Enrollment"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or ECZ number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />)
        ) : filteredStudents.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-xl font-medium">No students enrolled</p>
              <p className="text-sm text-muted-foreground">Start by enrolling your first student record.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium">Student</th>
                    <th className="px-6 py-3 text-left font-medium">ECZ Number</th>
                    <th className="px-6 py-3 text-left font-medium">Class</th>
                    <th className="px-6 py-3 text-left font-medium">Guardian</th>
                    <th className="px-6 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                            {student.firstName[0]}
                            {student.lastName[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">
                              {student.firstName} {student.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground">{student.gender}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{student.eczNumber}</td>
                      <td className="px-6 py-4">
                        <Badge variant="secondary" className="font-normal">
                          {student.className}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs">
                          <div className="font-medium">{student.guardianName}</div>
                          <div className="text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Phone className="h-3 w-3" />
                            {student.guardianPhone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
