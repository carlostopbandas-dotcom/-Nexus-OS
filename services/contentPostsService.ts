import { supabase } from '@/lib/supabase'
import type { Post } from '@/types'

type ServiceResult<T> = { data: T | null; error: string | null }

export const contentPostsService = {
  async getAll(): Promise<ServiceResult<Post[]>> {
    const { data, error } = await supabase
      .from('content_posts')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return { data: null, error: error.message }
    return { data: data ?? null, error: null }
  },

  async getById(id: string): Promise<ServiceResult<Post>> {
    const { data, error } = await supabase
      .from('content_posts')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return { data: null, error: error.message }
    return { data: data ?? null, error: null }
  },

  async create(post: Omit<Post, 'id'>): Promise<ServiceResult<Post>> {
    const { data, error } = await supabase
      .from('content_posts')
      .insert(post)
      .select()
      .single()
    if (error) return { data: null, error: error.message }
    return { data: data ?? null, error: null }
  },

  async update(id: string, updates: Partial<Post>): Promise<ServiceResult<Post>> {
    const { data, error } = await supabase
      .from('content_posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) return { data: null, error: error.message }
    return { data: data ?? null, error: null }
  },

  async delete(id: string): Promise<ServiceResult<null>> {
    const { error } = await supabase.from('content_posts').delete().eq('id', id)
    return { data: null, error: error?.message ?? null }
  },
}
