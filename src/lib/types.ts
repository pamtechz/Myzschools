// Assessment Types - Admin Configurable
export interface AssessmentType {
  id: string
  name: string // e.g., "CA 1", "Midterm", "End of Term"
  weightage: number
  maxMarks: number
  isActive: boolean
}

// ECZ Grading Scale
export interface GradeScale {
  grade: string
  minScore: number
  maxScore: number
  points: number
  comment: string
}

export const ECZ_GRADES: GradeScale[] = [
  { grade: "Distinction", minScore: 80, maxScore: 100, points: 1, comment: "Exemplary performance" },
  { grade: "Merit", minScore: 70, maxScore: 79, points: 2, comment: "Outstanding work" },
  { grade: "Credit", minScore: 60, maxScore: 69, points: 3, comment: "Good achievement" },
  { grade: "Pass", minScore: 50, maxScore: 59, points: 4, comment: "Satisfactory progress" },
  { grade: "Fail", minScore: 0, maxScore: 49, points: 9, comment: "Needs improvement" },
]

// Student
export interface Student {
  id: string
  firstName: string
  lastName: string
  middleName?: string
  eczNumber: string // ECZ Registration Number
  gender: "Male" | "Female"
  dateOfBirth: string
  classId: string
  className: string
  enrollmentDate: string
  guardianName: string
  guardianPhone: string
  address?: string
  isActive: boolean
}

// Class/Grade
export interface SchoolClass {
  id: string
  name: string // e.g., "Grade 10A"
  grade: number // e.g., 10
  section: string // e.g., "A"
  academicYear: string // e.g., "2024"
  teacherId?: string
  isActive: boolean
}

// Subject
export interface Subject {
  id: string
  name: string
  code: string
  teacherId?: string
  isCore: boolean
  isActive: boolean
}

// Result Entry
export interface ResultEntry {
  id: string
  studentId: string
  studentName: string
  eczNumber: string
  classId: string
  subjectId: string
  subjectName: string
  assessmentTypeId: string
  assessmentTypeName: string
  academicYear: string
  term: string // "Term 1", "Term 2", "Term 3"
  marks: number
  maxMarks: number
  percentage: number
  grade: string
  comment: string
  enteredBy: string
}

// Fee Ledger
export interface FeeLedger {
  id: string
  studentId: string
  studentName: string
  classId: string
  academicYear: string
  term: string
  totalFees: number
  paidAmount: number
  balance: number
  payments: FeePayment[]
  status: "Paid" | "Partial" | "Unpaid"
}

export interface FeePayment {
  id: string
  amount: number
  paymentDate: string
  paymentMethod: "Cash" | "Bank Transfer" | "Mobile Money"
  receiptNumber: string
  receivedBy: string
}

// CSV Import Mapping
export interface CSVMapping {
  csvColumn: string
  dbField: string
}

// Analytics Types
export interface SubjectAnalytics {
  subjectName: string
  averageScore: number
  passRate: number
  distinctionCount: number
  meritCount: number
  creditCount: number
  passCount: number
  failCount: number
}

export interface FeeAnalytics {
  totalExpected: number
  totalCollected: number
  totalOutstanding: number
  collectionRate: number
}

// Helper Functions
export function calculateGrade(percentage: number): { grade: string; comment: string } {
  for (const scale of ECZ_GRADES) {
    if (percentage >= scale.minScore && percentage <= scale.maxScore) {
      return { grade: scale.grade, comment: scale.comment }
    }
  }
  return { grade: "Fail", comment: "Needs improvement" }
}

export function calculatePercentage(marks: number, maxMarks: number): number {
  return Math.round((marks / maxMarks) * 100)
}

// GPA Calculation Helpers
export function calculatePoints(percentage: number): number {
  for (const scale of ECZ_GRADES) {
    if (percentage >= scale.minScore && percentage <= scale.maxScore) {
      return scale.points
    }
  }
  return 9
}

export function calculateGPA(subjects: { percentage: number }[]): number {
  if (subjects.length === 0) return 0
  const totalPoints = subjects.reduce((sum, s) => sum + calculatePoints(s.percentage), 0)
  return Number.parseFloat((totalPoints / subjects.length).toFixed(2))
}

// User Roles and Profile
export type UserRole = "admin" | "teacher" | "parent" | "student"

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  role: UserRole
  schoolId: string
  associatedId?: string // studentId for parents, teacherId for teachers
}

// Attendance Record
export interface AttendanceRecord {
  id?: string
  studentId: string
  studentName: string
  classId: string
  date: string
  status: "present" | "absent" | "late"
  markedBy: string
  markedAt: any
}

// Lesson Plan
export interface LessonPlan {
  id?: string
  title: string
  objective: string
  content: string
  classId: string
  subjectId: string
  date: string
  teacherId: string
  teacherName: string
  createdAt: any
}
