-- supabase/migrations/011_financial_entries.sql
-- Story 2.4 — Dashboard Financeiro
-- Foundation table para lançamentos financeiros manuais (CMV, despesas, receitas)
-- CRUD via Story 2.5 (VcChic) e Story 2.8 (3D Digital)

CREATE TABLE IF NOT EXISTS financial_entries (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_unit text NOT NULL CHECK (business_unit IN (
    'vcchic', 'moriel', 'sezo',
    '3d_cend', '3d_marketing', '3d_producao', '3d_inovacao', '3d_negocios', '3d_csc'
  )),
  entry_type    text NOT NULL CHECK (entry_type IN ('revenue', 'expense', 'cmv')),
  category      text,
  amount        numeric(12, 2) NOT NULL,
  description   text,
  entry_date    date NOT NULL,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_financial_entries_unit_date
  ON financial_entries (business_unit, entry_date);

ALTER TABLE financial_entries ENABLE ROW LEVEL SECURITY;

-- CEO: acesso total
DROP POLICY IF EXISTS "ceo_all_financial_entries" ON financial_entries;
CREATE POLICY "ceo_all_financial_entries" ON financial_entries
  FOR ALL
  USING (get_my_role() = 'ceo')
  WITH CHECK (get_my_role() = 'ceo');

-- gestor_vcchic: apenas leitura nas unidades de loja (não acessa divisões 3D)
DROP POLICY IF EXISTS "gestor_vcchic_select_financial_entries" ON financial_entries;
CREATE POLICY "gestor_vcchic_select_financial_entries" ON financial_entries
  FOR SELECT
  USING (
    get_my_role() = 'gestor_vcchic'
    AND business_unit IN ('vcchic', 'moriel', 'sezo')
  );

-- Rollback:
-- DROP TABLE IF EXISTS financial_entries CASCADE;
