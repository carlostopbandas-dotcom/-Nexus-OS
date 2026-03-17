# Nexus OS — Migrations

## Convenção de Naming

```
NNN_descricao-kebab-case.sql
```

Exemplos:
- `001_initial_schema.sql`
- `002_security_foundation.sql`
- `003_schema_hardening.sql`
- `004_performance_indexes.sql`

## Como executar

### Via Supabase CLI
```bash
supabase db push
```

### Via Dashboard
SQL Editor → colar o conteúdo do arquivo → Run

## Próximas migrations

| Arquivo | Sprint | Descrição |
|---------|--------|-----------|
| `001_initial_schema.sql` | Sprint 0 | Captura do schema atual (baseline) |
| `002_security_foundation.sql` | Sprint 1 | RLS + policies (depende de Auth implementado) |
| `003_schema_hardening.sql` | Sprint 2 | updated_at, FKs, CHECK constraints |
| `004_performance_indexes.sql` | Sprint 3 | Índices para access patterns |
