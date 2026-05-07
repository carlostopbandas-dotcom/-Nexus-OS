import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { userProfilesService } from '@/services/userProfilesService'
import type { UserRole } from '@/types'

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  userRole: UserRole | null
  profileLoading: boolean
}

const AuthContext = createContext<AuthContextValue>({
  user: null, session: null, loading: true, userRole: null, profileLoading: true,
})

async function fetchRole(): Promise<UserRole | null> {
  const { data } = await userProfilesService.getMyProfile()
  return data?.role ?? null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        setProfileLoading(true)
        try {
          const role = await fetchRole()
          setUserRole(role)
        } catch {
          setUserRole(null)
        } finally {
          setProfileLoading(false)
        }
      } else {
        setUserRole(null)
        setProfileLoading(false)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, session, loading, userRole, profileLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
