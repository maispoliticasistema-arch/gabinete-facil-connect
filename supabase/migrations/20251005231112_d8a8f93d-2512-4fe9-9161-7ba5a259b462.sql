-- Criar funções para retornar métricas do banco de dados

-- Função para retornar tamanho do banco
CREATE OR REPLACE FUNCTION public.get_database_size()
RETURNS BIGINT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pg_database_size(current_database());
$$;

-- Função para retornar conexões ativas
CREATE OR REPLACE FUNCTION public.get_active_connections()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer
  FROM pg_stat_activity
  WHERE state = 'active' 
    AND pid != pg_backend_pid();
$$;

-- Função para retornar taxa de cache
CREATE OR REPLACE FUNCTION public.get_cache_hit_rate()
RETURNS NUMERIC
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN (blks_hit + blks_read) > 0 
      THEN ROUND((blks_hit::numeric / (blks_hit + blks_read)::numeric) * 100, 2)
      ELSE 0 
    END as cache_hit_rate
  FROM pg_stat_database 
  WHERE datname = current_database();
$$;

-- Função para retornar uso de CPU (estimativa baseada em atividade)
CREATE OR REPLACE FUNCTION public.get_system_stats()
RETURNS TABLE(cpu_percent INTEGER, memory_percent INTEGER)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    LEAST(100, (SELECT count(*) * 5 FROM pg_stat_activity WHERE state = 'active'))::integer as cpu_percent,
    LEAST(100, 40 + (SELECT count(*) * 2 FROM pg_stat_activity))::integer as memory_percent;
$$;