import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { LoadTestSimulator } from './testes/LoadTestSimulator';
import { PerformanceCharts } from './testes/PerformanceCharts';
import { SlowQueriesView } from './testes/SlowQueriesView';
import { ErrorsSheet } from './testes/ErrorsSheet';
import { Activity, BarChart3, AlertCircle, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface QuickMetrics {
  avgLatency: number;
  totalRequests24h: number;
  errorRate: number;
  slowQueriesCount: number;
}

interface ErrorEntry {
  id: string;
  created_at: string;
  endpoint: string | null;
  status_code: number | null;
  duration_ms: number;
  metadata: any;
}

export function TestesPerformanceSection() {
  const [metrics, setMetrics] = useState<QuickMetrics>({
    avgLatency: 0,
    totalRequests24h: 0,
    errorRate: 0,
    slowQueriesCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [errorsSheetOpen, setErrorsSheetOpen] = useState(false);
  const [errors, setErrors] = useState<ErrorEntry[]>([]);

  useEffect(() => {
    const loadQuickMetrics = async () => {
      try {
        const umDiaAtras = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        // Métricas das últimas 24h
        const { data: metricsData } = await supabase
          .from('performance_metrics')
          .select('duration_ms, status_code')
          .gte('created_at', umDiaAtras);

        // Slow queries das últimas 24h
        const { count: slowQueriesCount } = await supabase
          .from('slow_queries')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', umDiaAtras);

        // Buscar erros para o sheet
        const { data: errorsData } = await supabase
          .from('performance_metrics')
          .select('id, created_at, endpoint, status_code, duration_ms, metadata')
          .gte('created_at', umDiaAtras)
          .or('status_code.gte.400,status_code.eq.0')
          .order('created_at', { ascending: false })
          .limit(100);

        if (errorsData) {
          setErrors(errorsData);
        }

        if (metricsData && metricsData.length > 0) {
          const avgLatency = Math.round(
            metricsData.reduce((acc, curr) => acc + curr.duration_ms, 0) / metricsData.length
          );

          const errorRequests = metricsData.filter(
            m => m.status_code && (m.status_code >= 400 || m.status_code === 0)
          ).length;

          const errorRate = (errorRequests / metricsData.length) * 100;

          setMetrics({
            avgLatency,
            totalRequests24h: metricsData.length,
            errorRate: Math.round(errorRate * 10) / 10,
            slowQueriesCount: slowQueriesCount || 0
          });
        }
      } catch (error) {
        console.error('Erro ao carregar métricas rápidas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadQuickMetrics();
    const interval = setInterval(loadQuickMetrics, 60000); // Atualizar a cada minuto

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Testes & Performance</h2>
        <p className="text-muted-foreground">
          Execute testes de carga e monitore a performance em tempo real
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Dica:</strong> Para testes de carga mais robustos e detalhados, utilize o{' '}
          <a 
            href="https://docs.locust.io/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline font-medium hover:text-primary inline-flex items-center gap-1"
          >
            Locust <ExternalLink className="h-3 w-3" />
          </a>
          {' '}configurado no arquivo <code className="bg-muted px-1 rounded">locustfile.py</code> do projeto.
        </AlertDescription>
      </Alert>

      {/* Métricas Rápidas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latência Média 24h</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgLatency}ms</div>
            <p className="text-xs text-muted-foreground">
              {metrics.avgLatency < 500 ? 'Excelente' : metrics.avgLatency < 1000 ? 'Boa' : 'Melhorar'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requisições 24h</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalRequests24h.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Média de {Math.round(metrics.totalRequests24h / 24)}/hora
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => setErrorsSheetOpen(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Erro</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.errorRate > 5 ? 'text-destructive' : ''}`}>
              {metrics.errorRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.errorRate < 1 ? 'Excelente' : metrics.errorRate < 5 ? 'Aceitável' : 'Crítico'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queries Lentas 24h</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.slowQueriesCount > 10 ? 'text-orange-500' : ''}`}>
              {metrics.slowQueriesCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.slowQueriesCount === 0 ? 'Perfeito' : metrics.slowQueriesCount < 10 ? 'Normal' : 'Atenção'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Simulador de Testes */}
      <LoadTestSimulator />

      {/* Gráficos de Performance */}
      <PerformanceCharts />

      {/* Slow Queries */}
      <SlowQueriesView />

      {/* Documentação Locust */}
      <Card>
        <CardHeader>
          <CardTitle>Testes com Locust (Recomendado para Produção)</CardTitle>
          <CardDescription>
            Para testes mais avançados e realistas, utilize o Locust
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            O Locust é uma ferramenta profissional de teste de carga que permite simular
            milhares de usuários simultâneos com cenários personalizados.
          </p>
          
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium">Como usar:</p>
            <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
              <li>Conecte o projeto ao GitHub</li>
              <li>Clone o repositório localmente ou use GitHub Codespaces</li>
              <li>Execute: <code className="bg-background px-2 py-1 rounded">pip install -r requirements.txt</code></li>
              <li>Execute: <code className="bg-background px-2 py-1 rounded">locust -f locustfile.py</code></li>
              <li>Acesse: <code className="bg-background px-2 py-1 rounded">http://localhost:8089</code></li>
            </ol>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <a href="https://docs.locust.io/" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Documentação Locust
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Conectar GitHub
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <ErrorsSheet 
        open={errorsSheetOpen}
        onOpenChange={setErrorsSheetOpen}
        errors={errors}
      />
    </div>
  );
}
