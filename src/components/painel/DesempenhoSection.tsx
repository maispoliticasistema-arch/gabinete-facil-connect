import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Database, Zap, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DesempenhoMetrics {
  qps: number;
  latenciaMedia: number;
  taxaCache: number;
  usoBanco: number;
  cpuPercent: number;
  memoryPercent: number;
  conexoesAtivas: number;
}

export function DesempenhoSection() {
  const [metrics, setMetrics] = useState<DesempenhoMetrics>({
    qps: 0,
    latenciaMedia: 0,
    taxaCache: 0,
    usoBanco: 0,
    cpuPercent: 0,
    memoryPercent: 0,
    conexoesAtivas: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        // Buscar métricas de infraestrutura via edge function
        const { data: infraData } = await supabase.functions.invoke('get-database-metrics');

        // Calcular QPS dos últimos 60 segundos
        const umMinutoAtras = new Date(Date.now() - 60000).toISOString();
        const { count: requestsLastMinute } = await supabase
          .from('performance_metrics')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', umMinutoAtras);

        const qps = Math.round((requestsLastMinute || 0) / 60);

        // Calcular latência média dos últimos 5 minutos
        const cincoMinutosAtras = new Date(Date.now() - 300000).toISOString();
        const { data: latencyData } = await supabase
          .from('performance_metrics')
          .select('duration_ms')
          .gte('created_at', cincoMinutosAtras);

        const latenciaMedia = latencyData && latencyData.length > 0
          ? Math.round(latencyData.reduce((acc, curr) => acc + curr.duration_ms, 0) / latencyData.length)
          : 0;

        // Calcular uso do banco (0-100%)
        const dbSizeBytes = infraData?.databaseSizeBytes || 0;
        const maxDbSize = 10 * 1024 ** 3; // 10 GB como exemplo
        const usoBanco = Math.round((dbSizeBytes / maxDbSize) * 100);

        setMetrics({
          qps,
          latenciaMedia,
          taxaCache: infraData?.cacheHitRate || 0,
          usoBanco: Math.min(usoBanco, 100),
          cpuPercent: infraData?.cpuPercent || 0,
          memoryPercent: infraData?.memoryPercent || 0,
          conexoesAtivas: infraData?.activeConnections || 0
        });
      } catch (error) {
        console.error('Erro ao carregar métricas de desempenho:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Atualizar a cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-1/3" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultas/Segundo</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">~{metrics.qps} QPS</div>
            <p className="text-xs text-muted-foreground">
              Média de consultas ao banco
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latência Média</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.latenciaMedia}ms</div>
            <p className="text-xs text-muted-foreground">
              Tempo médio de resposta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Cache</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.taxaCache.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Cache hits vs misses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uso do Banco</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.usoBanco}%</div>
            <p className="text-xs text-muted-foreground">
              Capacidade utilizada
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Métricas Técnicas</CardTitle>
          <CardDescription>
            Monitoramento de performance e infraestrutura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">CPU Supabase</span>
                <span className="text-sm text-muted-foreground">{metrics.cpuPercent}%</span>
              </div>
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full" style={{ width: `${metrics.cpuPercent}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Memória</span>
                <span className="text-sm text-muted-foreground">{metrics.memoryPercent}%</span>
              </div>
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full" style={{ width: `${metrics.memoryPercent}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Conexões Ativas</span>
                <span className="text-sm text-muted-foreground">{metrics.conexoesAtivas}/100</span>
              </div>
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full" style={{ width: `${metrics.conexoesAtivas}%` }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
