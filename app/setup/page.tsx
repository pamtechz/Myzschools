"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { GraduationCap, School, Calendar, UserCheck, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/src/components/providers/auth-provider"
import { updateDoc, getDocRef, Timestamp } from "@/src/lib/firebase"

export default function SetupWizardPage() {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  const [formData, setFormData] = useState({
    schoolName: "",
    schoolAddress: "",
    schoolType: "Primary",
    academicYear: "2024",
    currentTerm: "Term 1",
    adminTitle: "",
  })

  const nextStep = () => setStep((s) => s + 1)
  const prevStep = () => setStep((s) => s - 1)

  const handleComplete = async () => {
    setIsLoading(true)
    try {
      // Create school configuration document
      const schoolRef = getDocRef("config", "school-settings")
      await updateDoc(schoolRef, {
        ...formData,
        setupCompleted: true,
        setupCompletedBy: user?.uid,
        updatedAt: Timestamp.now(),
      })
      router.push("/")
    } catch (error) {
      console.error("[v0] Setup error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-2xl border-border shadow-xl">
        <CardHeader className="border-b bg-card pb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">School Setup Wizard</CardTitle>
              <CardDescription>Complete these steps to initialize your institution's portal</CardDescription>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between px-2">
            {[
              { id: 1, label: "Institution", icon: School },
              { id: 2, label: "Academic", icon: Calendar },
              { id: 3, label: "Review", icon: UserCheck },
            ].map((s, i) => (
              <div key={s.id} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                      step >= s.id
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-muted-foreground/30 text-muted-foreground"
                    }`}
                  >
                    <s.icon className="h-5 w-5" />
                  </div>
                  <span
                    className={`text-xs font-medium ${step >= s.id ? "text-emerald-600" : "text-muted-foreground"}`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < 2 && (
                  <div
                    className={`mx-4 h-0.5 flex-1 transition-colors ${step > s.id ? "bg-emerald-600" : "bg-muted-foreground/20"}`}
                  />
                )}
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="pt-8">
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="schoolName">Institution Name</Label>
                <Input
                  id="schoolName"
                  placeholder="e.g., Lusaka Central Secondary School"
                  value={formData.schoolName}
                  onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schoolType">Institution Type</Label>
                <Select value={formData.schoolType} onValueChange={(v) => setFormData({ ...formData, schoolType: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Primary">Primary School</SelectItem>
                    <SelectItem value="Secondary">Secondary School</SelectItem>
                    <SelectItem value="Combined">Combined School (P-12)</SelectItem>
                    <SelectItem value="College">Technical/Teacher College</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="schoolAddress">Physical Address</Label>
                <Input
                  id="schoolAddress"
                  placeholder="Plot number, Street, City"
                  value={formData.schoolAddress}
                  onChange={(e) => setFormData({ ...formData, schoolAddress: e.target.value })}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="academicYear">Current Academic Year</Label>
                  <Select
                    value={formData.academicYear}
                    onValueChange={(v) => setFormData({ ...formData, academicYear: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2023">2023</SelectItem>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentTerm">Current Term</Label>
                  <Select
                    value={formData.currentTerm}
                    onValueChange={(v) => setFormData({ ...formData, currentTerm: v })}
                  >
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
              </div>
              <div className="rounded-lg border bg-emerald-50/50 p-4 border-emerald-100">
                <h4 className="flex items-center gap-2 font-semibold text-emerald-800 mb-2 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  ECZ Standards
                </h4>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  The system will automatically initialize ECZ standard grading scales (Distinction 1 to Fail 9) based
                  on these settings.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="rounded-lg border p-6 bg-muted/20">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <School className="h-5 w-5 text-emerald-600" />
                  Configuration Summary
                </h3>
                <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">School Name</dt>
                    <dd className="font-semibold">{formData.schoolName || "Not set"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Type</dt>
                    <dd className="font-semibold">{formData.schoolType}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Academic Year</dt>
                    <dd className="font-semibold">{formData.academicYear}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Current Term</dt>
                    <dd className="font-semibold">{formData.currentTerm}</dd>
                  </div>
                </dl>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminTitle">Admin Designation (Optional)</Label>
                <Input
                  id="adminTitle"
                  placeholder="e.g., Head Teacher, Principal"
                  value={formData.adminTitle}
                  onChange={(e) => setFormData({ ...formData, adminTitle: e.target.value })}
                />
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between border-t bg-muted/10 p-6">
          <Button variant="ghost" onClick={prevStep} disabled={step === 1 || isLoading} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>

          {step < 3 ? (
            <Button
              onClick={nextStep}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              disabled={step === 1 && !formData.schoolName}
            >
              Next Step <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleComplete} className="gap-2 bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Finalizing...
                </>
              ) : (
                <>
                  Complete Setup <CheckCircle2 className="h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
