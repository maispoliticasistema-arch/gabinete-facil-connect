import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, Database } from 'lucide-react';

interface SlowQuery {
  id: string;
  created_at: string;
  query_text: string;
  duration_ms: number;
  table_name: string | null;
  user_nome: string;
  gabinete_nome: string;
}

export function SlowQueriesTable() {
  const [queries, setQueries] = useState<SlowQuery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSlowQueries();

    // Real-time
    const channel = supabase
      .channel('slow-queries-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'slow_queries'
        },
        () => {
          loadSlowQueries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadSlowQueries() {
    try {
      const { data, error } = await supabase
        .from('slow_queries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Buscar nomes
      const queriesComNomes = await Promise.all(
        (data || []).map(async (query: any) => {
          const [userResult, gabResult] = await Promise.all([
            query.user_id ? supabase
              .from('profiles')
              .select('nome_completo')
              .eq('id', query.user_id)
              .single() : Promise.resolve({ data: null }),
            query.gabinete_id ? supabase
              .from('gabinetes')
              .select('nome')
              .eq('id', query.gabinete_id)
              .single() : Promise.resolve({ data: null })
          ]);

          return {
            ...query,
            user_nome: userResult.data?.nome_completo || 'Sistema',
            gabinete_nome: gabResult.data?.nome || '-'
          };
        })
      );

      setQueries(queriesComNomes);
    } catch (error) {
      console.error('Erro ao carregar queries lentas:', error);
    } finally {
      setLoading(false);
    }
  }

  const getSeverityBadge = (durationMs: number) => {
    if (durationMs > 5000) {
      return <Badge variant="destructive">Crítico ({durationMs}ms)</Badge>;
    } else if (durationMs > 2000) {
      return <Badge variant="secondary">Alerta ({durationMs}ms)</Badge>;
    }
    return <Badge variant="outline">Lento ({durationMs}ms)</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Queries Lentas</CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (queries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Queries Lentas</CardTitle>
          <CardDescription>
            Nenhuma query lenta detectada (&gt; 1000ms)
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Database className="h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Sistema operando normalmente</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <div>
            <CardTitle>Queries Lentas Detectadas</CardTitle>
            <CardDescription>
              Últimas 50 queries com tempo de execução acima de 1 segundo
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Query</TableHead>
              <TableHead>Tabela</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Gabinete</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queries.map((query) => (
              <TableRow key={query.id}>
                <TableCell className="text-sm">
                  {format(new Date(query.created_at), 'dd/MM HH:mm:ss', { locale: ptBR })}
                </TableCell>
                <TableCell className="max-w-xs truncate font-mono text-xs">
                  {query.query_text}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{query.table_name || 'N/A'}</Badge>
                </TableCell>
                <TableCell>
                  {getSeverityBadge(query.duration_ms)}
                </TableCell>
                <TableCell className="text-sm">{query.user_nome}</TableCell>
                <TableCell className="text-sm">{query.gabinete_nome}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
