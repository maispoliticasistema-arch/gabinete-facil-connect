import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HourlyMetric {
  hour_timestamp: string;
  avg_response_time_ms: number;
  total_requests: number;
  error_count: number;
  slow_query_count: number;
}

export function PerformanceCharts() {
  const [hourlyData, setHourlyData] = useState<HourlyMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHourlyMetrics();
  }, []);

  async function loadHourlyMetrics() {
    try {
      const { data, error } = await supabase
        .from('system_metrics_hourly')
        .select('*')
        .order('hour_timestamp', { ascending: true })
        .limit(24); // Últimas 24 horas

      if (error) throw error;

      setHourlyData(data || []);
    } catch (error) {
      console.error('Erro ao carregar métricas horárias:', error);
    } finally {
      setLoading(false);
    }
  }

  const chartData = hourlyData.map(metric => ({
    time: format(new Date(metric.hour_timestamp), 'HH:mm', { locale: ptBR }),
    latencia: metric.avg_response_time_ms,
    requisicoes: metric.total_requests,
    erros: metric.error_count,
    queriesLentas: metric.slow_query_count
  }));

  if (loading) {
    return (
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Carregando gráficos...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gráficos de Performance</CardTitle>
          <CardDescription>
            Nenhum dado disponível ainda. As métricas são agregadas a cada hora.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {/* Latência ao longo do tempo */}
      <Card>
        <CardHeader>
          <CardTitle>Latência Média (ms)</CardTitle>
          <CardDescription>Tempo médio de resposta por hora - Últimas 24 horas</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorLatencia" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="time" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="latencia" 
                stroke="hsl(var(--primary))" 
                fillOpacity={1} 
                fill="url(#colorLatencia)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Volume de requisições */}
      <Card>
        <CardHeader>
          <CardTitle>Volume de Requisições</CardTitle>
          <CardDescription>Total de requisições por hora</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="time"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="requisicoes" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Erros e Queries Lentas */}
      <Card>
        <CardHeader>
          <CardTitle>Erros e Queries Lentas</CardTitle>
          <CardDescription>Comparativo de problemas detectados</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="time"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="erros" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={2}
                name="Erros"
              />
              <Line 
                type="monotone" 
                dataKey="queriesLentas" 
                stroke="hsl(var(--warning))" 
                strokeWidth={2}
                name="Queries Lentas"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
