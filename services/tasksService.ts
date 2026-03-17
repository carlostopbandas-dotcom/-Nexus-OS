import { supabase } from '@/lib/supabase'
import type { Task } from '@/types'

type ServiceResult<T> = { data: T | null; error: string | null }

export const tasksService = {
  async getAll(): Promise<ServiceResult<Task[]>> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return { data: null, error: error.message }
    const tasks: Task[] = (data ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      type: t.type,
      completed: t.completed,
      category: t.category,
    }))
    return { data: tasks, error: null }
  },

  async getById(id: string): Promise<ServiceResult<Task>> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return { data: null, error: error.message }
    return { data: { id: data.id, title: data.title, type: data.type, completed: data.completed, category: data.category }, error: null }
  },

  async create(task: Omit<Task, 'id'>): Promise<ServiceResult<Task>> {
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single()
    if (error) return { data: null, error: error.message }
    return { data: { id: data.id, title: data.title, type: data.type, completed: data.completed, category: data.category }, error: null }
  },

  async update(id: string, updates: Partial<Task>): Promise<ServiceResult<Task>> {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) return { data: null, error: error.message }
    return { data: { id: data.id, title: data.title, type: data.type, completed: data.completed, category: data.category }, error: null }
  },

  async delete(id: string): Promise<ServiceResult<null>> {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    return { data: null, error: error?.message ?? null }
  },

  async toggleCompleted(id: string, completed: boolean): Promise<ServiceResult<Task>> {
    return tasksService.update(id, { completed })
  },
}
