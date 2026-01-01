"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { getFirebaseAuth, getDoc, getDocRef } from "@/src/lib/firebase"
import type { UserProfile } from "@/src/lib/types"

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const auth = getFirebaseAuth()
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        try {
          const profileDoc = await getDoc(getDocRef("users", user.uid))
          if (profileDoc.exists()) {
            setProfile(profileDoc.data() as UserProfile)
          } else {
            // Default to admin for first user/existing users for now
            setProfile({
              uid: user.uid,
              email: user.email || "",
              displayName: user.displayName || "",
              role: "admin",
              schoolId: "SCH_001",
              createdAt: {} as any,
              updatedAt: {} as any,
            })
          }
        } catch (error) {
          console.error("[v0] Error fetching profile:", error)
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return <AuthContext.Provider value={{ user, profile, loading }}>{children}</AuthContext.Provider>
}
