-- supabase/migrations/009_payment_status.sql
-- Fase 3: Clientes Ativos — coluna payment_status
-- SEGURO PARA RE-EXECUTAR: usa IF NOT EXISTS

ALTER TABLE leads ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'Em dia';

UPDATE leads SET payment_status = 'Em dia'
WHERE payment_status IS NULL OR payment_status = '';
