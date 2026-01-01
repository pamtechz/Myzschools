"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { BarChart3, PieChartIcon, TrendingUp, Users, GraduationCap, DollarSign, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSubjectAnalytics, getFeeAnalytics, getClasses } from "@/src/lib/actions"

const COLORS = {
  distinction: "#10b981",
  merit: "#3b82f6",
  credit: "#f59e0b",
  pass: "#f97316",
  fail: "#ef4444",
}

const PIE_COLORS = ["#10b981", "#f97316"]

export default function AnalyticsPage() {
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedTerm, setSelectedTerm] = useState<string>("Term 1")
  const [academicYear] = useState<string>("2024")

  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: getClasses,
  })

  const { data: subjectData = [], isLoading: subjectLoading } = useQuery({
    queryKey: ["subjectAnalytics", selectedClass, selectedTerm, academicYear],
    queryFn: () => getSubjectAnalytics(selectedClass, selectedTerm, academicYear),
    enabled: !!selectedClass,
  })

  const { data: feeData, isLoading: feeLoading } = useQuery({
    queryKey: ["feeAnalytics"],
    queryFn: getFeeAnalytics,
  })

  // Transform data for charts
  const subjectChartData = subjectData.map((subject) => ({
    name: subject.subjectName?.length > 8 ? subject.subjectName.substring(0, 8) + "..." : subject.subjectName,
    fullName: subject.subjectName,
    average: subject.averageScore,
    passRate: subject.passRate,
  }))

  const gradeDistributionData =
    subjectData.length > 0
      ? [
          {
            name: "Distinction",
            value: subjectData.reduce((sum, s) => sum + s.distinction, 0),
            color: COLORS.distinction,
          },
          { name: "Merit", value: subjectData.reduce((sum, s) => sum + s.merit, 0), color: COLORS.merit },
          { name: "Credit", value: subjectData.reduce((sum, s) => sum + s.credit, 0), color: COLORS.credit },
          { name: "Pass", value: subjectData.reduce((sum, s) => sum + s.pass, 0), color: COLORS.pass },
          { name: "Fail", value: subjectData.reduce((sum, s) => sum + s.fail, 0), color: COLORS.fail },
        ]
      : []

  const feeChartData = feeData
    ? [
        { name: "Collected", value: feeData.totalCollected, color: PIE_COLORS[0] },
        { name: "Outstanding", value: feeData.totalOutstanding, color: PIE_COLORS[1] },
      ]
    : []

  // Sample data for demonstration
  const sampleSubjectData = [
    { name: "Math", fullName: "Mathematics", average: 72, passRate: 85 },
    { name: "English", fullName: "English", average: 68, passRate: 78 },
    { name: "Science", fullName: "Science", average: 75, passRate: 82 },
    { name: "History", fullName: "History", average: 65, passRate: 70 },
    { name: "Geo", fullName: "Geography", average: 70, passRate: 75 },
    { name: "Physics", fullName: "Physics", average: 62, passRate: 68 },
  ]

  const sampleGradeData = [
    { name: "Distinction", value: 45, color: COLORS.distinction },
    { name: "Merit", value: 78, color: COLORS.merit },
    { name: "Credit", value: 95, color: COLORS.credit },
    { name: "Pass", value: 60, color: COLORS.pass },
    { name: "Fail", value: 22, color: COLORS.fail },
  ]

  const sampleFeeData = [
    { name: "Collected", value: 2400000, color: PIE_COLORS[0] },
    { name: "Outstanding", value: 680000, color: PIE_COLORS[1] },
  ]

  const displaySubjectData = subjectChartData.length > 0 ? subjectChartData : sampleSubjectData
  const displayGradeData = gradeDistributionData.length > 0 ? gradeDistributionData : sampleGradeData
  const displayFeeData = feeChartData.length > 0 ? feeChartData : sampleFeeData

  const totalStudents = displayGradeData.reduce((sum, d) => sum + d.value, 0)
  const overallPassRate =
    totalStudents > 0
      ? Math.round((displayGradeData.slice(0, 4).reduce((sum, d) => sum + d.value, 0) / totalStudents) * 100)
      : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Analytics Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          View performance metrics and fee collection statistics
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-600" />
            Analysis Parameters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
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

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Students</CardTitle>
            <Users className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">In selected class</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Pass Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600">{overallPassRate}%</div>
            <p className="text-xs text-muted-foreground">Scoring 50%+</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Subjects</CardTitle>
            <GraduationCap className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{displaySubjectData.length}</div>
            <p className="text-xs text-muted-foreground">With results</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Fee Collection</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{feeData ? `${feeData.collectionRate}%` : "78%"}</div>
            <p className="text-xs text-muted-foreground">Of target</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Subject Comparison Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <BarChart3 className="h-5 w-5 text-emerald-600" />
              Subject Performance
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Average scores and pass rates by subject</CardDescription>
          </CardHeader>
          <CardContent>
            {subjectLoading ? (
              <div className="flex h-64 sm:h-80 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={displaySubjectData} margin={{ top: 20, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="name"
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    formatter={(value: number, name: string) => [
                      `${value}%`,
                      name === "average" ? "Average Score" : "Pass Rate",
                    ]}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="average" name="Average Score" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="passRate" name="Pass Rate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Grade Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <PieChartIcon className="h-5 w-5 text-emerald-600" />
              Grade Distribution
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Distribution of grades across all subjects</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={displayGradeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {displayGradeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`${value} students`, "Count"]}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fee Collection Donut Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              Fee Collection Status
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Percentage of fees collected vs outstanding
            </CardDescription>
          </CardHeader>
          <CardContent>
            {feeLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <ResponsiveContainer width="100%" height={200} className="sm:w-1/2">
                  <PieChart>
                    <Pie
                      data={displayFeeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {displayFeeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`K ${value.toLocaleString()}`, "Amount"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-4 w-full sm:w-auto">
                  {displayFeeData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                      <div>
                        <div className="font-medium text-sm">{entry.name}</div>
                        <div className="text-lg font-bold">K {entry.value.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-4">
                    <div className="text-sm text-muted-foreground">Total Expected</div>
                    <div className="text-xl font-bold">
                      K {displayFeeData.reduce((sum, d) => sum + d.value, 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
