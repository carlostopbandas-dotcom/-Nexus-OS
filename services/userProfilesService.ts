import { supabase } from '@/lib/supabase'
import type { UserProfile, UserRole } from '@/types'

type ServiceResult<T> = { data: T | null; error: string | null }

export const userProfilesService = {
  async getMyProfile(): Promise<ServiceResult<UserProfile>> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .single()
    if (error) return { data: null, error: error.message }
    return { data: mapProfile(data), error: null }
  },

  async getAll(): Promise<ServiceResult<UserProfile[]>> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) return { data: null, error: error.message }
    return { data: (data ?? []).map(mapProfile), error: null }
  },

  async create(profile: {
    id: string
    role: UserRole
    fullName?: string
    email?: string
  }): Promise<ServiceResult<UserProfile>> {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        id: profile.id,
        role: profile.role,
        full_name: profile.fullName ?? null,
        email: profile.email ?? null,
      })
      .select()
      .single()
    if (error) return { data: null, error: error.message }
    return { data: mapProfile(data), error: null }
  },

  async updateRole(id: string, role: UserRole): Promise<ServiceResult<UserProfile>> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ role })
      .eq('id', id)
      .select()
      .single()
    if (error) return { data: null, error: error.message }
    return { data: mapProfile(data), error: null }
  },

  async markOnboarded(id: string): Promise<ServiceResult<UserProfile>> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ onboarded_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) return { data: null, error: error.message }
    return { data: mapProfile(data), error: null }
  },

  async delete(id: string): Promise<ServiceResult<null>> {
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', id)
    return { data: null, error: error?.message ?? null }
  },
}

function mapProfile(p: Record<string, unknown>): UserProfile {
  return {
    id: p.id as string,
    role: p.role as UserRole,
    fullName: (p.full_name as string) ?? null,
    email: (p.email as string) ?? null,
    onboardedAt: (p.onboarded_at as string) ?? null,
    createdAt: p.created_at as string,
  }
}
