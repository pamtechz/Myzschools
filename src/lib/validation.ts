import { z } from "zod"

export const assessmentTypeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(2, "Code must be at least 2 characters").max(10, "Code must be at most 10 characters"),
  weightage: z.number().min(0, "Weightage must be at least 0").max(100, "Weightage must be at most 100"),
  maxMarks: z.number().min(1, "Max marks must be at least 1"),
  isActive: z.boolean(),
  order: z.number().min(1, "Order must be at least 1"),
})

export const studentSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  middleName: z.string().optional(),
  eczNumber: z.string().min(5, "ECZ number must be at least 5 characters"),
  gender: z.enum(["Male", "Female"]),
  dateOfBirth: z.string(),
  classId: z.string().min(1, "Class is required"),
  className: z.string().min(1, "Class name is required"),
  enrollmentDate: z.string(),
  guardianName: z.string().min(2, "Guardian name is required"),
  guardianPhone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().optional(),
  isActive: z.boolean(),
})

export const resultEntrySchema = z.object({
  marks: z.number().min(0, "Marks cannot be negative"),
})

export const feePaymentSchema = z.object({
  amount: z.number().min(1, "Amount must be at least 1"),
  paymentDate: z.string(),
  paymentMethod: z.enum(["Cash", "Bank Transfer", "Mobile Money"]),
  receiptNumber: z.string().min(1, "Receipt number is required"),
  receivedBy: z.string().min(1, "Receiver name is required"),
})

export const csvMappingSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  eczNumber: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
})

export const classSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  grade: z.number().min(1, "Grade is required"),
  section: z.string().min(1, "Section is required"),
  academicYear: z.string().min(4, "Academic year is required"),
})

export const subjectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(2, "Code must be at least 2 characters"),
  department: z.string().optional(),
})

export type AssessmentTypeInput = z.infer<typeof assessmentTypeSchema>
export type StudentInput = z.infer<typeof studentSchema>
export type ResultEntryInput = z.infer<typeof resultEntrySchema>
export type FeePaymentInput = z.infer<typeof feePaymentSchema>
export type ClassInput = z.infer<typeof classSchema>
export type SubjectInput = z.infer<typeof subjectSchema>
