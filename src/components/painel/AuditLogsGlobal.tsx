import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AuditLog {
  id: string;
  created_at: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  gabinete_id: string;
  user_id: string;
  gabinete_nome: string;
  user_nome: string;
}

export function AuditLogsGlobal() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      // Buscar TODOS os logs sem limit
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log(`📊 Total de logs carregados: ${data?.length || 0}`);

      // Buscar todos os gabinetes e profiles de uma vez
      const { data: gabinetes } = await supabase
        .from('gabinetes')
        .select('id, nome');

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nome_completo');

      const gabineteMap = new Map(gabinetes?.map(g => [g.id, g.nome]) || []);
      const profileMap = new Map(profiles?.map(p => [p.id, p.nome_completo]) || []);

      // Mapear os logs com nomes
      const logsComNomes = (data || []).map((log) => ({
        ...log,
        gabinete_nome: gabineteMap.get(log.gabinete_id) || 'Desconhecido',
        user_nome: profileMap.get(log.user_id) || 'Sistema'
      }));

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

  const handleLogClick = (log: AuditLog) => {
    setSelectedLog(log);
    setSheetOpen(true);
  };

  return (
    <>
      <div className="rounded-md border">
        <div className="p-4 border-b bg-muted/50">
          <p className="text-sm text-muted-foreground">
            Total de logs: <span className="font-bold text-foreground">{logs.length}</span>
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Gabinete</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow 
                key={log.id} 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleLogClick(log)}
              >
                <TableCell>
                  {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                </TableCell>
                <TableCell>{log.user_nome}</TableCell>
                <TableCell>
                  <Badge variant={getActionBadgeVariant(log.action)}>
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell>{log.entity_type || '-'}</TableCell>
                <TableCell>{log.gabinete_nome}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {log.ip_address || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalhes do Log</SheetTitle>
            <SheetDescription>
              Informações completas sobre a ação realizada
            </SheetDescription>
          </SheetHeader>

          {selectedLog && (
            <div className="mt-6 space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">Informações Básicas</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID do Log:</span>
                    <span className="font-mono text-xs">{selectedLog.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data/Hora:</span>
                    <span>{format(new Date(selectedLog.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ação:</span>
                    <Badge variant={getActionBadgeVariant(selectedLog.action)}>
                      {selectedLog.action}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Usuário</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nome:</span>
                    <span>{selectedLog.user_nome}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID:</span>
                    <span className="font-mono text-xs">{selectedLog.user_id}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Gabinete</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nome:</span>
                    <span>{selectedLog.gabinete_nome}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID:</span>
                    <span className="font-mono text-xs">{selectedLog.gabinete_id}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Entidade Afetada</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo:</span>
                    <span>{selectedLog.entity_type || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID:</span>
                    <span className="font-mono text-xs">{selectedLog.entity_id || '-'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Informações Técnicas</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IP:</span>
                    <span className="font-mono text-xs">{selectedLog.ip_address || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">User Agent:</span>
                    <p className="font-mono text-xs mt-1 break-all">{selectedLog.user_agent || '-'}</p>
                  </div>
                </div>
              </div>

              {selectedLog.details && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Detalhes Adicionais</h4>
                  <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
