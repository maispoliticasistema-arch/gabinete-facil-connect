import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface SlowQuery {
  id: string;
  query_text: string;
  duration_ms: number;
  table_name: string | null;
  created_at: string;
}

export function SlowQueriesView() {
  const [queries, setQueries] = useState<SlowQuery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSlowQueries = async () => {
      try {
        const { data, error } = await supabase
          .from('slow_queries')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setQueries(data || []);
      } catch (error) {
        console.error('Erro ao carregar queries lentas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSlowQueries();
    const interval = setInterval(loadSlowQueries, 30000); // Atualizar a cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (duration: number) => {
    if (duration > 5000) return 'destructive';
    if (duration > 2000) return 'default';
    return 'secondary';
  };

  const truncateQuery = (query: string, maxLength: number = 150) => {
    if (query.length <= maxLength) return query;
    return query.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Queries Lentas (Slow Queries)
        </CardTitle>
        <CardDescription>
          Consultas ao banco que levaram mais de 1 segundo para executar
        </CardDescription>
      </CardHeader>
      <CardContent>
        {queries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma query lenta detectada recentemente</p>
            <p className="text-sm">Todas as consultas estão performando bem! 🎉</p>
          </div>
        ) : (
          <div className="space-y-3">
            {queries.map((query) => (
              <div
                key={query.id}
                className="p-4 border rounded-lg space-y-2 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      {query.table_name && (
                        <Badge variant="outline" className="font-mono text-xs">
                          {query.table_name}
                        </Badge>
                      )}
                      <Badge variant={getSeverityColor(query.duration_ms)}>
                        {query.duration_ms.toFixed(0)}ms
                      </Badge>
                    </div>
                    <code className="text-xs block bg-muted p-2 rounded overflow-x-auto">
                      {truncateQuery(query.query_text)}
                    </code>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(query.created_at).toLocaleString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
