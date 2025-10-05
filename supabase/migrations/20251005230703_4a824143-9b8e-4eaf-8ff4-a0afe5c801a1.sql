-- Criar tabela para métricas de infraestrutura
CREATE TABLE IF NOT EXISTS public.infrastructure_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cpu_percent NUMERIC,
  memory_percent NUMERIC,
  disk_usage_percent NUMERIC,
  active_connections INTEGER,
  cache_hit_rate NUMERIC,
  database_size_bytes BIGINT,
  queries_per_second NUMERIC
);

-- Habilitar RLS
ALTER TABLE public.infrastructure_metrics ENABLE ROW LEVEL SECURITY;

-- Superowners podem ver métricas de infraestrutura
CREATE POLICY "Superowners podem ver métricas de infraestrutura"
  ON public.infrastructure_metrics
  FOR SELECT
  USING (has_system_role(auth.uid(), 'superowner'));

-- Sistema pode inserir métricas
CREATE POLICY "Sistema pode inserir métricas de infraestrutura"
  ON public.infrastructure_metrics
  FOR INSERT
  WITH CHECK (true);

-- Criar índice para consultas por data
CREATE INDEX idx_infrastructure_metrics_created_at 
  ON public.infrastructure_metrics(created_at DESC);

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.infrastructure_metrics;