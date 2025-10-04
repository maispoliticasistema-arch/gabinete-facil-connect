import { useEffect, useState } from 'react';
import { Users, FileText, Calendar, AlertCircle, TrendingUp, UserPlus } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
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
  const { currentGabinete } = useGabinete();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalEleitores: 0,
    aniversariantes: 0,
    demandasAbertas: 0,
    demandasHoje: 0,
    demandasAtrasadas: 0,
    eventosHoje: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentGabinete) return;

    const fetchStats = async () => {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      try {
        // Total eleitores
        const { count: totalEleitores } = await supabase
          .from('eleitores')
          .select('*', { count: 'exact', head: true })
          .eq('gabinete_id', currentGabinete.gabinete_id);

        // Aniversariantes do dia
        const { count: aniversariantes } = await supabase
          .from('eleitores')
          .select('*', { count: 'exact', head: true })
          .eq('gabinete_id', currentGabinete.gabinete_id)
          .like('data_nascimento', `%-${new Date().toISOString().slice(5, 10)}`);

        // Demandas abertas
        const { count: demandasAbertas } = await supabase
          .from('demandas')
          .select('*', { count: 'exact', head: true })
          .eq('gabinete_id', currentGabinete.gabinete_id)
          .eq('status', 'aberta');

        // Demandas com prazo para hoje
        const { count: demandasHoje } = await supabase
          .from('demandas')
          .select('*', { count: 'exact', head: true })
          .eq('gabinete_id', currentGabinete.gabinete_id)
          .eq('prazo', today)
          .neq('status', 'concluida');

        // Demandas atrasadas
        const { count: demandasAtrasadas } = await supabase
          .from('demandas')
          .select('*', { count: 'exact', head: true })
          .eq('gabinete_id', currentGabinete.gabinete_id)
          .lt('prazo', today)
          .neq('status', 'concluida');

        // Eventos hoje
        const { count: eventosHoje } = await supabase
          .from('agenda')
          .select('*', { count: 'exact', head: true })
          .eq('gabinete_id', currentGabinete.gabinete_id)
          .gte('data_inicio', `${today}T00:00:00`)
          .lt('data_inicio', `${today}T23:59:59`);

        setStats({
          totalEleitores: totalEleitores || 0,
          aniversariantes: aniversariantes || 0,
          demandasAbertas: demandasAbertas || 0,
          demandasHoje: demandasHoje || 0,
          demandasAtrasadas: demandasAtrasadas || 0,
          eventosHoje: eventosHoje || 0,
        });
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        toast({
          title: 'Erro ao carregar dados',
          description: 'Não foi possível carregar as estatísticas do dashboard.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [currentGabinete, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao painel de controle do {currentGabinete?.gabinetes.nome}
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="gap-2">
            <FileText className="h-4 w-4" />
            Nova Demanda
          </Button>
          <Button variant="secondary" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Cadastrar Eleitor
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Total de Eleitores"
          value={stats.totalEleitores}
          icon={Users}
          description="Cadastrados no sistema"
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Aniversariantes Hoje"
          value={stats.aniversariantes}
          icon={Calendar}
          description="Envie suas felicitações!"
        />
        <StatsCard
          title="Demandas Abertas"
          value={stats.demandasAbertas}
          icon={FileText}
          description="Aguardando atendimento"
        />
        <StatsCard
          title="Prazo para Hoje"
          value={stats.demandasHoje}
          icon={AlertCircle}
          description="Demandas com vencimento"
        />
        <StatsCard
          title="Demandas Atrasadas"
          value={stats.demandasAtrasadas}
          icon={AlertCircle}
          description="Requerem atenção urgente"
        />
        <StatsCard
          title="Eventos Hoje"
          value={stats.eventosHoje}
          icon={Calendar}
          description="Na agenda do gabinete"
        />
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
          <Card>
            <CardHeader>
              <CardTitle>Ranking de Assessores</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Desempenho da equipe será exibido aqui.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
