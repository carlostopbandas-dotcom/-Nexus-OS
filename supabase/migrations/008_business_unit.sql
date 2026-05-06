-- supabase/migrations/008_business_unit.sql
-- Fase 2: Pipeline Multi-Produto — coluna business_unit
-- SEGURO PARA RE-EXECUTAR: usa IF NOT EXISTS

ALTER TABLE leads ADD COLUMN IF NOT EXISTS business_unit text DEFAULT '3D Digital';

-- Garante que leads existentes tenham o valor correto
UPDATE leads SET business_unit = '3D Digital'
WHERE business_unit IS NULL OR business_unit = '';
