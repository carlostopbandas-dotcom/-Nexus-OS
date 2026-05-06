-- supabase/migrations/007_negocio_solido_crm.sql
-- Programa Negócio Sólido — campos adicionais no CRM
-- SEGURO PARA RE-EXECUTAR: usa IF NOT EXISTS em todos os DDL

-- 1. Novos campos na tabela leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS whatsapp       text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS module         text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pain_point     text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_action    text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS client_stage   text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS follow_up_date date;

-- 2. Novo valor no enum de status (se existir como enum no DB)
-- Se status for text, ignorar. Se for enum:
-- ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'Em Negociação';

-- 3. Novo valor no enum de produto (se existir como enum no DB)
-- Se product for text, ignorar. Se for enum:
-- ALTER TYPE lead_product ADD VALUE IF NOT EXISTS 'Negócio Sólido';

-- 4. Novo valor no enum de origem
-- ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'Network';

-- NOTA: Se status/product/source forem colunas text (não enum),
-- os novos valores são aceitos automaticamente sem DDL adicional.
-- Verificar com: SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name = 'leads';
