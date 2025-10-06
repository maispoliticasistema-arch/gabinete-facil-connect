import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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

  return (
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
              <TableRow key={log.id}>
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
  );
}
