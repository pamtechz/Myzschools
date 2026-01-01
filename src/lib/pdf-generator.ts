import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { Student, ResultEntry, AssessmentType } from "./types"
import { calculateGPA, ECZ_GRADES } from "./types"

interface TranscriptData {
  student: Student
  results: ResultEntry[]
  assessmentTypes: AssessmentType[]
  term: string
  academicYear: string
  schoolName: string
  schoolAddress: string
  headteacherName: string
}

interface SubjectRow {
  subject: string
  assessments: Record<string, { marks: number; maxMarks: number; percentage: number }>
  totalWeighted: number
  finalGrade: string
  comment: string
}

export function generateTranscriptPDF(data: TranscriptData): void {
  const {
    student,
    results,
    assessmentTypes,
    term,
    academicYear,
    schoolName = "Zambia School Pro Academy",
    schoolAddress = "Plot 123, Independence Avenue, Lusaka, Zambia",
    headteacherName = "Dr. Mary Phiri",
  } = data

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14

  // Colors
  const primaryColor = [16, 185, 129] as [number, number, number] // Emerald
  const headerBg = [245, 245, 245] as [number, number, number]

  // ==================== HEADER ====================
  // School Logo placeholder (circle)
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.circle(margin + 12, 20, 12, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("ZSP", margin + 12, 22, { align: "center" })

  // School Name and Address
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text(schoolName.toUpperCase(), margin + 30, 16)

  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(100, 100, 100)
  doc.text(schoolAddress, margin + 30, 22)
  doc.text("Tel: +260 211 123456 | Email: info@zambiaschoopro.zm", margin + 30, 27)

  // Document Title
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.rect(0, 35, pageWidth, 10, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("ACADEMIC TRANSCRIPT / REPORT CARD", pageWidth / 2, 41, { align: "center" })

  // ==================== STUDENT INFO ====================
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)

  const infoStartY = 52
  const col1X = margin
  const col2X = pageWidth / 2 + 10

  // Left column
  doc.setFont("helvetica", "bold")
  doc.text("Student Name:", col1X, infoStartY)
  doc.setFont("helvetica", "normal")
  doc.text(`${student.firstName} ${student.lastName}`, col1X + 35, infoStartY)

  doc.setFont("helvetica", "bold")
  doc.text("ECZ Number:", col1X, infoStartY + 6)
  doc.setFont("helvetica", "normal")
  doc.text(student.eczNumber, col1X + 35, infoStartY + 6)

  doc.setFont("helvetica", "bold")
  doc.text("Class:", col1X, infoStartY + 12)
  doc.setFont("helvetica", "normal")
  doc.text(student.className, col1X + 35, infoStartY + 12)

  // Right column
  doc.setFont("helvetica", "bold")
  doc.text("Academic Year:", col2X, infoStartY)
  doc.setFont("helvetica", "normal")
  doc.text(academicYear, col2X + 35, infoStartY)

  doc.setFont("helvetica", "bold")
  doc.text("Term:", col2X, infoStartY + 6)
  doc.setFont("helvetica", "normal")
  doc.text(term, col2X + 35, infoStartY + 6)

  doc.setFont("helvetica", "bold")
  doc.text("Gender:", col2X, infoStartY + 12)
  doc.setFont("helvetica", "normal")
  doc.text(student.gender, col2X + 35, infoStartY + 12)

  // Separator line
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, infoStartY + 18, pageWidth - margin, infoStartY + 18)

  // ==================== RESULTS TABLE ====================

  // Group results by subject
  const subjectMap = new Map<string, SubjectRow>()
  const activeAssessments = assessmentTypes.filter((a) => a.isActive).sort((a, b) => a.order - b.order)

  results.forEach((result) => {
    if (!subjectMap.has(result.subjectId)) {
      subjectMap.set(result.subjectId, {
        subject: result.subjectName,
        assessments: {},
        totalWeighted: 0,
        finalGrade: "",
        comment: "",
      })
    }

    const subjectRow = subjectMap.get(result.subjectId)!
    subjectRow.assessments[result.assessmentTypeId] = {
      marks: result.marks,
      maxMarks: result.maxMarks,
      percentage: result.percentage,
    }
  })

  // Calculate weighted totals
  subjectMap.forEach((row) => {
    let totalWeighted = 0
    let totalWeight = 0

    activeAssessments.forEach((assessment) => {
      const assessmentResult = row.assessments[assessment.id]
      if (assessmentResult) {
        totalWeighted += assessmentResult.percentage * (assessment.weightage / 100)
        totalWeight += assessment.weightage
      }
    })

    if (totalWeight > 0) {
      row.totalWeighted = Math.round(totalWeighted)

      // Determine final grade
      for (const grade of ECZ_GRADES) {
        if (row.totalWeighted >= grade.minScore && row.totalWeighted <= grade.maxScore) {
          row.finalGrade = grade.grade
          row.comment = grade.comment
          break
        }
      }
    }
  })

  // Build table headers
  const tableHeaders = [
    "Subject",
    ...activeAssessments.map((a) => `${a.code}\n(${a.weightage}%)`),
    "Final %",
    "Grade",
    "Comment",
  ]

  // Build table body
  const tableBody: string[][] = []
  subjectMap.forEach((row) => {
    const rowData = [
      row.subject,
      ...activeAssessments.map((a) => {
        const assessment = row.assessments[a.id]
        return assessment ? `${assessment.marks}/${assessment.maxMarks}\n(${assessment.percentage}%)` : "-"
      }),
      `${row.totalWeighted}%`,
      row.finalGrade,
      row.comment,
    ]
    tableBody.push(rowData)
  })

  // Add table
  autoTable(doc, {
    startY: infoStartY + 24,
    head: [tableHeaders],
    body: tableBody,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 2,
      valign: "middle",
      halign: "center",
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    columnStyles: {
      0: { halign: "left", cellWidth: 30 },
      [tableHeaders.length - 1]: { halign: "left", cellWidth: 35 },
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    didParseCell: (data) => {
      // Color code grades
      if (data.column.index === tableHeaders.length - 2 && data.section === "body") {
        const grade = data.cell.raw as string
        if (grade === "Distinction") {
          data.cell.styles.textColor = [16, 185, 129]
          data.cell.styles.fontStyle = "bold"
        } else if (grade === "Merit") {
          data.cell.styles.textColor = [59, 130, 246]
          data.cell.styles.fontStyle = "bold"
        } else if (grade === "Fail") {
          data.cell.styles.textColor = [239, 68, 68]
          data.cell.styles.fontStyle = "bold"
        }
      }
    },
  })

  // @ts-expect-error - jspdf-autotable adds this property
  const finalY = doc.lastAutoTable.finalY || 150

  // ==================== GRADING SCALE REFERENCE ====================
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text("ECZ Grading Scale:", margin, finalY + 10)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  const gradeText = ECZ_GRADES.map((g) => `${g.grade}: ${g.minScore}-${g.maxScore}%`).join("  |  ")
  doc.text(gradeText, margin, finalY + 16)

  // ==================== SUMMARY ====================
  const subjects = Array.from(subjectMap.values())
  const avgScore =
    subjects.length > 0 ? Math.round(subjects.reduce((sum, s) => sum + s.totalWeighted, 0) / subjects.length) : 0
  const passCount = subjects.filter((s) => s.totalWeighted >= 50).length

  const gpaValue = calculateGPA(subjects.map((s) => ({ percentage: s.totalWeighted })))

  doc.setFillColor(headerBg[0], headerBg[1], headerBg[2])
  doc.roundedRect(margin, finalY + 22, pageWidth - margin * 2, 18, 2, 2, "F")

  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text(`Overall Average: ${avgScore}%`, margin + 5, finalY + 30)
  doc.text(`Subjects Passed: ${passCount}/${subjects.length}`, margin + 60, finalY + 30)
  doc.text(`Average Points: ${gpaValue}`, margin + 120, finalY + 30)

  // ==================== SIGNATURES ====================
  const sigY = finalY + 50

  // Class Teacher
  doc.setDrawColor(150, 150, 150)
  doc.line(margin, sigY + 8, margin + 50, sigY + 8)
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.text("Class Teacher's Signature", margin, sigY + 14)

  // Headteacher
  doc.line(pageWidth - margin - 50, sigY + 8, pageWidth - margin, sigY + 8)
  doc.text("Headteacher's Signature", pageWidth - margin - 50, sigY + 14)
  doc.setFont("helvetica", "italic")
  doc.text(headteacherName, pageWidth - margin - 50, sigY + 20)

  // Date
  doc.setFont("helvetica", "normal")
  doc.text(`Date Issued: ${new Date().toLocaleDateString("en-GB")}`, pageWidth / 2 - 20, sigY + 14)

  // ==================== FOOTER ====================
  doc.setFontSize(7)
  doc.setTextColor(150, 150, 150)
  doc.text(
    "This is a computer-generated document. For verification, contact the school administration.",
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: "center" },
  )

  // ==================== SAVE ====================
  doc.save(`Transcript_${student.firstName}_${student.lastName}_${term}_${academicYear}.pdf`)
}

export function generateBulkTranscripts(
  students: Student[],
  results: ResultEntry[],
  assessmentTypes: AssessmentType[],
  term: string,
  academicYear: string,
): void {
  students.forEach((student) => {
    const studentResults = results.filter((r) => r.studentId === student.id)
    if (studentResults.length > 0) {
      generateTranscriptPDF({
        student,
        results: studentResults,
        assessmentTypes,
        term,
        academicYear,
        schoolName: "Zambia School Pro Academy",
        schoolAddress: "Plot 123, Independence Avenue, Lusaka, Zambia",
        headteacherName: "Dr. Mary Phiri",
      })
    }
  })
}
