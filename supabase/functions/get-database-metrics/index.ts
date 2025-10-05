import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SystemStats {
  cpu_percent: number;
  memory_percent: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar tamanho do banco de dados
    const { data: dbSizeData, error: dbSizeError } = await supabase
      .rpc('get_database_size')
      .single();

    if (dbSizeError) {
      console.error('Erro ao buscar tamanho do banco:', dbSizeError);
    }

    // Buscar conexões ativas
    const { data: connectionsData, error: connectionsError } = await supabase
      .rpc('get_active_connections')
      .single();

    if (connectionsError) {
      console.error('Erro ao buscar conexões ativas:', connectionsError);
    }

    // Buscar taxa de cache
    const { data: cacheData, error: cacheError } = await supabase
      .rpc('get_cache_hit_rate')
      .single();

    if (cacheError) {
      console.error('Erro ao buscar taxa de cache:', cacheError);
    }

    // Buscar estatísticas do sistema
    const { data: systemStatsData, error: systemStatsError } = await supabase
      .rpc('get_system_stats')
      .single();

    if (systemStatsError) {
      console.error('Erro ao buscar estatísticas do sistema:', systemStatsError);
    }

    const systemStats = systemStatsData as SystemStats | null;

    const metrics = {
      databaseSizeBytes: (dbSizeData as number) || 0,
      activeConnections: (connectionsData as number) || 0,
      cacheHitRate: (cacheData as number) || 0,
      cpuPercent: systemStats?.cpu_percent || 0,
      memoryPercent: systemStats?.memory_percent || 0,
      timestamp: new Date().toISOString()
    };

    // Salvar métricas na tabela infrastructure_metrics
    const { error: insertError } = await supabase.from('infrastructure_metrics').insert({
      database_size_bytes: metrics.databaseSizeBytes,
      active_connections: metrics.activeConnections,
      cache_hit_rate: metrics.cacheHitRate,
      cpu_percent: metrics.cpuPercent,
      memory_percent: metrics.memoryPercent
    });

    if (insertError) {
      console.error('Erro ao salvar métricas:', insertError);
    }

    console.log('Métricas coletadas:', metrics);

    return new Response(
      JSON.stringify(metrics),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        databaseSizeBytes: 0,
        activeConnections: 0,
        cacheHitRate: 0,
        cpuPercent: 0,
        memoryPercent: 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
