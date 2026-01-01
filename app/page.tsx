"use client"

import { useQuery } from "@tanstack/react-query"
import { Users, GraduationCap, BookOpen, DollarSign, Loader2, ClipboardList } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getStudents, getClasses, getResults, getFeeAnalytics } from "@/src/lib/actions"
import { useAuth } from "@/src/components/providers/auth-provider"

function AdminDashboard({ data }: { data: any }) {
  const { students, classes, results, feeAnalytics, user } = data
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Welcome back, {user?.displayName || "Administrator"}</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
            <Users className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Enrolled students</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Classes</CardTitle>
            <GraduationCap className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes.length}</div>
            <p className="text-xs text-muted-foreground">Across all grades</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Results Entered</CardTitle>
            <BookOpen className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{results.length.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This academic year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fee Collection</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">K {(feeAnalytics?.totalCollected || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{feeAnalytics?.collectionRate || 0}% of target</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <a
              href="/results/entry"
              className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-accent"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">Enter Results</div>
                <div className="text-sm text-muted-foreground">Record student assessment marks</div>
              </div>
            </a>
            <a
              href="/admin/assessments"
              className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-accent"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">Manage Assessments</div>
                <div className="text-sm text-muted-foreground">Configure assessment types and weightages</div>
              </div>
            </a>
            <a
              href="/results/transcripts"
              className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-accent"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">Generate Transcripts</div>
                <div className="text-sm text-muted-foreground">Create PDF report cards</div>
              </div>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: "Results entered for Grade 10A - Mathematics", time: "2 hours ago", user: "Mr. Banda" },
                { action: "New student registered: John Mwale", time: "4 hours ago", user: "Admin" },
                { action: "Fee payment received: K1,500", time: "Yesterday", user: "Cashier" },
                { action: "Transcript generated for Grade 12B", time: "Yesterday", user: "Mrs. Phiri" },
              ].map((activity, index) => (
                <div key={index} className="flex items-start gap-3 border-b border-border pb-3 last:border-0">
                  <div className="h-2 w-2 mt-2 rounded-full bg-emerald-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time} by {activity.user}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function TeacherDashboard({ data }: { data: any }) {
  const { user } = data
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Teacher Portal</h1>
        <p className="mt-1 text-muted-foreground">
          Hello, {user?.displayName || "Teacher"}. Here are your classes for today.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-emerald-100 bg-emerald-50/30">
          <CardHeader>
            <CardTitle className="text-sm font-medium">My Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pending Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">128</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Class Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
          </CardContent>
        </Card>
      </div>
      {/* Quick Actions for Teachers */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Academic Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <a href="/attendance" className="flex items-center gap-3 rounded-lg border p-4 hover:bg-accent">
              <Users className="h-5 w-5 text-emerald-600" />
              <div>
                <div className="font-medium">Mark Daily Attendance</div>
                <div className="text-sm text-muted-foreground">Track presence for your current class</div>
              </div>
            </a>
            <a href="/lessons" className="flex items-center gap-3 rounded-lg border p-4 hover:bg-accent">
              <BookOpen className="h-5 w-5 text-emerald-600" />
              <div>
                <div className="font-medium">Manage Lesson Plans</div>
                <div className="text-sm text-muted-foreground">Prepare and review your teaching material</div>
              </div>
            </a>
            <a href="/results/entry" className="flex items-center gap-3 rounded-lg border p-4 hover:bg-accent">
              <ClipboardList className="h-5 w-5 text-emerald-600" />
              <div>
                <div className="font-medium">Enter Assessment Marks</div>
                <div className="text-sm text-muted-foreground">Submit marks for your assigned subjects</div>
              </div>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ParentDashboard({ data }: { data: any }) {
  const { user } = data
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Parent Portal</h1>
        <p className="mt-1 text-muted-foreground">
          Welcome, {user?.displayName || "Parent"}. Viewing records for [Student Name].
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Term Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">72%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Fees Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">K 1,200</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth()

  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ["students"],
    queryFn: () => getStudents(),
    enabled: !!user,
  })

  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ["classes"],
    queryFn: getClasses,
    enabled: !!user,
  })

  const { data: results = [], isLoading: resultsLoading } = useQuery({
    queryKey: ["results", "recent"],
    queryFn: () => getResults({ academicYear: "2024" }), // In a real app, this would come from school settings
    enabled: !!user,
  })

  const { data: feeAnalytics, isLoading: feesLoading } = useQuery({
    queryKey: ["feeAnalytics"],
    queryFn: getFeeAnalytics,
    enabled: !!user,
  })

  const isLoading = authLoading || studentsLoading || classesLoading || resultsLoading || feesLoading

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (profile?.role === "teacher") {
    return <TeacherDashboard data={{ user }} />
  }

  if (profile?.role === "parent") {
    return <ParentDashboard data={{ user }} />
  }

  return <AdminDashboard data={{ students, classes, results, feeAnalytics, user }} />
}
