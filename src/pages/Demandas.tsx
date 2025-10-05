import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGabinete } from '@/contexts/GabineteContext';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGuard, NoPermissionMessage } from '@/components/PermissionGuard';
import { DemandasStats } from '@/components/demandas/DemandasStats';
import { AddDemandaDialog } from '@/components/demandas/AddDemandaDialog';
import { DemandaDetailsSheet } from '@/components/demandas/DemandaDetailsSheet';
import { Search, Filter, X, ClipboardList, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Demanda {
  id: string;
  titulo: string;
  descricao: string | null;
  status: string;
  prioridade: string;
  prazo: string | null;
  created_at: string;
  concluida_em: string | null;
  responsavel_id: string | null;
  eleitores: {
    nome_completo: string;
  } | null;
}

const Demandas = () => {
  const [demandas, setDemandas] = useState<Demanda[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedPrioridade, setSelectedPrioridade] = useState<string>('');
  const [selectedDemanda, setSelectedDemanda] = useState<Demanda | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [addDemandaOpen, setAddDemandaOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    concluidas: 0,
    pendentes: 0,
    atrasadas: 0,
  });
  const { currentGabinete } = useGabinete();
  const { toast } = useToast();
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  const hasActiveFilters = selectedStatus || selectedPrioridade;

  useEffect(() => {
    if (currentGabinete) {
      fetchDemandas();
      fetchStats();
    }
  }, [currentGabinete, searchTerm, selectedStatus, selectedPrioridade]);

  const fetchDemandas = async () => {
    if (!currentGabinete) return;

    setLoading(true);
    try {
      let query = supabase
        .from('demandas')
        .select('*, eleitores(nome_completo)')
        .eq('gabinete_id', currentGabinete.gabinete_id);

      // Filtros
      if (searchTerm.trim()) {
        query = query.or(`titulo.ilike.%${searchTerm}%,descricao.ilike.%${searchTerm}%`);
      }

      if (selectedStatus) {
        query = query.eq('status', selectedStatus as 'aberta' | 'em_andamento' | 'concluida' | 'cancelada');
      }

      if (selectedPrioridade) {
        query = query.eq('prioridade', selectedPrioridade as 'baixa' | 'media' | 'alta' | 'urgente');
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      setDemandas((data || []) as unknown as Demanda[]);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar demandas',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!currentGabinete) return;

    try {
      const { data, error } = await supabase
        .from('demandas')
        .select('status, prazo')
        .eq('gabinete_id', currentGabinete.gabinete_id);

      if (error) throw error;

      const total = data?.length || 0;
      const concluidas = data?.filter((d) => d.status === 'concluida').length || 0;
      const pendentes =
        data?.filter((d) => ['aberta', 'em_andamento'].includes(d.status)).length || 0;
      
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const atrasadas =
        data?.filter((d) => {
          if (!d.prazo || d.status === 'concluida' || d.status === 'cancelada') return false;
          const prazoDate = new Date(d.prazo);
          return prazoDate < hoje;
        }).length || 0;

      setStats({ total, concluidas, pendentes, atrasadas });
    } catch (error: any) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const clearFilters = () => {
    setSelectedStatus('');
    setSelectedPrioridade('');
    setSearchTerm('');
  };

  const handleDemandaClick = (demanda: Demanda) => {
    setSelectedDemanda(demanda);
    setDetailsOpen(true);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      aberta: 'bg-blue-100 text-blue-800',
      em_andamento: 'bg-yellow-100 text-yellow-800',
      concluida: 'bg-green-100 text-green-800',
      cancelada: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPrioridadeColor = (prioridade: string) => {
    const colors: Record<string, string> = {
      baixa: 'bg-gray-100 text-gray-800',
      media: 'bg-blue-100 text-blue-800',
      alta: 'bg-orange-100 text-orange-800',
      urgente: 'bg-red-100 text-red-800',
    };
    return colors[prioridade] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
  };

  // Verificar permissão de visualização
  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!hasPermission('view_demandas')) {
    return <NoPermissionMessage />;
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Demandas</h1>
          <p className="text-muted-foreground">
            Gerencie todas as solicitações e atendimentos
          </p>
        </div>
        <PermissionGuard permission="create_demandas">
          <Button onClick={() => setAddDemandaOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Demanda
          </Button>
        </PermissionGuard>
      </div>

      <DemandasStats
        total={stats.total}
        concluidas={stats.concluidas}
        pendentes={stats.pendentes}
        atrasadas={stats.atrasadas}
      />

      <DemandaDetailsSheet
        demanda={selectedDemanda}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onDemandaUpdated={() => {
          fetchDemandas();
          fetchStats();
        }}
      />

      <Card className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por título ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[160px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">Todos os status</SelectItem>
                <SelectItem value="aberta">Aberta</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="concluida">Concluída</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedPrioridade} onValueChange={setSelectedPrioridade}>
              <SelectTrigger className="w-[160px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">Todas prioridades</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Limpar
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-2">
              <ClipboardList className="h-12 w-12 animate-pulse text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Carregando demandas...</p>
            </div>
          </div>
        ) : demandas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma demanda encontrada</h3>
            <p className="text-sm text-muted-foreground">
              {hasActiveFilters
                ? 'Tente ajustar os filtros de busca'
                : 'Comece criando sua primeira demanda'}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[250px]">Título</TableHead>
                  <TableHead className="min-w-[150px]">Eleitor</TableHead>
                  <TableHead className="min-w-[120px]">Status</TableHead>
                  <TableHead className="min-w-[120px]">Prioridade</TableHead>
                  <TableHead className="min-w-[120px]">Prazo</TableHead>
                  <TableHead className="min-w-[120px]">Criada em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {demandas.map((demanda) => (
                  <TableRow
                    key={demanda.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleDemandaClick(demanda)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{demanda.titulo}</p>
                        {demanda.descricao && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {demanda.descricao}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{demanda.eleitores?.nome_completo || '-'}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(demanda.status)} variant="secondary">
                        {demanda.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPrioridadeColor(demanda.prioridade)} variant="secondary">
                        {demanda.prioridade}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(demanda.prazo)}</TableCell>
                    <TableCell>{formatDate(demanda.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
      
      <AddDemandaDialog 
        open={addDemandaOpen}
        onOpenChange={setAddDemandaOpen}
        onDemandaAdded={fetchDemandas}
      />
    </div>
  );
};

export default Demandas;