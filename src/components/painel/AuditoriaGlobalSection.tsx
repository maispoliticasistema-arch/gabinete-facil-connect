import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AuditLog {
  id: string;
  created_at: string;
  action: string;
  entity_type: string;
  user_nome: string;
  gabinete_nome: string;
}

export function AuditoriaGlobalSection() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select(`
            id,
            created_at,
            action,
            entity_type,
            user_id,
            gabinete_id
          `)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;

        // Buscar nomes de usuários e gabinetes
        const logsComNomes = await Promise.all(
          (data || []).map(async (log: any) => {
            const [userResult, gabResult] = await Promise.all([
              supabase
                .from('profiles')
                .select('nome_completo')
                .eq('id', log.user_id)
                .single(),
              supabase
                .from('gabinetes')
                .select('nome')
                .eq('id', log.gabinete_id)
                .single()
            ]);

            return {
              ...log,
              user_nome: userResult.data?.nome_completo || 'Sistema',
              gabinete_nome: gabResult.data?.nome || 'Desconhecido'
            };
          })
        );

        setLogs(logsComNomes);
      } catch (error) {
        console.error('Erro ao carregar logs:', error);
      } finally {
        setLoading(false);
      }
    }

    loadLogs();
  }, []);

  const getActionBadge = (action: string) => {
    const colors: Record<string, 'default' | 'secondary' | 'destructive'> = {
      create: 'default',
      update: 'secondary',
      delete: 'destructive',
      login: 'default',
      logout: 'secondary'
    };
    return <Badge variant={colors[action] || 'outline'}>{action}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Auditoria Global</CardTitle>
          <CardDescription>Carregando logs...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log de Auditoria Global</CardTitle>
        <CardDescription>
          Últimas 100 ações realizadas em todos os gabinetes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Gabinete</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </TableCell>
                <TableCell>{log.user_nome}</TableCell>
                <TableCell>{getActionBadge(log.action)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{log.entity_type || '-'}</Badge>
                </TableCell>
                <TableCell>{log.gabinete_nome}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
