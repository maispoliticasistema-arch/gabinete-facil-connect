# Configuração de Cron Jobs para Monitoramento (OPCIONAL)

O sistema de monitoramento funciona sem cron jobs, mas para melhor performance, é recomendado configurá-los no Supabase.

**IMPORTANTE:** Os gráficos e métricas funcionam mesmo sem os cron jobs! O sistema agrega os dados em tempo real quando necessário. Os cron jobs apenas otimizam o desempenho pré-agregando os dados.

## 1. Habilitar extensões necessárias

Execute este SQL no Supabase SQL Editor:

```sql
-- Habilitar pg_cron para jobs agendados
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Habilitar pg_net para chamadas HTTP (se necessário no futuro)
CREATE EXTENSION IF NOT EXISTS pg_net;
```

## 2. Criar job para agregar métricas horárias

Este job roda 5 minutos após cada hora para agregar as métricas da hora anterior:

```sql
SELECT cron.schedule(
  'aggregate-hourly-metrics',
  '5 * * * *', -- A cada hora aos 5 minutos (00:05, 01:05, etc.)
  $$
    SELECT public.aggregate_hourly_metrics();
  $$
);
```

## 3. Criar job para verificar e criar alertas

Este job roda a cada 5 minutos para verificar condições de alerta:

```sql
SELECT cron.schedule(
  'check-system-alerts',
  '*/5 * * * *', -- A cada 5 minutos
  $$
    SELECT public.check_and_create_alerts();
  $$
);
```

## 4. Criar job para limpar dados antigos (opcional)

Este job roda todo dia à meia-noite para limpar métricas antigas:

```sql
SELECT cron.schedule(
  'cleanup-old-metrics',
  '0 0 * * *', -- Todos os dias à meia-noite
  $$
    -- Limpar métricas de performance > 30 dias
    DELETE FROM public.performance_metrics
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Limpar queries lentas resolvidas > 90 dias
    DELETE FROM public.slow_queries
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Limpar erros do sistema resolvidos > 90 dias
    DELETE FROM public.system_errors
    WHERE created_at < NOW() - INTERVAL '90 days'
      AND resolved = true;
      
    -- Limpar alertas resolvidos > 30 dias
    DELETE FROM public.system_alerts
    WHERE created_at < NOW() - INTERVAL '30 days'
      AND resolved = true;
  $$
);
```

## 5. Verificar jobs ativos

Para ver todos os jobs agendados:

```sql
SELECT * FROM cron.job;
```

## 6. Remover um job (se necessário)

```sql
SELECT cron.unschedule('aggregate-hourly-metrics');
```

## Sintaxe do Cron

O formato é: `minuto hora dia mês dia_da_semana`

Exemplos:
- `*/5 * * * *` - A cada 5 minutos
- `0 * * * *` - A cada hora (no minuto 0)
- `0 0 * * *` - Todo dia à meia-noite
- `0 */6 * * *` - A cada 6 horas
- `0 0 * * 0` - Todo domingo à meia-noite

## Monitoramento dos Jobs

Para ver o histórico de execução:

```sql
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'aggregate-hourly-metrics')
ORDER BY runid DESC
LIMIT 10;
```

## Troubleshooting

### Job não está rodando?

1. Verifique se a extensão pg_cron está habilitada:
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

2. Verifique logs de erro:
```sql
SELECT * FROM cron.job_run_details
WHERE status = 'failed'
ORDER BY runid DESC;
```

3. Teste a função manualmente:
```sql
SELECT public.aggregate_hourly_metrics();
SELECT public.check_and_create_alerts();
```

### Permissões

As funções já são `SECURITY DEFINER` e têm `search_path` definido, então não devem ter problemas de permissão.

## Importante

- Os jobs rodam no timezone do servidor Supabase (geralmente UTC)
- As funções são idempotentes (podem rodar múltiplas vezes sem problema)
- Os alertas têm lógica para não duplicar (ON CONFLICT DO NOTHING)
- As métricas horárias usam UPSERT (ON CONFLICT DO UPDATE)
