import { supabase } from '@/lib/supabase'
import type { Lead } from '@/types'

type ServiceResult<T> = { data: T | null; error: string | null }

export const leadsService = {
  async getAll(): Promise<ServiceResult<Lead[]>> {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    if (error) return { data: null, error: error.message }
    const leads: Lead[] = (data ?? []).map((l) => ({
      id: l.id,
      name: l.name,
      email: l.email,
      whatsapp: l.whatsapp ?? undefined,
      source: l.source,
      status: l.status,
      value: l.value,
      product: l.product,
      module: l.module ?? undefined,
      painPoint: l.pain_point ?? undefined,
      nextAction: l.next_action ?? undefined,
      clientStage: l.client_stage ?? undefined,
      followUpDate: l.follow_up_date ?? undefined,
      createdAt: l.created_at,
    }))
    return { data: leads, error: null }
  },

  async getById(id: string): Promise<ServiceResult<Lead>> {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return { data: null, error: error.message }
    const lead: Lead = {
      id: data.id,
      name: data.name,
      email: data.email,
      source: data.source,
      status: data.status,
      value: data.value,
      product: data.product,
      createdAt: data.created_at,
    }
    return { data: lead, error: null }
  },

  async create(lead: Omit<Lead, 'id' | 'createdAt'>): Promise<ServiceResult<Lead>> {
    const { data, error } = await supabase
      .from('leads')
      .insert({ ...lead, created_at: new Date().toISOString() })
      .select()
      .single()
    if (error) return { data: null, error: error.message }
    return {
      data: { id: data.id, name: data.name, email: data.email, whatsapp: data.whatsapp, source: data.source, status: data.status, value: data.value, product: data.product, module: data.module, painPoint: data.pain_point, nextAction: data.next_action, clientStage: data.client_stage, followUpDate: data.follow_up_date, createdAt: data.created_at },
      error: null,
    }
  },

  async update(id: string, updates: Partial<Lead>): Promise<ServiceResult<Lead>> {
    const { followUpDate, ...rest } = updates as any
    const payload = { ...rest, ...(followUpDate !== undefined && { follow_up_date: followUpDate }) }
    const { data, error } = await supabase
      .from('leads')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) return { data: null, error: error.message }
    return {
      data: { id: data.id, name: data.name, email: data.email, whatsapp: data.whatsapp, source: data.source, status: data.status, value: data.value, product: data.product, module: data.module, painPoint: data.pain_point, nextAction: data.next_action, clientStage: data.client_stage, followUpDate: data.follow_up_date, createdAt: data.created_at },
      error: null,
    }
  },

  async delete(id: string): Promise<ServiceResult<null>> {
    const { error } = await supabase
      .from('leads')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
    return { data: null, error: error?.message ?? null }
  },
}
