"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ClipboardList,
  Settings,
  DollarSign,
  FileText,
  BarChart3,
  Upload,
  ArrowUpDown,
  Menu,
  BookOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/src/components/providers/auth-provider"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["admin", "teacher", "parent"] },
  { name: "Students", href: "/students", icon: Users, roles: ["admin", "teacher"] },
  { name: "Classes", href: "/classes", icon: GraduationCap, roles: ["admin", "teacher"] },
  { name: "Attendance", href: "/attendance", icon: ClipboardList, roles: ["admin", "teacher"] },
  { name: "Lesson Plans", href: "/lessons", icon: BookOpen, roles: ["admin", "teacher"] },
  { name: "Results Entry", href: "/results/entry", icon: ClipboardList, roles: ["admin", "teacher"] },
  { name: "Transcripts", href: "/results/transcripts", icon: FileText, roles: ["admin", "teacher", "parent"] },
  { name: "Fee Ledger", href: "/finance/ledger", icon: DollarSign, roles: ["admin", "parent"] },
  { name: "Analytics", href: "/analytics", icon: BarChart3, roles: ["admin"] },
  { name: "CSV Import", href: "/admin/import", icon: Upload, roles: ["admin"] },
  { name: "Bulk Promotion", href: "/admin/promotion", icon: ArrowUpDown, roles: ["admin"] },
  { name: "Assessments", href: "/admin/assessments", icon: Settings, roles: ["admin"] },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { profile } = useAuth()
  const userRole = profile?.role || "admin" // Default to admin if profile is not yet loaded for backward compatibility

  const filteredNavigation = navigation.filter((item) => item.roles.includes(userRole))

  return (
    <>
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <Link href="/" className="flex items-center gap-3" onClick={onNavigate}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-sidebar-primary-foreground">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-semibold text-sidebar-foreground">Zambia School</span>
            <span className="block text-xs text-sidebar-foreground/60">Pro Edition</span>
          </div>
        </Link>
      </div>
      <nav className="flex flex-col gap-1 p-4">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-emerald-600"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </>
  )
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 bg-sidebar p-0">
        <SidebarContent onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-sidebar-border bg-sidebar lg:block">
      <SidebarContent />
    </aside>
  )
}
