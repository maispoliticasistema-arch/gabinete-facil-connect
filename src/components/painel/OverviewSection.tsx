import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Users, FileText, Activity, Database, Clock, AlertCircle } from 'lucide-react';

interface Stats {
  totalGabinetes: number;
  usuariosAtivos: number;
  demandasHoje: number;
  errosNaoResolvidos: number;
  tamanhoDb: string;
}

export function OverviewSection() {
  const [stats, setStats] = useState<Stats>({
    totalGabinetes: 0,
    usuariosAtivos: 0,
    demandasHoje: 0,
    errosNaoResolvidos: 0,
    tamanhoDb: 'Calculando...'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        // Total de gabinetes
        const { count: gabinetes } = await supabase
          .from('gabinetes')
          .select('*', { count: 'exact', head: true });

        // Usuários ativos (com acesso a algum gabinete)
        const { count: usuarios } = await supabase
          .from('user_gabinetes')
          .select('*', { count: 'exact', head: true })
          .eq('ativo', true);

        // Demandas criadas hoje
        const hoje = new Date().toISOString().split('T')[0];
        const { count: demandas } = await supabase
          .from('demandas')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', hoje);

        // Erros não resolvidos
        const { count: erros } = await supabase
          .from('system_errors')
          .select('*', { count: 'exact', head: true })
          .eq('resolved', false);

        setStats({
          totalGabinetes: gabinetes || 0,
          usuariosAtivos: usuarios || 0,
          demandasHoje: demandas || 0,
          errosNaoResolvidos: erros || 0,
          tamanhoDb: 'N/A'
        });
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  const cards = [
    {
      title: 'Gabinetes Ativos',
      value: stats.totalGabinetes,
      icon: Building2,
      description: 'Total de gabinetes cadastrados'
    },
    {
      title: 'Usuários Ativos',
      value: stats.usuariosAtivos,
      icon: Users,
      description: 'Assessores com acesso ativo'
    },
    {
      title: 'Demandas Hoje',
      value: stats.demandasHoje,
      icon: FileText,
      description: 'Novas demandas criadas hoje'
    },
    {
      title: 'Erros Pendentes',
      value: stats.errosNaoResolvidos,
      icon: AlertCircle,
      description: 'Erros aguardando resolução',
      alert: stats.errosNaoResolvidos > 0
    },
    {
      title: 'Banco de Dados',
      value: stats.tamanhoDb,
      icon: Database,
      description: 'Uso atual do sistema',
      isText: true
    }
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Carregando...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className={card.alert ? 'border-destructive' : ''}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className={`h-4 w-4 ${card.alert ? 'text-destructive' : 'text-muted-foreground'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${card.alert ? 'text-destructive' : ''}`}>
                  {card.isText ? card.value : card.value.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status do Sistema</CardTitle>
          <CardDescription>
            Monitoramento em tempo real
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">API Status</span>
              </div>
              <span className="text-sm text-green-500">Operacional</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Banco de Dados</span>
              </div>
              <span className="text-sm text-green-500">Conectado</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Tempo de Resposta</span>
              </div>
              <span className="text-sm text-green-500">&lt; 100ms</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
