import { useEffect, useState, useCallback } from 'react';
import { Users, FileText, Calendar, AlertCircle, TrendingUp, UserPlus } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { AniversariantesDialog } from '@/components/dashboard/AniversariantesDialog';
import { RankingAssessores } from '@/components/dashboard/RankingAssessores';
import { AddDemandaDialog } from '@/components/demandas/AddDemandaDialog';
import { AddEleitoresDialog } from '@/components/eleitores/AddEleitoresDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGabinete } from '@/contexts/GabineteContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
interface DashboardStats {
  totalEleitores: number;
  aniversariantes: number;
  demandasAbertas: number;
  demandasHoje: number;
  demandasAtrasadas: number;
  eventosHoje: number;
}
const Index = () => {
  const {
    currentGabinete
  } = useGabinete();
  const {
    toast
  } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalEleitores: 0,
    aniversariantes: 0,
    demandasAbertas: 0,
    demandasHoje: 0,
    demandasAtrasadas: 0,
    eventosHoje: 0
  });
  const [loading, setLoading] = useState(true);
  const [aniversariantesDialogOpen, setAniversariantesDialogOpen] = useState(false);
  const [novaDemandaDialogOpen, setNovaDemandaDialogOpen] = useState(false);
  const [novoEleitorDialogOpen, setNovoEleitorDialogOpen] = useState(false);
  const fetchStats = useCallback(async () => {
    if (!currentGabinete) return;
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    try {
      // Total eleitores
      const {
        count: totalEleitores
      } = await supabase.from('eleitores').select('*', {
        count: 'exact',
        head: true
      }).eq('gabinete_id', currentGabinete.gabinete_id);

      // Aniversariantes do dia
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const {
        data: eleitoresData
      } = await supabase.from('eleitores').select('data_nascimento').eq('gabinete_id', currentGabinete.gabinete_id).not('data_nascimento', 'is', null);
      const aniversariantes = eleitoresData?.filter(eleitor => {
        if (!eleitor.data_nascimento) return false;
        const nascimento = new Date(eleitor.data_nascimento + 'T00:00:00');
        const nascMonth = String(nascimento.getMonth() + 1).padStart(2, '0');
        const nascDay = String(nascimento.getDate()).padStart(2, '0');
        return nascMonth === month && nascDay === day;
      }).length || 0;

      // Demandas abertas
      const {
        count: demandasAbertas
      } = await supabase.from('demandas').select('*', {
        count: 'exact',
        head: true
      }).eq('gabinete_id', currentGabinete.gabinete_id).eq('status', 'aberta');

      // Demandas com prazo para hoje
      const {
        count: demandasHoje
      } = await supabase.from('demandas').select('*', {
        count: 'exact',
        head: true
      }).eq('gabinete_id', currentGabinete.gabinete_id).eq('prazo', today).neq('status', 'concluida');

      // Demandas atrasadas
      const {
        count: demandasAtrasadas
      } = await supabase.from('demandas').select('*', {
        count: 'exact',
        head: true
      }).eq('gabinete_id', currentGabinete.gabinete_id).lt('prazo', today).neq('status', 'concluida');

      // Eventos hoje
      const {
        count: eventosHoje
      } = await supabase.from('agenda').select('*', {
        count: 'exact',
        head: true
      }).eq('gabinete_id', currentGabinete.gabinete_id).gte('data_inicio', `${today}T00:00:00`).lt('data_inicio', `${today}T23:59:59`);
      setStats({
        totalEleitores: totalEleitores || 0,
        aniversariantes,
        demandasAbertas: demandasAbertas || 0,
        demandasHoje: demandasHoje || 0,
        demandasAtrasadas: demandasAtrasadas || 0,
        eventosHoje: eventosHoje || 0
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar as estatísticas do dashboard.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [currentGabinete, toast]);
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);
  const handleDemandaAdded = () => {
    fetchStats(); // Atualiza as estatísticas
  };
  const handleEleitoresAdded = () => {
    fetchStats(); // Atualiza as estatísticas
  };
  if (loading) {
    return <div className="flex items-center justify-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>;
  }
  return <div className="animate-fade-in space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Bem-vindo ao painel de controle do {currentGabinete?.gabinetes.nome}
          </p>
        </div>
        <div className="flex gap-2">
          
          
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard title="Total de Eleitores" value={stats.totalEleitores} icon={Users} description="Cadastrados no sistema" />
        <StatsCard title="Aniversariantes Hoje" value={stats.aniversariantes} icon={Calendar} description="Envie suas felicitações!" onClick={() => setAniversariantesDialogOpen(true)} />
        <StatsCard title="Demandas Abertas" value={stats.demandasAbertas} icon={FileText} description="Aguardando atendimento" />
        <StatsCard title="Prazo para Hoje" value={stats.demandasHoje} icon={AlertCircle} description="Demandas com vencimento" />
        <StatsCard title="Demandas Atrasadas" value={stats.demandasAtrasadas} icon={AlertCircle} description="Requerem atenção urgente" />
        <StatsCard title="Eventos Hoje" value={stats.eventosHoje} icon={Calendar} description="Na agenda do gabinete" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="demandas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="demandas">Demandas</TabsTrigger>
          <TabsTrigger value="eleitores">Eleitores</TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
        </TabsList>

        <TabsContent value="demandas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Próximas Demandas (7 dias)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Nenhuma demanda encontrada para os próximos 7 dias.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="eleitores" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Crescimento de Cadastros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Gráfico de evolução de cadastros (últimos 6 meses)
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agenda" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Eventos do Gabinete</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Nenhum evento agendado.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ranking" className="space-y-4">
          <RankingAssessores />
        </TabsContent>
      </Tabs>

      <AniversariantesDialog open={aniversariantesDialogOpen} onOpenChange={setAniversariantesDialogOpen} />
      <AddDemandaDialog open={novaDemandaDialogOpen} onOpenChange={setNovaDemandaDialogOpen} onDemandaAdded={handleDemandaAdded} />
      <AddEleitoresDialog open={novoEleitorDialogOpen} onOpenChange={setNovoEleitorDialogOpen} onEleitoresAdded={handleEleitoresAdded} />
    </div>;
};
export default Index;