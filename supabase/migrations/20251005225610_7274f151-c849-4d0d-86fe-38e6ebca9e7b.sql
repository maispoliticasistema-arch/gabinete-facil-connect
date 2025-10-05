-- Tabela de métricas de performance
CREATE TABLE public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metric_type TEXT NOT NULL CHECK (metric_type IN ('api_request', 'db_query', 'page_load', 'error_rate')),
  endpoint TEXT,
  duration_ms INTEGER NOT NULL,
  status_code INTEGER,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  gabinete_id UUID REFERENCES gabinetes(id) ON DELETE SET NULL,
  metadata JSONB,
  is_slow BOOLEAN GENERATED ALWAYS AS (duration_ms > 1000) STORED
);

-- Tabela de queries lentas do banco
CREATE TABLE public.slow_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  query_text TEXT NOT NULL,
  duration_ms NUMERIC NOT NULL,
  table_name TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  gabinete_id UUID REFERENCES gabinetes(id) ON DELETE SET NULL,
  context JSONB
);

-- Tabela de métricas agregadas por hora
CREATE TABLE public.system_metrics_hourly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hour_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  avg_response_time_ms INTEGER NOT NULL,
  total_requests INTEGER NOT NULL,
  error_count INTEGER NOT NULL,
  slow_query_count INTEGER NOT NULL,
  active_users INTEGER NOT NULL,
  active_gabinetes INTEGER NOT NULL,
  cpu_usage_percent INTEGER,
  memory_usage_percent INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(hour_timestamp)
);

-- Tabela de alertas do sistema
CREATE TABLE public.system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('high_latency', 'error_spike', 'slow_queries', 'high_cpu', 'high_memory', 'service_down')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metric_value NUMERIC,
  threshold_value NUMERIC,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  auto_resolved BOOLEAN DEFAULT false
);

-- Índices para performance
CREATE INDEX idx_performance_metrics_created_at ON public.performance_metrics(created_at DESC);
CREATE INDEX idx_performance_metrics_type ON public.performance_metrics(metric_type);
CREATE INDEX idx_performance_metrics_slow ON public.performance_metrics(is_slow) WHERE is_slow = true;
CREATE INDEX idx_slow_queries_created_at ON public.slow_queries(created_at DESC);
CREATE INDEX idx_system_alerts_resolved ON public.system_alerts(resolved) WHERE resolved = false;

-- Habilitar RLS
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slow_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_metrics_hourly ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

-- Políticas: qualquer um autenticado pode inserir métricas
CREATE POLICY "Usuários podem inserir métricas"
ON public.performance_metrics
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuários podem inserir slow queries"
ON public.slow_queries
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Políticas: apenas superowners podem ver métricas
CREATE POLICY "Superowners podem ver métricas"
ON public.performance_metrics
FOR SELECT
USING (has_system_role(auth.uid(), 'superowner'));

CREATE POLICY "Superowners podem ver slow queries"
ON public.slow_queries
FOR SELECT
USING (has_system_role(auth.uid(), 'superowner'));

CREATE POLICY "Superowners podem ver métricas agregadas"
ON public.system_metrics_hourly
FOR ALL
USING (has_system_role(auth.uid(), 'superowner'))
WITH CHECK (has_system_role(auth.uid(), 'superowner'));

CREATE POLICY "Superowners podem ver alertas"
ON public.system_alerts
FOR SELECT
USING (has_system_role(auth.uid(), 'superowner'));

CREATE POLICY "Superowners podem atualizar alertas"
ON public.system_alerts
FOR UPDATE
USING (has_system_role(auth.uid(), 'superowner'))
WITH CHECK (has_system_role(auth.uid(), 'superowner'));

-- Função para agregar métricas por hora
CREATE OR REPLACE FUNCTION public.aggregate_hourly_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_hour TIMESTAMP WITH TIME ZONE;
BEGIN
  current_hour := date_trunc('hour', NOW() - INTERVAL '1 hour');
  
  INSERT INTO system_metrics_hourly (
    hour_timestamp,
    avg_response_time_ms,
    total_requests,
    error_count,
    slow_query_count,
    active_users,
    active_gabinetes
  )
  SELECT
    current_hour,
    COALESCE(AVG(pm.duration_ms)::INTEGER, 0),
    COALESCE(COUNT(pm.id), 0),
    COALESCE(COUNT(*) FILTER (WHERE pm.status_code >= 400), 0),
    COALESCE((SELECT COUNT(*) FROM slow_queries WHERE created_at >= current_hour AND created_at < current_hour + INTERVAL '1 hour'), 0),
    COALESCE((SELECT COUNT(DISTINCT user_id) FROM audit_logs WHERE created_at >= current_hour AND created_at < current_hour + INTERVAL '1 hour'), 0),
    COALESCE((SELECT COUNT(DISTINCT gabinete_id) FROM audit_logs WHERE created_at >= current_hour AND created_at < current_hour + INTERVAL '1 hour'), 0)
  FROM performance_metrics pm
  WHERE pm.created_at >= current_hour
    AND pm.created_at < current_hour + INTERVAL '1 hour'
  ON CONFLICT (hour_timestamp) DO UPDATE SET
    avg_response_time_ms = EXCLUDED.avg_response_time_ms,
    total_requests = EXCLUDED.total_requests,
    error_count = EXCLUDED.error_count,
    slow_query_count = EXCLUDED.slow_query_count,
    active_users = EXCLUDED.active_users,
    active_gabinetes = EXCLUDED.active_gabinetes;
END;
$$;

-- Função para criar alertas automáticos
CREATE OR REPLACE FUNCTION public.check_and_create_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  avg_latency INTEGER;
  error_rate NUMERIC;
  slow_query_count INTEGER;
BEGIN
  -- Verificar latência média das últimas 5 minutos
  SELECT AVG(duration_ms)::INTEGER INTO avg_latency
  FROM performance_metrics
  WHERE created_at >= NOW() - INTERVAL '5 minutes';
  
  IF avg_latency > 1000 THEN
    INSERT INTO system_alerts (alert_type, severity, title, message, metric_value, threshold_value)
    VALUES (
      'high_latency',
      CASE WHEN avg_latency > 3000 THEN 'critical' ELSE 'warning' END,
      'Alta Latência Detectada',
      'Tempo médio de resposta está em ' || avg_latency || 'ms',
      avg_latency,
      1000
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Verificar taxa de erro
  SELECT 
    (COUNT(*) FILTER (WHERE status_code >= 400)::NUMERIC / NULLIF(COUNT(*), 0) * 100)
  INTO error_rate
  FROM performance_metrics
  WHERE created_at >= NOW() - INTERVAL '5 minutes';
  
  IF error_rate > 10 THEN
    INSERT INTO system_alerts (alert_type, severity, title, message, metric_value, threshold_value)
    VALUES (
      'error_spike',
      CASE WHEN error_rate > 25 THEN 'critical' ELSE 'warning' END,
      'Pico de Erros Detectado',
      'Taxa de erro está em ' || ROUND(error_rate, 2) || '%',
      error_rate,
      10
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Verificar queries lentas
  SELECT COUNT(*) INTO slow_query_count
  FROM slow_queries
  WHERE created_at >= NOW() - INTERVAL '15 minutes';
  
  IF slow_query_count > 10 THEN
    INSERT INTO system_alerts (alert_type, severity, title, message, metric_value, threshold_value)
    VALUES (
      'slow_queries',
      'warning',
      'Múltiplas Queries Lentas',
      slow_query_count || ' queries lentas detectadas nos últimos 15 minutos',
      slow_query_count,
      10
    )
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;