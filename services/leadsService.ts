import { supabase } from '@/lib/supabase'
import type { Lead, LeadProduct, LeadBusinessUnit, PaymentStatus } from '@/types'
import { PRODUCT_BUSINESS_UNIT } from '@/types'

type ServiceResult<T> = { data: T | null; error: string | null }

const toLead = (l: any): Lead => ({
  id: l.id,
  name: l.name,
  email: l.email,
  whatsapp: l.whatsapp ?? undefined,
  source: l.source,
  status: l.status,
  value: l.value,
  product: l.product as LeadProduct,
  businessUnit: (l.business_unit ?? PRODUCT_BUSINESS_UNIT[l.product as LeadProduct] ?? '3D Digital') as LeadBusinessUnit,
  module: l.module ?? undefined,
  painPoint: l.pain_point ?? undefined,
  nextAction: l.next_action ?? undefined,
  clientStage: l.client_stage ?? undefined,
  followUpDate: l.follow_up_date ?? undefined,
  paymentStatus: (l.payment_status ?? 'Em dia') as PaymentStatus,
  createdAt: l.created_at,
})

const toDbPayload = (lead: Partial<Lead>) => ({
  ...(lead.name !== undefined && { name: lead.name }),
  ...(lead.email !== undefined && { email: lead.email }),
  ...(lead.whatsapp !== undefined && { whatsapp: lead.whatsapp }),
  ...(lead.source !== undefined && { source: lead.source }),
  ...(lead.status !== undefined && { status: lead.status }),
  ...(lead.value !== undefined && { value: lead.value }),
  ...(lead.product !== undefined && { product: lead.product }),
  ...(lead.businessUnit !== undefined && { business_unit: lead.businessUnit }),
  ...(lead.module !== undefined && { module: lead.module }),
  ...(lead.painPoint !== undefined && { pain_point: lead.painPoint }),
  ...(lead.nextAction !== undefined && { next_action: lead.nextAction }),
  ...(lead.clientStage !== undefined && { client_stage: lead.clientStage }),
  ...(lead.followUpDate !== undefined && { follow_up_date: lead.followUpDate }),
  ...(lead.paymentStatus !== undefined && { payment_status: lead.paymentStatus }),
})

export const leadsService = {
  async getAll(): Promise<ServiceResult<Lead[]>> {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    if (error) return { data: null, error: error.message }
    return { data: (data ?? []).map(toLead), error: null }
  },

  async getById(id: string): Promise<ServiceResult<Lead>> {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return { data: null, error: error.message }
    return { data: toLoad(data), error: null }
  },

  async create(lead: Omit<Lead, 'id' | 'createdAt'>): Promise<ServiceResult<Lead>> {
    const businessUnit = lead.businessUnit ?? PRODUCT_BUSINESS_UNIT[lead.product] ?? '3D Digital'
    const payload = {
      ...toDbPayload({ ...lead, businessUnit }),
      created_at: new Date().toISOString(),
    }
    const { data, error } = await supabase
      .from('leads')
      .insert(payload)
      .select()
      .single()
    if (error) return { data: null, error: error.message }
    return { data: toLead(data), error: null }
  },

  async update(id: string, updates: Partial<Lead>): Promise<ServiceResult<Lead>> {
    const payload = toDbPayload(updates)
    const { data, error } = await supabase
      .from('leads')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) return { data: null, error: error.message }
    return { data: toLead(data), error: null }
  },

  async delete(id: string): Promise<ServiceResult<null>> {
    const { error } = await supabase
      .from('leads')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
    return { data: null, error: error?.message ?? null }
  },
}

// alias interno
const toLoad = toLead
