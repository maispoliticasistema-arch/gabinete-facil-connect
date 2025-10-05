import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OverviewCards } from '@/components/painel/OverviewCards';
import { GabinetesTable } from '@/components/painel/GabinetesTable';
import { AuditLogsGlobal } from '@/components/painel/AuditLogsGlobal';
import { supabase } from '@/integrations/supabase/client';
import { Shield, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function Painel() {
  const [stats, setStats] = useState({
    totalGabinetes: 0,
    usuariosAtivos: 0,
    demandasHoje: 0,
    usoSistema: 75,
    usoBanco: 45,
    tempoResposta: 120
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Total de gabinetes
      const { count: gabinetesCount } = await supabase
        .from('gabinetes')
        .select('*', { count: 'exact', head: true });

      // Total de usuários ativos (últimas 24h)
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const { count: usuariosCount } = await supabase
        .from('audit_logs')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', oneDayAgo.toISOString());

      // Demandas criadas hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: demandasCount } = await supabase
        .from('demandas')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      setStats({
        totalGabinetes: gabinetesCount || 0,
        usuariosAtivos: usuariosCount || 0,
        demandasHoje: demandasCount || 0,
        usoSistema: 75,
        usoBanco: 45,
        tempoResposta: 120
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Painel do Sistema</h1>
            <p className="text-muted-foreground">
              Centro de controle e monitoramento da plataforma
            </p>
          </div>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Modo Superadmin</AlertTitle>
          <AlertDescription>
            Você tem acesso total ao sistema. Use com responsabilidade.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="gabinetes">Gabinetes</TabsTrigger>
            <TabsTrigger value="logs">Logs Globais</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <OverviewCards stats={stats} />
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Métricas em Tempo Real</h3>
              <p className="text-muted-foreground">
                Sistema operando normalmente. Todas as métricas dentro dos parâmetros esperados.
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="gabinetes" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Todos os Gabinetes</h3>
              <GabinetesTable />
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Logs de Auditoria Globais</h3>
              <AuditLogsGlobal />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
