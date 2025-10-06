import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, Trash2, ChevronLeft, ChevronRight, Undo2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGabinete } from "@/contexts/GabineteContext";

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
  const { toast } = useToast();
  const { currentGabinete } = useGabinete();
  
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [entityData, setEntityData] = useState<any>(null);
  const [loadingEntity, setLoadingEntity] = useState(false);
  
  // Filtros e paginação
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterEntity, setFilterEntity] = useState<string>("all");
  const [filterUser, setFilterUser] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [users, setUsers] = useState<any[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingLogs, setDeletingLogs] = useState(false);
  const [undoDialogOpen, setUndoDialogOpen] = useState(false);
  const [undoingAction, setUndoingAction] = useState(false);
  
  const itemsPerPage = 20;

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("user_gabinetes")
        .select("user_id, profiles(id, nome_completo)")
        .eq("gabinete_id", gabineteId)
        .eq("ativo", true);
      
      if (error) throw error;
      
      const uniqueUsers = data?.map(ug => ({
        id: ug.user_id,
        nome_completo: (ug.profiles as any)?.nome_completo
      })).filter((user, index, self) => 
        index === self.findIndex(u => u.id === user.id)
      ) || [];
      
      setUsers(uniqueUsers);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    }
  };

  const fetchLogs = async () => {
    console.log('🔄 fetchLogs CHAMADO - gabineteId:', gabineteId);
    try {
      setLoading(true);
      
      // Construir query com filtros
      let query = supabase
        .from("audit_logs")
        .select("*", { count: 'exact' })
        .eq("gabinete_id", gabineteId);
      
      // Aplicar filtros
      if (filterAction !== "all") {
        query = query.eq("action", filterAction as any);
      }
      
      if (filterEntity !== "all") {
        query = query.eq("entity_type", filterEntity as any);
      }
      
      if (filterUser !== "all") {
        query = query.eq("user_id", filterUser);
      }
      
      if (startDate) {
        query = query.gte("created_at", new Date(startDate).toISOString());
      }
      
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query = query.lte("created_at", endDateTime.toISOString());
      }
      
      // Buscar com paginação
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      const { data: logsData, error: logsError, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (logsError) throw logsError;
      
      console.log('📋 Logs retornados do banco:', logsData?.length, 'Total count:', count);
      setTotalCount(count || 0);

      if (!logsData || logsData.length === 0) {
        console.log('✅ Nenhum log encontrado - limpando lista');
        setLogs([]);
        setLoading(false);
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

      // Fazer merge e aplicar busca no frontend
      let logsWithProfiles = logsData.map(log => ({
        ...log,
        user_nome: profilesMap.get(log.user_id) || "Sistema"
      }));
      
      // Aplicar busca por texto
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        logsWithProfiles = logsWithProfiles.filter(log => 
          log.user_nome.toLowerCase().includes(search) ||
          (log.action && ACTION_LABELS[log.action]?.toLowerCase().includes(search)) ||
          (log.entity_type && ENTITY_LABELS[log.entity_type]?.toLowerCase().includes(search)) ||
          (log.details && JSON.stringify(log.details).toLowerCase().includes(search))
        );
      }

      setLogs(logsWithProfiles);
    } catch (error) {
      console.error("Erro ao buscar logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [gabineteId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterAction, filterEntity, filterUser, startDate, endDate, searchTerm]);

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
  }, [gabineteId, filterAction, filterEntity, filterUser, startDate, endDate, searchTerm, currentPage]);

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;
  }

  const fetchEntityData = async (log: any) => {
    if (!log.entity_id || !log.entity_type) {
      setEntityData(null);
      return;
    }

    setLoadingEntity(true);
    try {
      let data = null;
      
      // Para registros deletados, precisamos buscar incluindo os soft-deleted
      // As policies especiais "Auditoria pode ver X deletadas" permitem isso
      
      switch (log.entity_type) {
        case 'eleitor':
          const { data: eleitor } = await supabase
            .from('eleitores')
            .select('*')
            .eq('id', log.entity_id)
            .maybeSingle();
          data = eleitor;
          break;
          
        case 'demanda':
          const { data: demanda } = await supabase
            .from('demandas')
            .select('*, eleitores(nome_completo)')
            .eq('id', log.entity_id)
            .maybeSingle();
          data = demanda;
          break;
          
        case 'agenda':
          const { data: agenda } = await supabase
            .from('agenda')
            .select('*')
            .eq('id', log.entity_id)
            .maybeSingle();
          data = agenda;
          break;
          
        case 'roteiro':
          const { data: roteiro } = await supabase
            .from('roteiros')
            .select('*')
            .eq('id', log.entity_id)
            .maybeSingle();
          data = roteiro;
          break;
          
        case 'tag':
          const { data: tag } = await supabase
            .from('tags')
            .select('*')
            .eq('id', log.entity_id)
            .maybeSingle();
          data = tag;
          break;
      }
      
      setEntityData(data);
    } catch (error) {
      console.error('Erro ao buscar dados da entidade:', error);
      setEntityData(null);
    } finally {
      setLoadingEntity(false);
    }
  };

  const handleLogClick = async (log: any) => {
    setSelectedLog(log);
    setSheetOpen(true);
    setEntityData(null);
    await fetchEntityData(log);
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    if (typeof value === 'object') {
      if (value.nome_completo) return value.nome_completo;
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const handleDeleteLogs = async () => {
    console.log('🗑️ Iniciando exclusão/arquivamento de logs...');
    console.log('📝 Texto de confirmação:', deleteConfirmText);
    
    if (deleteConfirmText !== "excluir") {
      console.log('❌ Confirmação incorreta');
      toast({
        title: "Confirmação incorreta",
        description: 'Você deve digitar "excluir" para confirmar',
        variant: "destructive"
      });
      return;
    }

    console.log('✅ Confirmação correta, iniciando processo...');
    setDeletingLogs(true);
    try {
      // 1. Buscar TODOS os logs do gabinete para arquivar
      console.log('🔍 Buscando logs do gabinete:', gabineteId);
      const { data: allLogs, error: fetchError } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("gabinete_id", gabineteId);

      console.log('📊 Logs encontrados:', allLogs?.length, 'Erro:', fetchError);
      
      if (fetchError) throw fetchError;

      // 2. Mover logs para a tabela de arquivamento
      if (allLogs && allLogs.length > 0) {
        console.log('📦 Preparando', allLogs.length, 'logs para arquivamento');
        const archivedLogs = allLogs.map(log => ({
          original_log_id: log.id,
          gabinete_id: log.gabinete_id,
          user_id: log.user_id,
          action: log.action,
          entity_type: log.entity_type,
          entity_id: log.entity_id,
          details: log.details,
          ip_address: log.ip_address,
          user_agent: log.user_agent,
          original_created_at: log.created_at
        }));

        console.log('💾 Inserindo logs no arquivo...');
        const { error: archiveError } = await supabase
          .from("archived_audit_logs")
          .insert(archivedLogs);

        console.log('📥 Resultado do arquivamento:', archiveError ? 'ERRO' : 'SUCESSO');
        if (archiveError) {
          console.error('❌ Erro ao arquivar:', archiveError);
          throw archiveError;
        }
      }

      // 3. Hard delete das entidades soft-deleted
      const deleteLogs = allLogs?.filter(log => 
        log.action === 'delete' && log.entity_id && log.entity_type
      ) || [];

      if (deleteLogs.length > 0) {
        for (const log of deleteLogs) {
          let tableName = '';
          switch (log.entity_type) {
            case 'eleitor': tableName = 'eleitores'; break;
            case 'demanda': tableName = 'demandas'; break;
            case 'agenda': tableName = 'agenda'; break;
            case 'roteiro': tableName = 'roteiros'; break;
            case 'tag': tableName = 'tags'; break;
            default: continue;
          }

          // Fazer hard delete se tiver deleted_at
          await supabase
            .from(tableName as any)
            .delete()
            .eq('id', log.entity_id)
            .not('deleted_at', 'is', null);
        }
      }

      // 4. Remover logs da tabela principal
      console.log('🗑️ Deletando logs da tabela principal...');
      const { error: deleteLogsError } = await supabase
        .from("audit_logs")
        .delete()
        .eq("gabinete_id", gabineteId);

      console.log('🔥 Resultado da deleção:', deleteLogsError ? 'ERRO' : 'SUCESSO');
      if (deleteLogsError) {
        console.error('❌ Erro ao deletar logs:', deleteLogsError);
        throw deleteLogsError;
      }

      console.log('✅ Processo completo! Logs arquivados com sucesso.');
      toast({
        title: "Logs arquivados",
        description: "Todos os logs foram movidos para o arquivo com sucesso"
      });

      setDeleteDialogOpen(false);
      setDeleteConfirmText("");
      fetchLogs();
    } catch (error: any) {
      console.error("💥 ERRO GERAL ao arquivar logs:", error);
      console.error("Detalhes do erro:", JSON.stringify(error, null, 2));
      toast({
        title: "Erro ao arquivar logs",
        description: error.message || "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      console.log('🏁 Finalizando processo de exclusão...');
      setDeletingLogs(false);
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const canUndoAction = (log: any): boolean => {
    if (!log || !log.action || !log.entity_id || !log.entity_type) return false;
    
    // Permitir desfazer create e delete
    const undoableActions = ['create', 'delete'];
    const undoableEntities = ['eleitor', 'demanda', 'agenda', 'roteiro', 'tag'];
    
    return undoableActions.includes(log.action) && undoableEntities.includes(log.entity_type);
  };

  const handleUndoAction = async () => {
    if (!selectedLog) return;

    setUndoingAction(true);
    try {
      let tableName = '';
      switch (selectedLog.entity_type) {
        case 'eleitor': tableName = 'eleitores'; break;
        case 'demanda': tableName = 'demandas'; break;
        case 'agenda': tableName = 'agenda'; break;
        case 'roteiro': tableName = 'roteiros'; break;
        case 'tag': tableName = 'tags'; break;
        default:
          throw new Error('Tipo de entidade não suportado');
      }

      if (selectedLog.action === 'delete') {
        // Restaurar: remover deleted_at
        const { error } = await supabase
          .from(tableName as any)
          .update({ deleted_at: null })
          .eq('id', selectedLog.entity_id);

        if (error) throw error;

        toast({
          title: "Ação desfeita",
          description: `${ENTITY_LABELS[selectedLog.entity_type]} restaurado com sucesso`
        });
      } else if (selectedLog.action === 'create') {
        // Desfazer criação: fazer soft delete
        const { error } = await supabase
          .from(tableName as any)
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', selectedLog.entity_id);

        if (error) throw error;

        toast({
          title: "Ação desfeita",
          description: `${ENTITY_LABELS[selectedLog.entity_type]} removido com sucesso`
        });
      }

      setUndoDialogOpen(false);
      setSheetOpen(false);
      fetchLogs();
    } catch (error: any) {
      console.error("Erro ao desfazer ação:", error);
      toast({
        title: "Erro ao desfazer ação",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUndoingAction(false);
    }
  };

  return (
    <>
      {/* Filtros e Busca */}
      <div className="space-y-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar nos logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir Logs
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger>
              <SelectValue placeholder="Ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as ações</SelectItem>
              <SelectItem value="create">Criação</SelectItem>
              <SelectItem value="update">Atualização</SelectItem>
              <SelectItem value="delete">Exclusão</SelectItem>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="logout">Logout</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterEntity} onValueChange={setFilterEntity}>
            <SelectTrigger>
              <SelectValue placeholder="Entidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as entidades</SelectItem>
              <SelectItem value="eleitor">Eleitor</SelectItem>
              <SelectItem value="demanda">Demanda</SelectItem>
              <SelectItem value="agenda">Agenda</SelectItem>
              <SelectItem value="roteiro">Roteiro</SelectItem>
              <SelectItem value="tag">Tag</SelectItem>
              <SelectItem value="user">Usuário</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterUser} onValueChange={setFilterUser}>
            <SelectTrigger>
              <SelectValue placeholder="Usuário" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os usuários</SelectItem>
              {users.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.nome_completo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Data inicial"
          />

          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="Data final"
          />
        </div>
      </div>

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

      {/* Paginação */}
      {totalCount > itemsPerPage && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalCount)} de {totalCount} logs
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || loading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar Logs de Auditoria</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Esta ação irá <strong>arquivar</strong> todos os logs de auditoria
                e remover permanentemente os dados que foram marcados como excluídos (eleitores, demandas, etc).
              </p>
              <p className="text-muted-foreground">
                Os logs serão movidos para um arquivo seguro e não ficarão mais visíveis na interface,
                mas poderão ser recuperados se necessário pelo administrador do sistema.
              </p>
              <p>
                Para confirmar, digite <strong>"excluir"</strong> no campo abaixo:
              </p>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Digite 'excluir' para confirmar"
                className="mt-2"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLogs}
              disabled={deleteConfirmText !== "excluir" || deletingLogs}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingLogs ? "Arquivando..." : "Arquivar Logs"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">Informações da Ação</h3>
                  <div className="space-y-2 bg-muted p-3 rounded-lg">
                    {Object.entries(selectedLog.details).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex flex-col gap-1">
                        <span className="text-xs font-semibold uppercase text-muted-foreground">
                          {key}
                        </span>
                        <span className="text-sm">
                          {formatValue(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {loadingEntity && (
                <div className="text-center py-4 text-muted-foreground">
                  Carregando dados completos...
                </div>
              )}

              {!loadingEntity && entityData && (
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                    Dados Completos da Entidade
                  </h3>
                  <div className="space-y-2 bg-muted p-3 rounded-lg max-h-96 overflow-y-auto">
                    {Object.entries(entityData)
                      .filter(([key]) => !['id', 'gabinete_id', 'created_at', 'updated_at'].includes(key))
                      .map(([key, value]: [string, any]) => (
                        <div key={key} className="flex flex-col gap-1 pb-2 border-b border-border last:border-0">
                          <span className="text-xs font-semibold uppercase text-muted-foreground">
                            {key.replace(/_/g, ' ')}
                          </span>
                          <span className="text-sm break-words">
                            {formatValue(value)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {!loadingEntity && !entityData && selectedLog.entity_id && (
                <div className="bg-muted p-3 rounded-lg text-sm text-muted-foreground">
                  Entidade não encontrada (pode ter sido excluída)
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

              {/* Botão Desfazer Ação */}
              {canUndoAction(selectedLog) && (
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setUndoDialogOpen(true)}
                  >
                    <Undo2 className="h-4 w-4 mr-2" />
                    Desfazer Ação
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    {selectedLog.action === 'delete' 
                      ? 'Restaurar este registro excluído' 
                      : 'Remover este registro criado'}
                  </p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Modal de confirmação de desfazer ação */}
      <AlertDialog open={undoDialogOpen} onOpenChange={setUndoDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desfazer Ação</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedLog?.action === 'delete' ? (
                <>
                  Você está prestes a <strong>restaurar</strong> este{' '}
                  {selectedLog?.entity_type && ENTITY_LABELS[selectedLog.entity_type]?.toLowerCase()}.
                  O registro voltará a ficar visível no sistema.
                </>
              ) : (
                <>
                  Você está prestes a <strong>remover</strong> este{' '}
                  {selectedLog?.entity_type && ENTITY_LABELS[selectedLog.entity_type]?.toLowerCase()}.
                  Esta ação pode ser desfeita posteriormente através dos logs de auditoria.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUndoAction}
              disabled={undoingAction}
            >
              {undoingAction ? "Desfazendo..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
