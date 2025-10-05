import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Zap, Database, AlertTriangle, Clock, TrendingUp } from 'lucide-react';

interface MetricasAoVivo {
  avgLatency: number;
  requestsPerMinute: number;
  errorRate: number;
  slowQueryCount: number;
  activeConnections: number;
  cacheHitRate: number;
}

export function MetricasEmTempoReal() {
  const [metricas, setMetricas] = useState<MetricasAoVivo>({
    avgLatency: 0,
    requestsPerMinute: 0,
    errorRate: 0,
    slowQueryCount: 0,
    activeConnections: 0,
    cacheHitRate: 94
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();

    // Atualiza a cada 10 segundos
    const interval = setInterval(loadMetrics, 10000);

    // Real-time para novas métricas
    const channel = supabase
      .channel('metrics-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'performance_metrics'
        },
        () => {
          loadMetrics();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadMetrics() {
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      // Latência média
      const { data: latencyData } = await supabase
        .from('performance_metrics')
        .select('duration_ms')
        .gte('created_at', fiveMinutesAgo.toISOString());

      const avgLatency = latencyData && latencyData.length > 0
        ? Math.round(latencyData.reduce((sum, m) => sum + m.duration_ms, 0) / latencyData.length)
        : 0;

      // Requisições por minuto
      const requestsPerMinute = latencyData ? Math.round(latencyData.length / 5) : 0;

      // Taxa de erro
      const { data: errorData } = await supabase
        .from('performance_metrics')
        .select('status_code')
        .gte('created_at', fiveMinutesAgo.toISOString())
        .gte('status_code', 400);

      const errorRate = latencyData && latencyData.length > 0
        ? Math.round((errorData?.length || 0) / latencyData.length * 100)
        : 0;

      // Queries lentas
      const { count: slowQueryCount } = await supabase
        .from('slow_queries')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', fiveMinutesAgo.toISOString());

      // Buscar métricas de infraestrutura via edge function
      const { data: infraData } = await supabase.functions.invoke('get-database-metrics');

      setMetricas({
        avgLatency,
        requestsPerMinute,
        errorRate,
        slowQueryCount: slowQueryCount || 0,
        activeConnections: infraData?.activeConnections || 0,
        cacheHitRate: infraData?.cacheHitRate || 0
      });
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
    } finally {
      setLoading(false);
    }
  }

  const cards = [
    {
      title: 'Latência Média',
      value: `${metricas.avgLatency}ms`,
      icon: Zap,
      description: 'Últimos 5 minutos',
      color: metricas.avgLatency > 1000 ? 'text-destructive' : 'text-green-500'
    },
    {
      title: 'Req/Minuto',
      value: metricas.requestsPerMinute,
      icon: Activity,
      description: 'Requisições por minuto',
      color: 'text-primary'
    },
    {
      title: 'Taxa de Erro',
      value: `${metricas.errorRate}%`,
      icon: AlertTriangle,
      description: 'Últimos 5 minutos',
      color: metricas.errorRate > 5 ? 'text-destructive' : 'text-green-500'
    },
    {
      title: 'Queries Lentas',
      value: metricas.slowQueryCount,
      icon: Database,
      description: 'Últimos 5 minutos',
      color: metricas.slowQueryCount > 5 ? 'text-orange-500' : 'text-green-500'
    },
    {
      title: 'Conexões Ativas',
      value: metricas.activeConnections,
      icon: Clock,
      description: 'Pool de conexões',
      color: 'text-blue-500'
    },
    {
      title: 'Cache Hit Rate',
      value: `${metricas.cacheHitRate}%`,
      icon: TrendingUp,
      description: 'Eficiência do cache',
      color: metricas.cacheHitRate > 80 ? 'text-green-500' : 'text-orange-500'
    }
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Carregando...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Atualizado a cada 10 segundos • Última atualização: {new Date().toLocaleTimeString()}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${card.color}`}>
                  {card.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
