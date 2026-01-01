"use client"

import type React from "react"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  DollarSign,
  Plus,
  Filter,
  Receipt,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getFeeLedgers, addFeePayment, getClasses } from "@/src/lib/actions"
import type { FeeLedger, FeePayment } from "@/src/lib/types"
import { feePaymentSchema } from "@/src/lib/validation"

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { color: string; icon: React.ReactNode }> = {
    Paid: { color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: <CheckCircle className="h-3 w-3" /> },
    Partial: { color: "bg-amber-100 text-amber-800 border-amber-200", icon: <Clock className="h-3 w-3" /> },
    Unpaid: { color: "bg-red-100 text-red-800 border-red-200", icon: <AlertCircle className="h-3 w-3" /> },
  }

  const variant = variants[status] || variants.Unpaid

  return (
    <Badge variant="outline" className={`${variant.color} flex items-center gap-1`}>
      {variant.icon}
      {status}
    </Badge>
  )
}

function PaymentMethodIcon({ method }: { method: string }) {
  switch (method) {
    case "Cash":
      return <Banknote className="h-4 w-4" />
    case "Bank Transfer":
      return <CreditCard className="h-4 w-4" />
    case "Mobile Money":
      return <Smartphone className="h-4 w-4" />
    default:
      return <DollarSign className="h-4 w-4" />
  }
}

function AddPaymentDialog({
  ledger,
  onSuccess,
}: {
  ledger: FeeLedger
  onSuccess: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "Cash" as "Cash" | "Bank Transfer" | "Mobile Money",
    receiptNumber: "",
    receivedBy: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      const payment: Omit<FeePayment, "id"> = {
        amount: Number(formData.amount),
        paymentDate: formData.paymentDate,
        paymentMethod: formData.paymentMethod,
        receiptNumber: formData.receiptNumber,
        receivedBy: formData.receivedBy,
      }
      await addFeePayment(ledger.id, payment, ledger)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feeLedgers"] })
      setIsOpen(false)
      setFormData({
        amount: "",
        paymentDate: new Date().toISOString().split("T")[0],
        paymentMethod: "Cash",
        receiptNumber: "",
        receivedBy: "",
      })
      onSuccess()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const result = feePaymentSchema.safeParse({
      ...formData,
      amount: Number(formData.amount),
    })

    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message
        }
      })
      setErrors(fieldErrors)
      return
    }

    if (Number(formData.amount) > ledger.balance) {
      setErrors({ amount: "Payment exceeds outstanding balance" })
      return
    }

    mutation.mutate()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={ledger.balance <= 0}>
          <Plus className="mr-1 h-3 w-3" />
          Add Payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a fee payment for {ledger.studentName}. Outstanding balance: K{ledger.balance.toLocaleString()}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (K)</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                max={ledger.balance}
                placeholder="Enter amount"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className={errors.amount ? "border-destructive" : ""}
              />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input
                id="paymentDate"
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) =>
                  setFormData({ ...formData, paymentMethod: value as "Cash" | "Bank Transfer" | "Mobile Money" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="receiptNumber">Receipt Number</Label>
              <Input
                id="receiptNumber"
                placeholder="RCP-001"
                value={formData.receiptNumber}
                onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                className={errors.receiptNumber ? "border-destructive" : ""}
              />
              {errors.receiptNumber && <p className="text-xs text-destructive">{errors.receiptNumber}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="receivedBy">Received By</Label>
            <Input
              id="receivedBy"
              placeholder="Cashier name"
              value={formData.receivedBy}
              onChange={(e) => setFormData({ ...formData, receivedBy: e.target.value })}
              className={errors.receivedBy ? "border-destructive" : ""}
            />
            {errors.receivedBy && <p className="text-xs text-destructive">{errors.receivedBy}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
              {mutation.isPending ? "Processing..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function FeeLedgerPage() {
  const [selectedClass, setSelectedClass] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [successMessage, setSuccessMessage] = useState("")

  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: getClasses,
  })

  const { data: ledgers = [], isLoading } = useQuery({
    queryKey: ["feeLedgers", selectedClass],
    queryFn: () => getFeeLedgers(selectedClass === "all" ? undefined : selectedClass),
  })

  const filteredLedgers = ledgers.filter((ledger) => {
    const matchesSearch = searchQuery === "" || ledger.studentName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || ledger.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totals = ledgers.reduce(
    (acc, l) => ({
      expected: acc.expected + l.totalFees,
      collected: acc.collected + l.paidAmount,
      outstanding: acc.outstanding + l.balance,
    }),
    { expected: 0, collected: 0, outstanding: 0 },
  )

  const collectionRate = totals.expected > 0 ? Math.round((totals.collected / totals.expected) * 100) : 0

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tighter text-foreground">Financial Ledger</h1>
        <p className="text-muted-foreground text-lg">
          Real-time institutional revenue tracking and student fee management.
        </p>
      </div>

      {successMessage && (
        <Alert className="border-primary/20 bg-primary/5 text-primary">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="font-medium">{successMessage}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Total Expected",
            value: `K ${totals.expected.toLocaleString()}`,
            sub: "K 0.00 last term",
            icon: DollarSign,
          },
          {
            title: "Revenue Collected",
            value: `K ${totals.collected.toLocaleString()}`,
            sub: `${collectionRate}% of target`,
            icon: TrendingUp,
            color: "text-primary",
          },
          {
            title: "Outstanding Fees",
            value: `K ${totals.outstanding.toLocaleString()}`,
            sub: "Requires attention",
            icon: TrendingDown,
            color: "text-destructive",
          },
          { title: "Collection Health", value: `${collectionRate}%`, sub: "Operational efficiency", icon: Receipt },
        ].map((stat, i) => (
          <Card key={i} className="border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color || "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold tracking-tight ${stat.color || ""}`}>{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1 font-mono">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/40 shadow-2xl shadow-black/50">
        <CardHeader className="border-b border-border/40 bg-muted/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-xl">Transaction Records</CardTitle>
              <CardDescription>
                Filtering {filteredLedgers.length} records across{" "}
                {selectedClass === "all" ? "all classes" : "selected class"}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-40">
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Partial">Partial</SelectItem>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-none border-0 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="py-4 font-mono text-[10px] uppercase tracking-widest">
                    Student / Account
                  </TableHead>
                  <TableHead className="text-right py-4 font-mono text-[10px] uppercase tracking-widest">
                    Expected
                  </TableHead>
                  <TableHead className="text-right py-4 font-mono text-[10px] uppercase tracking-widest">
                    Paid
                  </TableHead>
                  <TableHead className="text-right py-4 font-mono text-[10px] uppercase tracking-widest">
                    Balance
                  </TableHead>
                  <TableHead className="py-4 font-mono text-[10px] uppercase tracking-widest">Status</TableHead>
                  <TableHead className="text-right py-4 font-mono text-[10px] uppercase tracking-widest">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLedgers.map((ledger) => {
                  const lastPayment = ledger.payments?.[ledger.payments.length - 1]
                  return (
                    <TableRow key={ledger.id}>
                      <TableCell>
                        <div className="font-medium">{ledger.studentName}</div>
                        <div className="text-xs text-muted-foreground">
                          {ledger.term} - {ledger.academicYear}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">K {ledger.totalFees.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-emerald-600">
                        K {ledger.paidAmount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-destructive">K {ledger.balance.toLocaleString()}</TableCell>
                      <TableCell>
                        <StatusBadge status={ledger.status} />
                      </TableCell>
                      <TableCell>
                        {lastPayment ? (
                          <div className="flex items-center gap-2 text-sm">
                            <PaymentMethodIcon method={lastPayment.paymentMethod} />
                            <span>K {lastPayment.amount.toLocaleString()}</span>
                            <span className="text-muted-foreground">
                              {new Date(lastPayment.paymentDate).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <AddPaymentDialog
                          ledger={ledger}
                          onSuccess={() => {
                            setSuccessMessage("Payment recorded successfully!")
                            setTimeout(() => setSuccessMessage(""), 3000)
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
