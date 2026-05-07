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
  const rolePromise = userProfilesService.getMyProfile()
    .then(({ data }) => data?.role ?? null)
    .catch(() => null)
  const timeout = new Promise<null>(resolve => setTimeout(() => resolve(null), 8000))
  return Promise.race([rolePromise, timeout])
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      if (session?.user) {
        // TOKEN_REFRESHED não muda o role — evita rebote de loading
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          setProfileLoading(true)
          const role = await fetchRole()
          setUserRole(role)
          setProfileLoading(false)
        }
      } else {
        setUserRole(null)
        setProfileLoading(false)
      }
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
