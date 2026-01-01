"use server"

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  serverTimestamp,
  orderBy,
  writeBatch,
} from "firebase/firestore"
import { getFirebaseDb } from "./firebase"
import type {
  Student,
  Class,
  Subject,
  AssessmentType,
  Result,
  FeeTransaction,
  FeeAnalytics,
  AttendanceRecord,
  LessonPlan,
} from "./types"
import { calculatePercentage, calculateGrade } from "./utils" // Declare the variables before using them

// ==================== ASSESSMENT TYPES ====================

export async function getAssessmentTypes(): Promise<AssessmentType[]> {
  const q = query(collection(getFirebaseDb(), "assessmentTypes"), orderBy("order", "asc"))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as AssessmentType)
}

export async function createAssessmentType(
  data: Omit<AssessmentType, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const docRef = await addDoc(collection(getFirebaseDb(), "assessmentTypes"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updateAssessmentType(id: string, data: Partial<AssessmentType>): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), "assessmentTypes", id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteAssessmentType(id: string): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), "assessmentTypes", id), { isActive: false })
}

// ==================== STUDENTS ====================

export async function getStudents(classId?: string): Promise<Student[]> {
  let q
  if (classId) {
    q = query(collection(getFirebaseDb(), "students"), where("classId", "==", classId), where("isActive", "==", true))
  } else {
    q = query(collection(getFirebaseDb(), "students"), where("isActive", "==", true))
  }
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Student)
}

export async function createStudent(data: Omit<Student, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const docRef = await addDoc(collection(getFirebaseDb(), "students"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function bulkCreateStudents(students: Omit<Student, "id" | "createdAt" | "updatedAt">[]): Promise<void> {
  const db = getFirebaseDb()
  const batch = writeBatch(db)

  students.forEach((student) => {
    const docRef = doc(db, "students", crypto.randomUUID())
    batch.set(docRef, {
      ...student,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  })

  await batch.commit()
}

export async function bulkPromoteStudents(
  fromClassId: string,
  toClassId: string,
  toClassName: string,
): Promise<number> {
  const students = await getStudents(fromClassId)
  const db = getFirebaseDb()
  const batch = writeBatch(db)

  students.forEach((student) => {
    const docRef = doc(db, "students", student.id)
    batch.update(docRef, {
      classId: toClassId,
      className: toClassName,
      updatedAt: serverTimestamp(),
    })
  })

  await batch.commit()
  return students.length
}

// ==================== CLASSES ====================

export async function getClasses(): Promise<Class[]> {
  const q = query(collection(getFirebaseDb(), "classes"), where("isActive", "==", true), orderBy("grade", "asc"))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Class)
}

export async function createClass(data: Omit<Class, "id">): Promise<string> {
  const docRef = await addDoc(collection(getFirebaseDb(), "classes"), {
    ...data,
    isActive: true,
  })
  return docRef.id
}

export async function updateClass(id: string, data: Partial<Class>): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), "classes", id), data)
}

export async function deleteClass(id: string): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), "classes", id), { isActive: false })
}

// ==================== SUBJECTS ====================

export async function getSubjects(): Promise<Subject[]> {
  const q = query(collection(getFirebaseDb(), "subjects"), where("isActive", "==", true))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Subject)
}

export async function createSubject(data: Omit<Subject, "id">): Promise<string> {
  const docRef = await addDoc(collection(getFirebaseDb(), "subjects"), {
    ...data,
    isActive: true,
  })
  return docRef.id
}

export async function updateSubject(id: string, data: Partial<Subject>): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), "subjects", id), data)
}

export async function deleteSubject(id: string): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), "subjects", id), { isActive: false })
}

// ==================== RESULTS ====================

export async function getResults(filters: {
  classId?: string
  subjectId?: string
  assessmentTypeId?: string
  term?: string
  academicYear?: string
}): Promise<Result[]> {
  let q = query(collection(getFirebaseDb(), "results"))

  // Note: Firestore compound queries need indexes
  if (filters.classId) {
    q = query(q, where("classId", "==", filters.classId))
  }

  const snapshot = await getDocs(q)
  let results = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Result)

  // Client-side filtering for additional criteria
  if (filters.subjectId) {
    results = results.filter((r) => r.subjectId === filters.subjectId)
  }
  if (filters.assessmentTypeId) {
    results = results.filter((r) => r.assessmentTypeId === filters.assessmentTypeId)
  }
  if (filters.term) {
    results = results.filter((r) => r.term === filters.term)
  }
  if (filters.academicYear) {
    results = results.filter((r) => r.academicYear === filters.academicYear)
  }

  return results
}

export async function saveResults(
  results: Array<{
    studentId: string
    studentName: string
    eczNumber: string
    classId: string
    subjectId: string
    subjectName: string
    assessmentTypeId: string
    assessmentTypeName: string
    academicYear: string
    term: string
    marks: number
    maxMarks: number
  }>,
  enteredBy: string,
): Promise<void> {
  const db = getFirebaseDb()
  const batch = writeBatch(db)

  results.forEach((result) => {
    const percentage = calculatePercentage(result.marks, result.maxMarks)
    const { grade, comment } = calculateGrade(percentage)

    const docRef = doc(db, "results", crypto.randomUUID())
    batch.set(docRef, {
      ...result,
      percentage,
      grade,
      comment,
      enteredBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  })

  await batch.commit()
}

export async function updateResult(
  id: string,
  marks: number,
  maxMarks: number,
): Promise<{ grade: string; comment: string; percentage: number }> {
  const percentage = calculatePercentage(marks, maxMarks)
  const { grade, comment } = calculateGrade(percentage)

  await updateDoc(doc(getFirebaseDb(), "results", id), {
    marks,
    percentage,
    grade,
    comment,
    updatedAt: serverTimestamp(),
  })

  return { grade, comment, percentage }
}

// ==================== FEE LEDGER ====================

export async function getFeeLedgers(classId?: string): Promise<FeeTransaction[]> {
  let q
  if (classId) {
    q = query(collection(getFirebaseDb(), "feeLedgers"), where("classId", "==", classId))
  } else {
    q = query(collection(getFirebaseDb(), "feeLedgers"))
  }
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as FeeTransaction)
}

export async function createFeeLedger(data: Omit<FeeTransaction, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const docRef = await addDoc(collection(getFirebaseDb(), "feeLedgers"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function addFeePayment(
  ledgerId: string,
  payment: Omit<FeeTransaction, "id">,
  currentLedger: FeeTransaction,
): Promise<void> {
  const newPayment = { ...payment, id: crypto.randomUUID() }
  const newPaidAmount = currentLedger.paidAmount + payment.amount
  const newBalance = currentLedger.totalFees - newPaidAmount
  const newStatus = newBalance <= 0 ? "Paid" : newBalance < currentLedger.totalFees ? "Partial" : "Unpaid"

  await updateDoc(doc(getFirebaseDb(), "feeLedgers", ledgerId), {
    payments: [...currentLedger.payments, newPayment],
    paidAmount: newPaidAmount,
    balance: newBalance,
    status: newStatus,
    updatedAt: serverTimestamp(),
  })
}

// ==================== ANALYTICS ====================

export async function getSubjectAnalytics(classId: string, term: string, academicYear: string): Promise<any[]> {
  const results = await getResults({ classId, term, academicYear })
  const subjects = await getSubjects()

  const analytics = subjects.map((subject) => {
    const subjectResults = results.filter((r) => r.subjectId === subject.id)
    const totalStudents = subjectResults.length

    if (totalStudents === 0) {
      return {
        subjectName: subject.name,
        averageScore: 0,
        passRate: 0,
        distinction: 0,
        merit: 0,
        credit: 0,
        pass: 0,
        fail: 0,
      }
    }

    const avgScore = subjectResults.reduce((sum, r) => sum + r.percentage, 0) / totalStudents
    const passCount = subjectResults.filter((r) => r.percentage >= 50).length

    return {
      subjectName: subject.name,
      averageScore: Math.round(avgScore),
      passRate: Math.round((passCount / totalStudents) * 100),
      distinction: subjectResults.filter((r) => r.grade === "Distinction").length,
      merit: subjectResults.filter((r) => r.grade === "Merit").length,
      credit: subjectResults.filter((r) => r.grade === "Credit").length,
      pass: subjectResults.filter((r) => r.grade === "Pass").length,
      fail: subjectResults.filter((r) => r.grade === "Fail").length,
    }
  })

  return analytics.filter((a) => a.averageScore > 0)
}

export async function getFeeAnalytics(): Promise<FeeAnalytics> {
  const ledgers = await getFeeLedgers()

  const totalExpected = ledgers.reduce((sum, l) => sum + l.totalFees, 0)
  const totalCollected = ledgers.reduce((sum, l) => sum + l.paidAmount, 0)
  const totalOutstanding = totalExpected - totalCollected
  const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0

  return {
    totalExpected,
    totalCollected,
    totalOutstanding,
    collectionRate,
  }
}

// ==================== ATTENDANCE ====================

export async function saveAttendance(records: AttendanceRecord[]) {
  const db = getFirebaseDb()
  const batch = writeBatch(db)

  records.forEach((record) => {
    const attendanceRef = doc(collection(db, "attendance"))
    batch.set(attendanceRef, {
      ...record,
      markedAt: serverTimestamp(),
    })
  })

  await batch.commit()
}

export async function getAttendance(classId: string, date: string): Promise<AttendanceRecord[]> {
  const db = getFirebaseDb()
  const q = query(collection(db, "attendance"), where("classId", "==", classId), where("date", "==", date))

  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as AttendanceRecord)
}

// ==================== LESSON PLANS ====================

export async function saveLessonPlan(plan: Omit<LessonPlan, "id" | "createdAt">) {
  const db = getFirebaseDb()
  await addDoc(collection(db, "lesson_plans"), {
    ...plan,
    createdAt: serverTimestamp(),
  })
}

export async function getLessonPlans(teacherId: string): Promise<LessonPlan[]> {
  const db = getFirebaseDb()
  const q = query(collection(db, "lesson_plans"), where("teacherId", "==", teacherId), orderBy("date", "desc"))

  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as LessonPlan)
}
