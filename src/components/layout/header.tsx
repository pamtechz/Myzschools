"use client"

import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu"

import { DropdownMenuLabel } from "@/components/ui/dropdown-menu"

import { DropdownMenuContent } from "@/components/ui/dropdown-menu"

import { Button } from "@/components/ui/button"

import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { DropdownMenu } from "@/components/ui/dropdown-menu"

// ... existing imports ...
import { useAuth } from "@/src/components/providers/auth-provider"
import { getFirebaseAuth } from "@/src/lib/firebase"
import { useRouter } from "next/navigation"
import { User } from "lucide-react" // Declare the User variable here

export function Header() {
  const { user } = useAuth()
  const router = useRouter()
  const auth = getFirebaseAuth()

  const handleLogout = async () => {
    await auth.signOut()
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background px-4 lg:px-6">
      {/* ... existing search code ... */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* ... existing notification code ... */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white overflow-hidden">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL || "/placeholder.svg"}
                    alt={user.displayName || "User"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </div>
              <span className="hidden text-sm font-medium sm:inline">
                {user?.displayName || user?.email?.split("@")[0] || "Admin User"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>My Account</span>
                <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
