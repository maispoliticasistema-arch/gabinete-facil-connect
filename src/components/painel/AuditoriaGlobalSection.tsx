import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Filter, X, Activity, PlusCircle, Edit, Trash2, Users } from 'lucide-react';

interface AuditLog {
  id: string;
  created_at: string;
  action: string;
  entity_type: string;
  user_nome: string;
  gabinete_nome: string;
  user_id: string;
  gabinete_id: string;
}

export function AuditoriaGlobalSection() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [gabinetes, setGabinetes] = useState<{ id: string; nome: string }[]>([]);
  const [gabineteFilter, setGabineteFilter] = useState<string>('all');

  useEffect(() => {
    async function loadLogs() {
      try {
        let query = supabase
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
        
        // Aplicar filtros
        if (actionFilter !== 'all') {
          query = query.eq('action', actionFilter as any);
        }
        if (entityFilter !== 'all') {
          query = query.eq('entity_type', entityFilter as any);
        }
        if (gabineteFilter !== 'all') {
          query = query.eq('gabinete_id', gabineteFilter);
        }

        const { data, error } = await query;

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
  }, [actionFilter, entityFilter, gabineteFilter]);

  useEffect(() => {
    async function loadGabinetes() {
      const { data } = await supabase
        .from('gabinetes')
        .select('id, nome')
        .order('nome');
      if (data) setGabinetes(data);
    }
    loadGabinetes();
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

  const clearFilters = () => {
    setSearchTerm('');
    setActionFilter('all');
    setEntityFilter('all');
    setGabineteFilter('all');
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.user_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.gabinete_nome.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const stats = {
    total: filteredLogs.length,
    create: filteredLogs.filter(l => l.action === 'create').length,
    update: filteredLogs.filter(l => l.action === 'update').length,
    delete: filteredLogs.filter(l => l.action === 'delete').length,
    usuarios: new Set(filteredLogs.map(l => l.user_id)).size,
    gabinetes: new Set(filteredLogs.map(l => l.gabinete_id)).size,
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
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Log de Auditoria Global
        </CardTitle>
        <CardDescription>
          Últimas 100 ações realizadas em todos os gabinetes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Create
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.create}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Update
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.update}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Delete
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.delete}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.usuarios}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Gabinetes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.gabinetes}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Buscar usuário ou gabinete..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as ações</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="logout">Logout</SelectItem>
            </SelectContent>
          </Select>

          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="eleitor">Eleitor</SelectItem>
              <SelectItem value="demanda">Demanda</SelectItem>
              <SelectItem value="agenda">Agenda</SelectItem>
              <SelectItem value="roteiro">Roteiro</SelectItem>
              <SelectItem value="user">Usuário</SelectItem>
              <SelectItem value="gabinete">Gabinete</SelectItem>
            </SelectContent>
          </Select>

          <Select value={gabineteFilter} onValueChange={setGabineteFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por gabinete" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os gabinetes</SelectItem>
              {gabinetes.map((gab) => (
                <SelectItem key={gab.id} value={gab.id}>
                  {gab.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(searchTerm || actionFilter !== 'all' || entityFilter !== 'all' || gabineteFilter !== 'all') && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Limpar filtros
          </Button>
        )}

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
            {filteredLogs.map((log) => (
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
