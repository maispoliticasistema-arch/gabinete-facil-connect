import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditLogsProps {
  gabineteId: string;
}

const ACTION_LABELS: Record<string, string> = {
  create: "Criação",
  update: "Atualização",
  delete: "Exclusão",
  login: "Login",
  logout: "Logout",
  permission_change: "Alteração de Permissão",
  user_created: "Usuário Criado",
  user_disabled: "Usuário Desativado",
  user_deleted: "Usuário Removido",
  export_report: "Exportação de Relatório",
  import_data: "Importação de Dados",
};

const ACTION_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  create: "default", // Verde (padrão success)
  update: "secondary", // Azul
  delete: "destructive", // Vermelho
  login: "default",
  logout: "outline",
  permission_change: "secondary",
  user_created: "default",
  user_disabled: "secondary",
  user_deleted: "destructive",
  export_report: "secondary",
  import_data: "secondary",
};

const ENTITY_LABELS: Record<string, string> = {
  eleitor: "Eleitor",
  demanda: "Demanda",
  agenda: "Agenda",
  roteiro: "Roteiro",
  tag: "Tag",
  user: "Usuário",
  gabinete: "Gabinete",
  permission: "Permissão",
};

export function AuditLogs({ gabineteId }: AuditLogsProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const fetchLogs = async () => {
    try {
      // Buscar logs
      const { data: logsData, error: logsError } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("gabinete_id", gabineteId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (logsError) throw logsError;

      if (!logsData || logsData.length === 0) {
        setLogs([]);
        return;
      }

      // Extrair user_ids únicos
      const userIds = [...new Set(logsData.map(log => log.user_id).filter(Boolean))];

      // Buscar profiles dos usuários
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, nome_completo")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Criar um map de user_id para nome_completo
      const profilesMap = new Map(
        (profilesData || []).map(profile => [profile.id, profile.nome_completo])
      );

      // Fazer merge dos dados
      const logsWithProfiles = logsData.map(log => ({
        ...log,
        user_nome: profilesMap.get(log.user_id) || "Sistema"
      }));

      setLogs(logsWithProfiles);
    } catch (error) {
      console.error("Erro ao buscar logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();

    // Configurar realtime para atualizar logs automaticamente
    const channel = supabase
      .channel('audit-logs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs',
          filter: `gabinete_id=eq.${gabineteId}`
        },
        (payload) => {
          console.log('Novo log de auditoria:', payload);
          fetchLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gabineteId]);

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;
  }

  const handleLogClick = (log: any) => {
    setSelectedLog(log);
    setSheetOpen(true);
  };

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Entidade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Nenhum log registrado
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow 
                  key={log.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleLogClick(log)}
                >
                  <TableCell className="text-muted-foreground">
                    {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>{log.user_nome || "Sistema"}</TableCell>
                  <TableCell>
                    <Badge variant={ACTION_COLORS[log.action] || "secondary"}>
                      {ACTION_LABELS[log.action] || log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {log.entity_type ? ENTITY_LABELS[log.entity_type] || log.entity_type : "N/A"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalhes da Ação</SheetTitle>
            <SheetDescription>
              Informações completas sobre esta ação do sistema
            </SheetDescription>
          </SheetHeader>

          {selectedLog && (
            <div className="mt-6 space-y-4">
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground">Ação</h3>
                <Badge variant={ACTION_COLORS[selectedLog.action] || "secondary"} className="mt-1">
                  {ACTION_LABELS[selectedLog.action] || selectedLog.action}
                </Badge>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-muted-foreground">Usuário</h3>
                <p className="mt-1">{selectedLog.user_nome || "Sistema"}</p>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-muted-foreground">Data e Hora</h3>
                <p className="mt-1">
                  {format(new Date(selectedLog.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                </p>
              </div>

              {selectedLog.entity_type && (
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">Entidade</h3>
                  <p className="mt-1">{ENTITY_LABELS[selectedLog.entity_type] || selectedLog.entity_type}</p>
                </div>
              )}

              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">Detalhes</h3>
                  <div className="space-y-2 bg-muted p-3 rounded-lg">
                    {Object.entries(selectedLog.details).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex flex-col gap-1">
                        <span className="text-xs font-semibold uppercase text-muted-foreground">
                          {key}
                        </span>
                        <span className="text-sm">
                          {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedLog.ip_address && (
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">Endereço IP</h3>
                  <p className="mt-1 text-xs font-mono">{selectedLog.ip_address}</p>
                </div>
              )}

              {selectedLog.user_agent && (
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">Navegador</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{selectedLog.user_agent}</p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
