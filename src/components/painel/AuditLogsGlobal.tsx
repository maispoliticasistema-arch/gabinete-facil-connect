import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AuditLog {
  id: string;
  created_at: string;
  action: string;
  entity_type: string | null;
  gabinete_nome: string;
  user_nome: string;
}

export function AuditLogsGlobal() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          id,
          created_at,
          action,
          entity_type,
          gabinete_id,
          user_id
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Buscar nomes de usuários e gabinetes
      const logsComNomes = await Promise.all(
        (data || []).map(async (log) => {
          const { data: gabinete } = await supabase
            .from('gabinetes')
            .select('nome')
            .eq('id', log.gabinete_id)
            .single();

          const { data: profile } = await supabase
            .from('profiles')
            .select('nome_completo')
            .eq('id', log.user_id)
            .single();

          return {
            ...log,
            gabinete_nome: gabinete?.nome || 'Desconhecido',
            user_nome: profile?.nome_completo || 'Sistema'
          };
        })
      );

      setLogs(logsComNomes);
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando logs...</div>;
  }

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'create':
        return 'default';
      case 'update':
        return 'secondary';
      case 'delete':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="rounded-md border">
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
              <TableCell>
                <Badge variant={getActionBadgeVariant(log.action)}>
                  {log.action}
                </Badge>
              </TableCell>
              <TableCell>{log.entity_type || '-'}</TableCell>
              <TableCell>{log.gabinete_nome}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
