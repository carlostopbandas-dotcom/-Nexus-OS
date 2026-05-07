import { supabase } from '@/lib/supabase'

type ServiceResult<T> = { data: T | null; error: string | null }

export const onboardingService = {
  async isOnboarded(): Promise<ServiceResult<boolean>> {
    const { data: session } = await supabase.auth.getSession()
    const userId = session?.session?.user?.id
    if (!userId) return { data: false, error: null }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('onboarded_at')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return { data: false, error: null }
      return { data: null, error: error.message }
    }

    return { data: data.onboarded_at !== null, error: null }
  },

  async markOnboarded(): Promise<ServiceResult<null>> {
    const { data: session } = await supabase.auth.getSession()
    const userId = session?.session?.user?.id
    if (!userId) return { data: null, error: 'Sessão inválida' }

    const { error } = await supabase
      .from('user_profiles')
      .update({ onboarded_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) return { data: null, error: error.message }
    return { data: null, error: null }
  },
}
