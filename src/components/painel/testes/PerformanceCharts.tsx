import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface ChartData {
  timestamp: string;
  latency: number;
  requests: number;
}

export function PerformanceCharts() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChartData = async () => {
      try {
        // Buscar métricas das últimas 24 horas agrupadas por hora
        const umDiaAtras = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        
        const { data: metricsData, error } = await supabase
          .from('performance_metrics')
          .select('created_at, duration_ms')
          .gte('created_at', umDiaAtras)
          .order('created_at', { ascending: true });

        if (error) throw error;

        // Agrupar por hora
        const hourlyData = new Map<string, { latencies: number[], count: number }>();
        
        metricsData?.forEach(metric => {
          const hour = new Date(metric.created_at).toISOString().slice(0, 13) + ':00:00';
          if (!hourlyData.has(hour)) {
            hourlyData.set(hour, { latencies: [], count: 0 });
          }
          const hourData = hourlyData.get(hour)!;
          hourData.latencies.push(metric.duration_ms);
          hourData.count++;
        });

        // Converter para formato de gráfico
        const chartData: ChartData[] = Array.from(hourlyData.entries()).map(([timestamp, data]) => ({
          timestamp: new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          latency: Math.round(data.latencies.reduce((a, b) => a + b, 0) / data.latencies.length),
          requests: data.count
        }));

        setData(chartData.slice(-12)); // Últimas 12 horas
      } catch (error) {
        console.error('Erro ao carregar dados do gráfico:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChartData();
    const interval = setInterval(loadChartData, 60000); // Atualizar a cada minuto

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Latência ao Longo do Tempo</CardTitle>
          <CardDescription>Tempo médio de resposta por hora (últimas 12h)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="timestamp" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                label={{ value: 'Latência (ms)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="latency" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Latência (ms)"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Volume de Requisições</CardTitle>
          <CardDescription>Total de requisições por hora (últimas 12h)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="timestamp" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                label={{ value: 'Requisições', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Bar 
                dataKey="requests" 
                fill="hsl(var(--primary))" 
                name="Requisições"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
